import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/** Cancels the active subscription at period end (keeps access until then). */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.status, "active"),
      ),
    )
    .limit(1);

  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Ingen aktiv prenumeration hittades." },
      { status: 409 },
    );
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    console.error("stripe cancel error:", err);
    return NextResponse.json(
      { error: "Kunde inte avsluta prenumerationen hos Stripe." },
      { status: 502 },
    );
  }

  await db
    .update(subscriptions)
    .set({ status: "canceled" })
    .where(eq(subscriptions.id, sub.id));
  await logAudit({
    userId: session.user.id,
    action: "subscription.cancel",
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
