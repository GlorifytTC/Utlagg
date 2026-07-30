import { NextResponse, type NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { pricingV2Enabled } from "@/lib/billing/config";
import { closeOutEndedPeriods } from "@/lib/billing/overage";

export const runtime = "nodejs";

/**
 * Monthly reset of per-user scan counters. Vercel Cron calls this with
 * `Authorization: Bearer <CRON_SECRET>` (set CRON_SECRET in env).
 * Schedule lives in vercel.json ("0 0 1 * *" = 1st of each month, 00:00 UTC).
 *
 * Under PRICING_V2 the monthly plan quota resets implicitly: scan_usage rows are
 * keyed by billing period, so a new period gets a fresh row automatically. This
 * job then only needs to (a) keep the legacy counter reset for flag-off
 * environments and (b) close out ended periods — report accrued overage to
 * Stripe and fire upgrade nudges.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Reset the legacy flat counter. Unlimited tiers (scan_limit = -1) never
  // increment anyway, so this is a no-op for them but keeps usage_reset_at fresh.
  await db.update(users).set({ scansUsedThisMonth: 0, usageResetAt: sql`now()` });

  let overage: { flushed: number; nudged: number } | null = null;
  if (pricingV2Enabled()) {
    overage = await closeOutEndedPeriods();
  }

  return NextResponse.json({
    ok: true,
    resetAt: new Date().toISOString(),
    overage,
  });
}
