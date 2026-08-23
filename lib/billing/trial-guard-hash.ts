/**
 * Pure hashing for the repeat-trial email guard (spec §E) — no I/O, no
 * `server-only`, no db import, so the normalisation + HMAC behaviour can be
 * unit-tested in isolation (see tests/unit/trial-guard.test.ts).
 *
 * HMAC-SHA256(normalize(email), TRIAL_GUARD_HMAC_SECRET), hex. Normalisation
 * reuses the referral logic (lower-case, trim, strip +alias; Gmail-family
 * dot-stripping) so aliases collapse to one token — defeating the cheapest
 * "same person, new alias" path. Returns null when no secret is configured (the
 * caller then fails open and never blocks a legitimate signup).
 */
import { createHmac } from "node:crypto";
import { normalizeEmail } from "@/lib/billing/referral-utils";

export function trialGuardHash(email: string): string | null {
  const secret = process.env.TRIAL_GUARD_HMAC_SECRET || null;
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(normalizeEmail(email))
    .digest("hex");
}
