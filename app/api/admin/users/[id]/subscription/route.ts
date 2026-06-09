import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { planForTier } from "@/lib/plans";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({
  action: z.enum(["grant", "pause", "resume", "revoke"]),
  tier: z.enum(["free", "pro", "business", "enterprise"]).optional(),
  days: z.number().int().positive().max(3650).optional(), // trial length; omit = unlimited
});

/**
 * Full admin control over a user's subscription — including comping a free
 * trial without Stripe.
 *   grant  : set tier (+ optional trial length in days), source='manual'
 *   pause  : suspend premium access (keeps the tier to resume later)
 *   resume : un-pause
 *   revoke : back to free, clears the manual grant
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga fält" }, { status: 400 });

  const [target] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!target) return NextResponse.json({ error: "Användaren hittades inte" }, { status: 404 });

  const { action } = parsed.data;
  let set: Partial<typeof users.$inferInsert> = {};
  let detail: string = action;

  if (action === "grant") {
    const tier = parsed.data.tier ?? "pro";
    const plan = planForTier(tier);
    set = {
      subscriptionTier: tier,
      subscriptionStatus: parsed.data.days ? "trialing" : "active",
      subscriptionSource: "manual",
      subscriptionPaused: false,
      subscriptionGrantedUntil: parsed.data.days
        ? new Date(Date.now() + parsed.data.days * 24 * 60 * 60 * 1000)
        : null,
      scanLimit: plan.scanLimit, // -1 = unlimited for paid tiers
    };
    detail = `grant ${tier}${parsed.data.days ? ` ${parsed.data.days}d` : " (obegränsat)"}`;
  } else if (action === "pause") {
    set = { subscriptionPaused: true };
  } else if (action === "resume") {
    set = { subscriptionPaused: false };
  } else if (action === "revoke") {
    set = {
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      subscriptionSource: null,
      subscriptionGrantedUntil: null,
      subscriptionPaused: false,
      scanLimit: planForTier("free").scanLimit,
    };
  }

  await db.update(users).set(set).where(eq(users.id, params.id));
  await logAuditEvent({
    userId: session.user!.id,
    action: `admin.subscription.${action}`,
    entityType: "user",
    entityId: params.id,
    ipAddress: clientIp(req),
    details: detail,
  });
  return NextResponse.json({ ok: true });
}
