import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { planForTier } from "@/lib/plans";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const schema = z.object({ tier: z.enum(["free", "pro", "business", "enterprise"]) });

/**
 * Admin sets a user's subscription tier directly. This is how you grant
 * Enterprise (custom-priced, negotiated off-platform) after closing a deal —
 * the tier immediately unlocks every built premium feature via entitlements.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig nivå" }, { status: 400 });

  const tier = parsed.data.tier;
  const plan = planForTier(tier);
  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: tier === "free" ? "canceled" : "active",
      scanLimit: plan.scanLimit,
    })
    .where(eq(users.id, params.id));

  await logAuditEvent({
    userId: session.user!.id,
    action: "admin.user.set_tier",
    entityType: "user",
    entityId: params.id,
    details: `tier=${tier}`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ ok: true, tier });
}
