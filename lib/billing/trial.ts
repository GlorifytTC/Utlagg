import "server-only";
import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  POST_TRIAL_DEFAULT_PLAN,
  TRIAL_DAYS,
  TRIAL_SCANS,
  pricingV3Enabled,
} from "@/lib/billing/config";
import type { Tier } from "@/lib/plans";
import { isTrialEmailBlocked } from "@/lib/billing/trial-guard";
import { logAudit } from "@/lib/audit";

/**
 * One-time 30-day Trial lifecycle (spec §A). The trial is modelled as a
 * subscription STATUS (`trialing`) rather than a plan enum value (spec §7 /
 * §13.4): during the trial the account is entitled as Pro (see
 * lib/billing/access.ts), hard-stops at TRIAL_SCANS with no overage
 * (lib/billing/metering.ts), and on expiry converts (card-required) or lapses to
 * read-only (spec §C) — never back to reusable free scans.
 */

export type TrialIneligibleReason =
  | "already_consumed" // this account already used its one trial (§A.2)
  | "email_blocked"; // pseudonymised email-guard match (§E)

export interface TrialEligibility {
  eligible: boolean;
  reason?: TrialIneligibleReason;
}

/** ms per day. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Trial eligibility (spec §A.2 + §E.3): no account-level `trial_consumed_at` AND
 * no matching non-expired email-guard row. The email-guard check is skipped when
 * its flag is off. Messaging to the user must be GENERIC (never confirm a prior
 * deleted account) — callers surface a single "not eligible" line, not the
 * reason.
 */
export async function checkTrialEligibility(
  userId: string,
  email: string,
): Promise<TrialEligibility> {
  const [u] = await db
    .select({ consumed: users.trialConsumedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (u?.consumed) return { eligible: false, reason: "already_consumed" };

  if (await isTrialEmailBlocked(email)) {
    return { eligible: false, reason: "email_blocked" };
  }
  return { eligible: true };
}

/**
 * Put an account into the trial state (spec §A). Idempotent on the one-time
 * guard: `trial_consumed_at` is set the first time only and never overwritten,
 * so re-invoking never grants a second trial window silently. Entitlement is
 * full Pro for the trial's duration regardless of `postTrialPlan`.
 *
 * Callers:
 *  - card-required trial: the Stripe webhook (subscription enters `trialing`)
 *  - no-card trial (TRIAL_REQUIRE_CARD=false): signup / migration flow
 */
export async function beginTrialState(input: {
  userId: string;
  postTrialPlan?: Tier;
  /** Trial end; defaults to now + TRIAL_DAYS. Pass the Stripe trial_end when known. */
  trialEndsAt?: Date;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  const trialEndsAt = input.trialEndsAt ?? new Date(now.getTime() + TRIAL_DAYS * DAY_MS);
  const postTrialPlan = input.postTrialPlan ?? POST_TRIAL_DEFAULT_PLAN;

  await db
    .update(users)
    .set({
      // Full Pro entitlement during the trial (access.ts also forces this, but
      // keeping the row coherent avoids surprising admin/UI reads).
      subscriptionTier: "pro",
      subscriptionStatus: "trialing",
      trialStartedAt: now,
      trialEndsAt,
      // Durable one-time guard: set once, never cleared.
      trialConsumedAt: sql`coalesce(${users.trialConsumedAt}, ${now})`,
      postTrialPlan,
      scanLimit: TRIAL_SCANS,
      updatedAt: now,
    })
    .where(eq(users.id, input.userId));

  await logAudit({
    userId: input.userId,
    action: "trial.started",
    details: `ends=${trialEndsAt.toISOString()} postPlan=${postTrialPlan}`,
  });
}

/**
 * Lapse an account to read-only (spec §C). Used when a trial ends without a
 * valid payment, or a paid subscription lapses. Data is NEVER deleted here — the
 * 12-month export ladder (§7) is the only path that removes data. Idempotent.
 */
export async function lapseToReadOnly(userId: string, reason: string): Promise<void> {
  await db
    .update(users)
    .set({ subscriptionStatus: "read_only", updatedAt: new Date() })
    .where(eq(users.id, userId));
  await logAudit({ userId, action: "account.read_only", details: reason });
}

/**
 * Cron backstop: lapse no-card trials whose window elapsed to read-only. A
 * card-required trial that converted has already been flipped to `active` by the
 * conversion webhook; one that failed payment was flipped by
 * `invoice.payment_failed`. This catches the no-card variant (spec §3.3) and any
 * account the webhooks missed. Returns the number lapsed.
 */
export async function expireDueTrials(now: Date = new Date()): Promise<number> {
  if (!pricingV3Enabled()) return 0;
  const due = await db
    .update(users)
    .set({ subscriptionStatus: "read_only", updatedAt: now })
    .where(
      and(
        eq(users.subscriptionStatus, "trialing"),
        lte(users.trialEndsAt, now),
      ),
    )
    .returning({ id: users.id });

  for (const row of due) {
    await logAudit({
      userId: row.id,
      action: "trial.expired_to_read_only",
      details: `at=${now.toISOString()}`,
    });
  }
  return due.length;
}
