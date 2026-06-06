import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { stripe } from "@/lib/stripe";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, params.id), eq(subscriptions.status, "active")))
    .limit(1);
  if (!sub?.stripeSubscriptionId) {
    return NextResponse.json({ error: "Ingen aktiv prenumeration" }, { status: 409 });
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    console.error("admin cancel error:", err);
    return NextResponse.json({ error: "Stripe-fel" }, { status: 502 });
  }

  await db.update(subscriptions).set({ status: "canceled" }).where(eq(subscriptions.id, sub.id));
  await logAuditEvent({
    userId: session.user!.id,
    action: "admin.subscription.cancel",
    entityType: "user",
    entityId: params.id,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
