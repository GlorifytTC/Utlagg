import { NextResponse } from "next/server";
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

  return NextResponse.json({
    tier: ctx.tier,
    planName: planForTier(ctx.tier).name,
    features: entitlementsFor(ctx.tier),
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
