import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ tier: z.enum(["pro", "business"]) });

const PRICE_ENV: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_FORETAG,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig nivå" }, { status: 400 });
  }
  const tier = parsed.data.tier;

  const priceId = PRICE_ENV[tier];
  if (!priceId) {
    return NextResponse.json(
      { error: "Pris-ID saknas i miljövariabler" },
      { status: 500 },
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    // Reuse an existing Stripe customer if we have one.
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    // Already subscribed? Switch the plan on the existing subscription
    // instead of creating a second one (which would double-bill).
    if (existing?.stripeSubscriptionId) {
      const current = await stripe.subscriptions.retrieve(
        existing.stripeSubscriptionId,
      );
      if (
        current.status === "active" ||
        current.status === "trialing" ||
        current.status === "past_due"
      ) {
        const item = current.items.data[0];
        if (item.price.id === priceId) {
          return NextResponse.json(
            { error: "Du har redan denna plan." },
            { status: 409 },
          );
        }

        try {
          await stripe.subscriptions.update(current.id, {
            items: [{ id: item.id, price: priceId }],
            // Bill the prorated difference immediately so the switch is
            // settled up front rather than lingering until next cycle.
            proration_behavior: "always_invoice",
            payment_behavior: "error_if_incomplete",
            cancel_at_period_end: false,
          });
        } catch (err) {
          if (
            err instanceof Stripe.errors.StripeError &&
            err.code === "card_declined"
          ) {
            return NextResponse.json(
              {
                error:
                  "Betalningen nekades – uppdatera ditt kort och försök igen.",
              },
              { status: 402 },
            );
          }
          throw err;
        }

        // The webhook syncs authoritatively; update optimistically so the
        // UI reflects the new plan on the next render.
        await db
          .update(subscriptions)
          .set({ tier, status: "active" })
          .where(eq(subscriptions.id, existing.id));
        await db
          .update(users)
          .set({ subscriptionTier: tier, subscriptionStatus: "active" })
          .where(eq(users.id, session.user.id));
        await logAudit({
          userId: session.user.id,
          action: "subscription.switch",
          details: `tier=${tier}`,
        });

        return NextResponse.json({ switched: true });
      }
    }

    let customerId = existing?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await db.insert(subscriptions).values({
        userId: session.user.id,
        stripeCustomerId: customerId,
        tier,
        status: "incomplete",
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // Billing address + org-/momsnummer on the invoice — expected by
      // Swedish B2B customers and required for EU reverse charge.
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { name: "auto", address: "auto" },
      allow_promotion_codes: true,
      // Opt-in: requires Stripe Tax to be activated in the dashboard first.
      ...(process.env.STRIPE_TAX_ENABLED === "true"
        ? { automatic_tax: { enabled: true } }
        : {}),
      subscription_data: {
        metadata: { userId: session.user.id, tier },
      },
      success_url: `${baseUrl}/dashboard/subscription?checkout=success`,
      cancel_url: `${baseUrl}/dashboard/subscription?checkout=cancelled`,
      metadata: { userId: session.user.id, tier },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json(
      { error: "Kunde inte starta betalning" },
      { status: 500 },
    );
  }
}
