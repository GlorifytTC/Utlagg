import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { pricingV2Enabled, CREDIT_PACK } from "@/lib/billing/config";

export const runtime = "nodejs";

/**
 * One-off purchase of a scan credit pack (spec §3.3). Uses a `mode: "payment"`
 * Checkout Session with the credit-pack price; the credits are actually granted
 * from the `checkout.session.completed` webhook (idempotent on the session id),
 * never here, so a user who closes the tab mid-payment is never charged without
 * receiving credits and vice-versa.
 */
export async function POST(req: NextRequest) {
  if (!pricingV2Enabled()) {
    return NextResponse.json({ error: "Ej tillgängligt" }, { status: 404 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRICE_CREDIT_PACK;
  if (!priceId) {
    return NextResponse.json(
      { error: "Pris-ID för krediter saknas i miljövariabler" },
      { status: 500 },
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    // Reuse the existing Stripe customer if we have one (keeps receipts tidy).
    const [existing] = await db
      .select({ customerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      ...(existing?.customerId
        ? { customer: existing.customerId }
        : { customer_email: session.user.email }),
      line_items: [{ price: priceId, quantity: 1 }],
      billing_address_collection: "required",
      ...(process.env.STRIPE_TAX_ENABLED === "true"
        ? { automatic_tax: { enabled: true } }
        : {}),
      // The webhook reads these to grant credits to the right account.
      metadata: {
        userId: session.user.id,
        kind: "credit_pack",
        scans: String(CREDIT_PACK.scans),
        priceOre: String(CREDIT_PACK.priceOre),
      },
      success_url: `${baseUrl}/dashboard/subscription?credits=success`,
      cancel_url: `${baseUrl}/dashboard/subscription?credits=cancelled`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("credit-pack checkout error:", err);
    return NextResponse.json({ error: "Kunde inte starta köp" }, { status: 500 });
  }
}
