import { NextResponse, type NextRequest } from "next/server";
import { pricingV2Enabled } from "@/lib/billing/config";
import { vestDueReferralRewards } from "@/lib/referrals";

export const runtime = "nodejs";

/**
 * Daily job that vests referral rewards whose 30-day hold has elapsed (spec §4).
 * A reward still `pending` past its `vests_at` (i.e. not voided by a refund /
 * chargeback / cancel during the hold) is granted to the referrer. Idempotent:
 * the grant flips pending→granted under a conditional update, so overlapping
 * runs (or a webhook racing this cron) grant each reward at most once.
 *
 * Called with `Authorization: Bearer <CRON_SECRET>`. Suggested schedule: daily.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!pricingV2Enabled()) {
    return NextResponse.json({ ok: true, granted: 0, skipped: "pricing_v2_disabled" });
  }

  const granted = await vestDueReferralRewards();
  return NextResponse.json({ ok: true, granted, at: new Date().toISOString() });
}
