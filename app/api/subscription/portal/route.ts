import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Opens a Stripe Customer Portal session (update card, view invoices, cancel).
 * Requires the portal to be configured once in the Stripe dashboard:
 * Settings → Billing → Customer portal.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (!sub?.stripeCustomerId) {
    return NextResponse.json(
      { error: "Ingen betalningsprofil hittades." },
      { status: 409 },
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/subscription`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err) {
    console.error("billing portal error:", err);
    return NextResponse.json(
      { error: "Kunde inte öppna betalningsportalen" },
      { status: 502 },
    );
  }
}
