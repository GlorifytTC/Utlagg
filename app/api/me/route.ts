import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentTier } from "@/lib/entitlements";
import { entitlementsFor } from "@/lib/features";
import { planForTier } from "@/lib/plans";
import { pricingV2Enabled, formatOre } from "@/lib/billing/config";
import { getUsageSnapshot } from "@/lib/billing/metering";
import { ensureReferralCode } from "@/lib/referrals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight entitlements + usage for the client UI (locks, upsell, meter). */
export async function GET() {
  const ctx = await currentTier();
  if (!ctx) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  // Usage meter + referral code (Pricing V2). getUsageSnapshot transparently
  // returns the legacy counter when the flag is off, so this stays correct in
  // both modes.
  const usage = await getUsageSnapshot(ctx.userId).catch(() => null);
  const referralCode = await ensureReferralCode(ctx.userId).catch(() => null);

  // Accountant flag — for showing the "Accountant" nav entry only. Every real
  // accountant authorization check is done server-side by requireAccountant();
  // this value is display-only and deliberately not in the JWT.
  const [u] = await db
    .select({ isAccountant: users.isAccountant })
    .from(users)
    .where(eq(users.id, ctx.userId))
    .limit(1);

  return NextResponse.json({
    tier: ctx.tier,
    planName: planForTier(ctx.tier).name,
    features: entitlementsFor(ctx.tier),
    isAccountant: u?.isAccountant ?? false,
    pricingV2: pricingV2Enabled(),
    referralCode,
    usage: usage
      ? {
          planScansUsed: usage.planScansUsed,
          planLimit: usage.planLimit, // -1 = unlimited
          creditsRemaining: usage.creditsRemaining,
          overageScans: usage.overageScansThisPeriod,
          overageBilled: formatOre(usage.overageOreThisPeriod),
          spendCap: formatOre(usage.spendCapOre),
        }
      : null,
  });
}
