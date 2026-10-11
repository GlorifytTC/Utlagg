import { NextResponse } from "next/server";
import { checkLimit } from "@/lib/rate-limit";
import { getUsageSnapshot } from "@/lib/billing/metering";

/**
 * Gate for endpoints that cost money or storage (OCR vision calls, uploads):
 * per-user rate limit, plus no use for accounts that can't scan (read-only or
 * out of quota). Scan metering itself stays in createReceipt (single
 * choke-point) - this only stops abuse before the expensive work. Returns a
 * response to send back, or null to proceed.
 */
export async function guardCostlyCall(
  userId: string,
  name: string,
  bucket: "api" | "upload" = "api",
): Promise<NextResponse | null> {
  if (!(await checkLimit(bucket, `${name}:${userId}`))) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen snart." },
      { status: 429 },
    );
  }
  const usage = await getUsageSnapshot(userId);
  if (usage && !usage.allowed) {
    return NextResponse.json(
      { error: usage.message ?? "Skanning är inte tillgänglig för ditt konto.", reason: usage.reason },
      { status: 402 },
    );
  }
  return null;
}
