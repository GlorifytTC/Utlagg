import { NextResponse, type NextRequest } from "next/server";
import { pricingV3Enabled } from "@/lib/billing/config";
import { expireDueTrials } from "@/lib/billing/trial";
import { purgeExpiredTrialGuards } from "@/lib/billing/trial-guard";

export const runtime = "nodejs";

/**
 * Daily Pricing V3 maintenance (spec §A/§E):
 *  - lapse no-card trials whose 30-day window has elapsed to read-only (a
 *    backstop; card-required conversions are flipped by the Stripe webhooks), and
 *  - purge pseudonymised trial-guard tokens past their retention expiry.
 *
 * Called with `Authorization: Bearer <CRON_SECRET>`. Suggested schedule: daily.
 * The guard purge always runs (it's harmless when V3 is off); trial expiry is a
 * no-op when V3 is disabled.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const trialsLapsed = pricingV3Enabled() ? await expireDueTrials() : 0;
  const guardsPurged = await purgeExpiredTrialGuards();

  return NextResponse.json({
    ok: true,
    trialsLapsed,
    guardsPurged,
    at: new Date().toISOString(),
  });
}
