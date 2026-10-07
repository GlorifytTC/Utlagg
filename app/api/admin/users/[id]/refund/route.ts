import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { stripe } from "@/lib/stripe";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

// Refunds the charge only; the `charge.refunded` webhook reverses the
// entitlement (credits / boost / subscription) so dashboard refunds behave the same.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const chargeId = typeof body.chargeId === "string" ? body.chargeId : "";
  const amountOre = Number.isInteger(body.amountOre) && body.amountOre > 0 ? body.amountOre : undefined;
  if (!chargeId.startsWith("ch_")) {
    return NextResponse.json({ error: "Ogiltigt chargeId" }, { status: 400 });
  }

  const [sub] = await db
    .select({ customerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, params.id))
    .limit(1);

  try {
    const charge = await stripe.charges.retrieve(chargeId);
    const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
    if (!sub?.customerId || customerId !== sub.customerId) {
      return NextResponse.json({ error: "Betalningen tillhör inte användaren" }, { status: 409 });
    }
    if (charge.refunded) {
      return NextResponse.json({ error: "Redan återbetald" }, { status: 409 });
    }
    await stripe.refunds.create(
      { charge: chargeId, ...(amountOre ? { amount: amountOre } : {}) },
      { idempotencyKey: `admin_refund:${chargeId}:${amountOre ?? "full"}` },
    );
  } catch (err) {
    console.error("admin refund error:", err);
    return NextResponse.json({ error: "Stripe-fel" }, { status: 502 });
  }

  await logAuditEvent({
    userId: session.user!.id,
    action: "admin.refund",
    entityType: "user",
    entityId: params.id,
    details: `charge=${chargeId} amountOre=${amountOre ?? "full"}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true });
}
