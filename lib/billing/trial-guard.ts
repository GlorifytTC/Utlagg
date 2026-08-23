import "server-only";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { trialEmailGuard } from "@/db/schema";
import {
  TRIAL_GUARD_RETENTION_MONTHS,
  trialEmailGuardEnabled,
} from "@/lib/billing/config";
import { trialGuardHash } from "@/lib/billing/trial-guard-hash";

export { trialGuardHash };

/**
 * Pseudonymised repeat-trial guard (spec §E). Blocks "delete account → same
 * email starts a new trial" WITHOUT retaining readable personal data after
 * erasure: we keep only an HMAC-SHA256 of the normalised email, with an expiry.
 *
 * FRAMING (do not overclaim): the hash is PSEUDONYMISED personal data processed
 * on legitimate interest (Art. 6.1.f), NOT "anonymous". It stops the lazy
 * same-email path, not a determined abuser with fresh addresses — the
 * card-required trial is the primary control; this is a secondary layer.
 *
 * The HMAC secret is a STABLE server-side secret from the env store
 * (`TRIAL_GUARD_HMAC_SECRET`); rotating it invalidates every stored token. If it
 * is unset the guard fails OPEN (never blocks a legitimate signup) and writes
 * become no-ops — logged so the misconfiguration is visible.
 */

/** ms-safe "now + N months" without pulling in a date lib. */
function retentionExpiry(now: Date): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() + TRIAL_GUARD_RETENTION_MONTHS);
  return d;
}

/**
 * True if this email currently has a non-expired guard token (spec §E.3). Fails
 * open (returns false) when the guard flag is off or no secret is configured.
 */
export async function isTrialEmailBlocked(email: string): Promise<boolean> {
  if (!trialEmailGuardEnabled()) return false;
  const hash = trialGuardHash(email);
  if (!hash) {
    console.warn("TRIAL_GUARD_HMAC_SECRET unset — trial email guard disabled");
    return false;
  }
  const [row] = await db
    .select({ id: trialEmailGuard.id })
    .from(trialEmailGuard)
    .where(
      and(
        eq(trialEmailGuard.emailHash, hash),
        gt(trialEmailGuard.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return !!row;
}

/**
 * Persist the pseudonymised token for an email whose account consumed a trial,
 * called on account deletion BEFORE the account is wiped (spec §E.2). UPSERT on
 * the unique hash so it's idempotent and re-deletion just refreshes the expiry.
 * No-op if the guard is disabled or no secret is configured (fails safe: the
 * erasure still proceeds; we simply can't write the token).
 */
export async function recordTrialGuard(email: string): Promise<boolean> {
  if (!trialEmailGuardEnabled()) return false;
  const hash = trialGuardHash(email);
  if (!hash) {
    console.warn("TRIAL_GUARD_HMAC_SECRET unset — cannot record trial guard token");
    return false;
  }
  const now = new Date();
  await db
    .insert(trialEmailGuard)
    .values({ emailHash: hash, expiresAt: retentionExpiry(now) })
    .onConflictDoUpdate({
      target: trialEmailGuard.emailHash,
      set: { expiresAt: retentionExpiry(now) },
    });
  return true;
}

/**
 * Retention job (spec §E.4): purge tokens past their expiry. Runs on the
 * existing scheduler. Returns the number purged.
 */
export async function purgeExpiredTrialGuards(now: Date = new Date()): Promise<number> {
  const deleted = await db
    .delete(trialEmailGuard)
    .where(lt(trialEmailGuard.expiresAt, now))
    .returning({ id: trialEmailGuard.id });
  return deleted.length;
}
