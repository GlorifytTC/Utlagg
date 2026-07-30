import "server-only";
import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, subscriptions, referralRewards } from "@/db/schema";
import { stripe } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { planForTier, type Tier } from "@/lib/plans";
import { tierRank } from "@/lib/features";
import { REFERRAL } from "@/lib/billing/config";
import {
  generateReferralCode,
  normalizeEmail,
  isDisposableEmail,
} from "@/lib/billing/referral-utils";
import {
  applyReferralEvent,
  computeVestsAt,
  type ReferralEvent,
} from "@/lib/billing/referral-state";

/**
 * Referral program (spec §4). Rewards the REFERRER with 14 days of Pro when the
 * user they referred completes their first paid subscription and survives a
 * 30-day hold. Payment on a distinct card is the load-bearing anti-abuse anchor
 * (BankID is disabled). The reward is time-boxed Pro / pushed billing — never a
 * cash payout — so there's no payout or moms/VAT accounting.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Referral codes                                                     */
/* ------------------------------------------------------------------ */

/** Return the user's referral code, generating + persisting one if missing. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const [u] = await db
    .select({ code: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (u?.code) return u.code;

  // Retry on the (astronomically unlikely) unique collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
      return code;
    } catch {
      /* collision — try another */
    }
  }
  throw new Error("could not allocate referral code");
}

export async function referrerIdForCode(code: string): Promise<string | null> {
  const norm = code.trim().toUpperCase();
  if (!norm) return null;
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, norm))
    .limit(1);
  return u?.id ?? null;
}

/* ------------------------------------------------------------------ */
/* Attribution (capture on signup)                                     */
/* ------------------------------------------------------------------ */

/**
 * Record referrer → referred on the referred user's account. Attribution is set
 * ONCE and is immutable; self-referral is rejected outright. Returns true if a
 * new attribution was written. Reward eligibility (caps, ring detection) is
 * evaluated later at first-paid time — attribution itself is cheap and
 * reversible-proof.
 */
export async function captureReferral(input: {
  referredUserId: string;
  refCode: string | null | undefined;
}): Promise<boolean> {
  if (!input.refCode) return false;
  const referrerId = await referrerIdForCode(input.refCode);
  if (!referrerId) return false;
  if (referrerId === input.referredUserId) return false; // self-referral

  // Immutable: only set if not already attributed.
  const res = await db
    .update(users)
    .set({ referredByUserId: referrerId })
    .where(and(eq(users.id, input.referredUserId), sql`${users.referredByUserId} IS NULL`))
    .returning({ id: users.id });

  if (res.length > 0) {
    await logAudit({
      userId: input.referredUserId,
      action: "referral.attributed",
      details: `referrer=${referrerId}`,
    });
    return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Anti-abuse                                                          */
/* ------------------------------------------------------------------ */

/** Shared signup IP or Stripe card fingerprint between the two accounts. */
async function sharesFraudSignals(referrerId: string, referredId: string): Promise<string | null> {
  const [ref] = await db
    .select({ ip: users.signupIp, email: users.emailNormalized })
    .from(users)
    .where(eq(users.id, referrerId))
    .limit(1);
  const [red] = await db
    .select({ ip: users.signupIp, email: users.emailNormalized })
    .from(users)
    .where(eq(users.id, referredId))
    .limit(1);
  if (!ref || !red) return "missing_user";

  if (ref.email && red.email && ref.email === red.email) return "same_email";
  if (ref.ip && red.ip && ref.ip === red.ip) return "same_ip";

  const [refSub] = await db
    .select({ fp: subscriptions.stripeCardFingerprint })
    .from(subscriptions)
    .where(eq(subscriptions.userId, referrerId))
    .limit(1);
  const [redSub] = await db
    .select({ fp: subscriptions.stripeCardFingerprint })
    .from(subscriptions)
    .where(eq(subscriptions.userId, referredId))
    .limit(1);
  if (refSub?.fp && redSub?.fp && refSub.fp === redSub.fp) return "same_card";

  return null;
}

/** Rewarded (non-void) referrals for a referrer since `since`. */
async function rewardedCountSince(referrerId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(referralRewards)
    .where(
      and(
        eq(referralRewards.referrerUserId, referrerId),
        ne(referralRewards.status, "void"),
        gte(referralRewards.createdAt, since),
      ),
    );
  return row?.n ?? 0;
}

async function capsExceeded(referrerId: string): Promise<string | null> {
  const now = Date.now();
  const monthly = await rewardedCountSince(referrerId, new Date(now - 30 * DAY_MS));
  if (monthly >= REFERRAL.monthlyCap) return `monthly_cap(${REFERRAL.monthlyCap})`;
  const annual = await rewardedCountSince(referrerId, new Date(now - 365 * DAY_MS));
  if (annual >= REFERRAL.annualCap) return `annual_cap(${REFERRAL.annualCap})`;
  return null;
}

/* ------------------------------------------------------------------ */
/* Reward trigger — referred user's first paid invoice                 */
/* ------------------------------------------------------------------ */

/**
 * Called from the Stripe webhook when a referred user's FIRST paid invoice
 * settles. Creates a single `pending` reward (idempotent on referredUserId) if
 * the referral clears anti-abuse. Returns the reward id, or null if none.
 */
export async function onReferredFirstPaid(input: {
  referredUserId: string;
  invoiceId: string;
  eventId: string;
}): Promise<string | null> {
  const [referred] = await db
    .select({
      referredBy: users.referredByUserId,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, input.referredUserId))
    .limit(1);
  if (!referred?.referredBy) return null;
  const referrerId = referred.referredBy;

  // Already have a reward for this referred user? One conversion → one reward.
  const [existing] = await db
    .select({ id: referralRewards.id })
    .from(referralRewards)
    .where(eq(referralRewards.referredUserId, input.referredUserId))
    .limit(1);
  if (existing) return existing.id;

  // Anti-abuse gates (any failure → flag, no reward).
  const reject = async (reason: string) => {
    await logAudit({
      userId: referrerId,
      action: "referral.reward_rejected",
      details: `referred=${input.referredUserId} reason=${reason}`,
    });
  };

  if (referrerId === input.referredUserId) {
    await reject("self_referral");
    return null;
  }
  if (isDisposableEmail(referred.email)) {
    await reject("disposable_email");
    return null;
  }
  const ring = await sharesFraudSignals(referrerId, input.referredUserId);
  if (ring) {
    await reject(`ring:${ring}`);
    return null;
  }
  const cap = await capsExceeded(referrerId);
  if (cap) {
    await reject(cap);
    return null;
  }

  const now = new Date();
  const vestsAt = computeVestsAt(now, REFERRAL.holdDays);
  try {
    const [row] = await db
      .insert(referralRewards)
      .values({
        referrerUserId: referrerId,
        referredUserId: input.referredUserId,
        status: "pending",
        rewardDays: REFERRAL.rewardDays,
        triggerInvoiceId: input.invoiceId,
        triggerEventId: input.eventId,
        vestsAt,
      })
      .onConflictDoNothing({ target: referralRewards.referredUserId })
      .returning({ id: referralRewards.id });
    if (!row) return null; // conflict — created concurrently
    await logAudit({
      userId: referrerId,
      action: "referral.reward_pending",
      details: `referred=${input.referredUserId} vestsAt=${vestsAt.toISOString()}`,
    });
    return row.id;
  } catch (e) {
    console.error("failed to create referral reward:", e);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Vesting (hold elapsed → grant)                                      */
/* ------------------------------------------------------------------ */

/**
 * Grant all pending rewards whose hold has elapsed. Idempotent: the conditional
 * update (status still 'pending') guarantees at most one grant per reward even
 * if the cron overlaps a webhook.
 */
export async function vestDueReferralRewards(now: Date = new Date()): Promise<number> {
  const due = await db
    .select()
    .from(referralRewards)
    .where(and(eq(referralRewards.status, "pending"), sql`${referralRewards.vestsAt} <= ${now}`));

  let granted = 0;
  for (const reward of due) {
    // Claim the reward atomically — flip pending→granted only if still pending.
    const claimed = await db
      .update(referralRewards)
      .set({ status: "granted", grantedAt: now, updatedAt: now })
      .where(and(eq(referralRewards.id, reward.id), eq(referralRewards.status, "pending")))
      .returning({ id: referralRewards.id });
    if (claimed.length === 0) continue; // someone else claimed it

    try {
      await grantReferralPro(reward.referrerUserId, reward.rewardDays);
      granted++;
      await logAudit({
        userId: reward.referrerUserId,
        action: "referral.reward_granted",
        details: `referred=${reward.referredUserId} days=${reward.rewardDays}`,
      });
    } catch (e) {
      console.error("referral grant failed (marked granted, needs manual review):", e);
      await logAudit({
        userId: reward.referrerUserId,
        action: "referral.grant_failed_manual_needed",
        details: `referred=${reward.referredUserId} err=${String(e)}`,
      });
    }
  }
  return granted;
}

/* ------------------------------------------------------------------ */
/* Void / clawback                                                     */
/* ------------------------------------------------------------------ */

/**
 * Apply a lifecycle event (refund / chargeback / cancel-within-hold / fraud) to
 * the reward tied to a referred user. Voids a pending reward; a fraud event on
 * an already-granted reward triggers a clawback of the granted Pro time.
 */
export async function applyReferralEventForReferred(
  referredUserId: string,
  event: ReferralEvent,
  reason: string,
): Promise<void> {
  const [reward] = await db
    .select()
    .from(referralRewards)
    .where(eq(referralRewards.referredUserId, referredUserId))
    .limit(1);
  if (!reward) return;

  const t = applyReferralEvent(reward.status, event);
  if (t.noop) return;

  await db
    .update(referralRewards)
    .set({
      status: t.next,
      voidedAt: t.next === "void" ? new Date() : reward.voidedAt,
      voidReason: t.next === "void" ? reason : reward.voidReason,
      updatedAt: new Date(),
    })
    .where(eq(referralRewards.id, reward.id));

  if (t.clawback) {
    await clawbackReferralPro(reward.referrerUserId, reward.rewardDays);
  }

  await logAudit({
    userId: reward.referrerUserId,
    action: `referral.reward_${t.next}`,
    details: `referred=${referredUserId} event=${event} reason=${reason}`,
  });
}

/* ------------------------------------------------------------------ */
/* Grant mechanics (time-boxed Pro / pushed billing — never cash)      */
/* ------------------------------------------------------------------ */

async function grantReferralPro(referrerUserId: string, days: number): Promise<void> {
  const [u] = await db
    .select({
      tier: users.subscriptionTier,
      source: users.subscriptionSource,
      grantedUntil: users.subscriptionGrantedUntil,
    })
    .from(users)
    .where(eq(users.id, referrerUserId))
    .limit(1);
  if (!u) return;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, referrerUserId))
    .limit(1);

  // Referrer on a paid Stripe plan (Pro+): push the next billing date out by
  // `days` (a trial extension) rather than granting a lower Pro entitlement.
  const onStripe =
    u.source === "stripe" &&
    !!sub?.stripeSubscriptionId &&
    tierRank(u.tier as Tier) >= tierRank("pro");
  if (onStripe && sub?.stripeSubscriptionId) {
    const current = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const base = Math.max(current.current_period_end, Math.floor(Date.now() / 1000));
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      trial_end: base + days * 24 * 60 * 60,
      proration_behavior: "none",
    });
    return;
  }

  // Otherwise grant / extend a time-boxed Pro entitlement (the existing manual
  // grant machinery; entitlements.ts auto-expires it). Never downgrade a
  // higher manual tier — extend at their current tier if already ≥ Pro.
  const now = Date.now();
  const base =
    u.grantedUntil && new Date(u.grantedUntil).getTime() > now
      ? new Date(u.grantedUntil).getTime()
      : now;
  const newUntil = new Date(base + days * DAY_MS);
  const tier: Tier = tierRank(u.tier as Tier) >= tierRank("pro") ? (u.tier as Tier) : "pro";

  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      subscriptionSource: "referral",
      subscriptionGrantedUntil: newUntil,
      scanLimit: planForTier(tier).scanLimit,
    })
    .where(eq(users.id, referrerUserId));
}

async function clawbackReferralPro(referrerUserId: string, days: number): Promise<void> {
  const [u] = await db
    .select({
      source: users.subscriptionSource,
      grantedUntil: users.subscriptionGrantedUntil,
    })
    .from(users)
    .where(eq(users.id, referrerUserId))
    .limit(1);
  // Only reverse a banked/manual referral grant here. A pushed Stripe billing
  // date can't be cleanly rewound from code — flag it for manual handling.
  if (!u || u.source !== "referral" || !u.grantedUntil) {
    await logAudit({
      userId: referrerUserId,
      action: "referral.clawback_manual_needed",
      details: `days=${days}`,
    });
    return;
  }
  const reduced = new Date(new Date(u.grantedUntil).getTime() - days * DAY_MS);
  await db
    .update(users)
    .set({ subscriptionGrantedUntil: reduced })
    .where(eq(users.id, referrerUserId));
}

/* ------------------------------------------------------------------ */
/* Read model (for the referral dashboard UI)                          */
/* ------------------------------------------------------------------ */

export async function referralSummary(userId: string) {
  const code = await ensureReferralCode(userId);
  const rows = await db
    .select({ status: referralRewards.status })
    .from(referralRewards)
    .where(eq(referralRewards.referrerUserId, userId))
    .orderBy(desc(referralRewards.createdAt));
  const counts: Record<string, number> = {
    pending: 0,
    granted: 0,
    void: 0,
    vested: 0,
  };
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return { code, counts, total: rows.length };
}
