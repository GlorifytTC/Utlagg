import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";
import {
  BOOST_PRICE_ORE,
  BOOST_CURRENCY,
  BOOST_DURATION_DAYS,
  getBoostState,
  isBoostActive,
} from "@/lib/accountant-boost";

export const runtime = "nodejs";

/**
 * POST — start a one-time Boost Checkout (49 kr / 7 days). Accountant-only
 * (requireAccountant → 403). The SERVER fixes amount/currency/duration — the
 * browser sends nothing but the request itself, so it can never change the
 * price, currency, duration, or target another accountant (the accountant is
 * the authenticated session, never an input).
 *
 * Mirrors the existing credit-pack checkout: mode "payment", reuse the existing
 * Stripe customer, metadata read by the webhook. Boost is granted ONLY by the
 * verified webhook (idempotent on session id) — never here, never from /success.
 *
 * If the accountant already has an active boost, we refuse a second purchase
 * (simplest safe behavior — avoids ambiguous overlapping expiries).
 */
export async function POST(_req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  if (!acct.email) return NextResponse.json({ error: "E-post saknas" }, { status: 400 });

  if (await isBoostActive(acct.userId)) {
    return NextResponse.json(
      { error: "Du har redan en aktiv boost.", alreadyActive: true },
      { status: 409 },
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const [existing] = await db
      .select({ customerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, acct.userId))
      .limit(1);

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(existing?.customerId
        ? { customer: existing.customerId }
        : { customer_email: acct.email }),
      // Server-defined price data — the browser never supplies amount/currency.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: BOOST_CURRENCY,
            unit_amount: BOOST_PRICE_ORE,
            product_data: {
              name: "Accountant Boost",
              description: `Ökad synlighet i ${BOOST_DURATION_DAYS} dagar`,
            },
          },
        },
      ],
      billing_address_collection: "required",
      ...(process.env.STRIPE_TAX_ENABLED === "true" ? { automatic_tax: { enabled: true } } : {}),
      // The webhook reads these to activate the boost for the right accountant.
      metadata: {
        kind: "accountant_boost",
        accountantId: acct.userId, // from the authenticated session, not input
        durationDays: String(BOOST_DURATION_DAYS),
        priceOre: String(BOOST_PRICE_ORE),
        currency: BOOST_CURRENCY,
      },
      success_url: `${baseUrl}/accountant?boost=processing`,
      cancel_url: `${baseUrl}/accountant?boost=cancelled`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("boost checkout error:", err);
    return NextResponse.json({ error: "Kunde inte starta köp" }, { status: 500 });
  }
}

/** GET — the accountant's authoritative boost state (for the UI). */
export async function GET() {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  return NextResponse.json(await getBoostState(acct.userId));
}
