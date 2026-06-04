import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { stripe, CURRENCY } from "@/lib/stripe";
import { db } from "@/db";
import { users, subscriptions } from "@/db/schema";
import { authOptions } from "@/lib/auth";

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

  const priceId = PRICE_ENV[parsed.data.tier];
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
        tier: parsed.data.tier,
        status: "incomplete",
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      currency: CURRENCY,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
      metadata: { userId: session.user.id, tier: parsed.data.tier },
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
