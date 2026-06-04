import { NextResponse, type NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const runtime = "nodejs";

/**
 * Monthly reset of per-user scan counters. Vercel Cron calls this with
 * `Authorization: Bearer <CRON_SECRET>` (set CRON_SECRET in env).
 * Schedule lives in vercel.json ("0 0 1 * *" = 1st of each month, 00:00 UTC).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Reset everyone's monthly counter. Unlimited tiers (scan_limit = -1) never
  // increment anyway, so this is a no-op for them but keeps usage_reset_at fresh.
  const result = await db
    .update(users)
    .set({ scansUsedThisMonth: 0, usageResetAt: sql`now()` });

  return NextResponse.json({ ok: true, resetAt: new Date().toISOString() });
}
