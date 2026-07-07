import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lists the user's subscription invoices straight from Stripe. Stripe is the
 * source of truth (numbered invoices + PDFs are generated there), so nothing
 * is stored locally.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  // No Stripe customer yet (free tier) or Stripe not configured: empty list,
  // not an error — the UI just shows the empty state.
  if (!sub?.stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ invoices: [] });
  }

  try {
    const list = await stripe.invoices.list({
      customer: sub.stripeCustomerId,
      limit: 24,
    });

    const invoices = list.data
      .filter((inv) => inv.status !== "draft" && inv.status !== "void")
      .map((inv) => ({
        id: inv.id,
        number: inv.number,
        created: inv.created * 1000,
        amount: inv.status === "paid" ? inv.amount_paid : inv.amount_due,
        currency: inv.currency,
        status: inv.status,
        hostedUrl: inv.hosted_invoice_url ?? null,
        pdfUrl: inv.invoice_pdf ?? null,
      }));

    return NextResponse.json({ invoices });
  } catch (err) {
    console.error("invoice list error:", err);
    return NextResponse.json(
      { error: "Kunde inte hämta fakturor" },
      { status: 502 },
    );
  }
}
