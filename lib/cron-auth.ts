import crypto from "node:crypto";
import type { NextRequest } from "next/server";

/** Constant-time check of `Authorization: Bearer <CRON_SECRET>`. Fails closed if unset. */
export function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || !auth) return false;
  // Hash first so lengths match and timingSafeEqual can't throw.
  const h = (v: string) => crypto.createHash("sha256").update(v).digest();
  return crypto.timingSafeEqual(h(auth), h(`Bearer ${secret}`));
}
