/**
 * Billing / pricing single source of truth (Pricing V2).
 *
 * Every price, quota, overage rate and referral constant used by the metering,
 * overage, credit and referral logic lives here — business code must never hard
 * code a number. Consumer-facing screens read tiers from here too, so the
 * pricing page and the plan gate can never drift apart.
 *
 * MONEY IS IN ÖRE (the smallest SEK unit). 149 kr === 14900 öre. Never store or
 * compute money as a float — integer öre only, format to kronor at the edges.
 *
 * The rollout is gated behind {@link PRICING_V2_ENABLED} so an environment can
 * keep the legacy "unlimited Pro / 25 free scans" behaviour until it flips the
 * flag on. When the flag is off, none of the new caps/overage/referral logic
 * takes effect (see lib/billing/metering.ts and lib/referrals.ts).
 */

import type { Tier } from "@/lib/plans";

/* ------------------------------------------------------------------ */
/* Rollout flag                                                        */
/* ------------------------------------------------------------------ */

/**
 * Master switch for the Pricing V2 behaviour (metered caps, overage, credit
 * packs, referral rewards). Off by default so existing environments and users
 * are never broken by a deploy — flip `PRICING_V2_ENABLED=true` per environment
 * once the Stripe products (see scripts/stripe-setup.ts) exist.
 */
export function pricingV2Enabled(): boolean {
  return process.env.PRICING_V2_ENABLED === "true";
}

/** All monthly resets and hold-period math use Swedish wall-clock time. */
export const BILLING_TIMEZONE = "Europe/Stockholm";

/* ------------------------------------------------------------------ */
/* Tiers                                                               */
/* ------------------------------------------------------------------ */

/** Sentinel used where "no cap" applies (legacy-grandfathered Pro, enterprise). */
export const UNLIMITED = -1;

export interface TierConfig {
  tier: Tier;
  /** Swedish display name. */
  name: string;
  /** Monthly price in öre; `null` = contact-sales / custom. */
  priceOre: number | null;
  /** Included scans per billing period. `UNLIMITED` for enterprise/custom. */
  monthlyScans: number;
  /** Included seats. `UNLIMITED` = "multi" / negotiated. */
  seats: number;
  /**
   * Per-extra-scan overage price in öre once the monthly quota + any purchased
   * credits are exhausted. `null` = no auto-overage (free hard-stops; enterprise
   * is negotiated). Higher tiers get a cheaper per-scan rate (tapered).
   */
  overageOrePerScan: number | null;
  /**
   * Stripe Price lookup_key for the recurring plan price. Resolved to a real
   * price id at runtime (scripts/stripe-setup.ts creates them idempotently).
   * `null` for free / enterprise (no self-serve recurring price).
   */
  stripeLookupKey: string | null;
  highlight?: boolean;
}

/**
 * The full tier table. Order matters: it's the display + rank order.
 *
 * NOTE: enterprise SSO / API / white-label are roadmap / contact-sales only —
 * they are NOT built, so we do not advertise them as live features (see §7.5 of
 * the spec). Feature copy lives in lib/plans.ts which reads from here.
 */
export const TIERS: Record<Tier, TierConfig> = {
  free: {
    tier: "free",
    name: "Gratis",
    priceOre: 0,
    monthlyScans: 15, // FREE_MONTHLY_SCANS — recurring monthly quota, not lifetime
    seats: 1,
    overageOrePerScan: null, // no payment method on file → never auto-charge
    stripeLookupKey: null,
  },
  pro: {
    tier: "pro",
    name: "Pro",
    priceOre: 14_900, // 149 kr
    monthlyScans: 500,
    seats: 1,
    overageOrePerScan: 39, // 0.39 kr/scan
    stripeLookupKey: "kvittino_pro_monthly",
    highlight: true,
  },
  business: {
    tier: "business",
    name: "Företag",
    priceOre: 29_900, // 299 kr
    monthlyScans: 1_500,
    seats: 10, // 5–10 seats; enforced max is 10
    overageOrePerScan: 29, // 0.29 kr/scan
    stripeLookupKey: "kvittino_business_monthly",
  },
  max: {
    tier: "max",
    name: "Max",
    priceOre: 69_900, // 699 kr
    monthlyScans: 5_000,
    seats: UNLIMITED, // multi
    overageOrePerScan: 19, // 0.19 kr/scan
    stripeLookupKey: "kvittino_max_monthly",
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    priceOre: null, // consultation / offert
    monthlyScans: UNLIMITED,
    seats: UNLIMITED,
    overageOrePerScan: null,
    stripeLookupKey: null,
  },
};

/** Single config constant for the free quota (spec §2.4). Change it here only. */
export const FREE_MONTHLY_SCANS = TIERS.free.monthlyScans;

/** Ascending rank — used for upgrade nudges ("next tier up"). */
export const TIER_ORDER: Tier[] = [
  "free",
  "pro",
  "business",
  "max",
  "enterprise",
];

export function tierConfig(tier: Tier): TierConfig {
  return TIERS[tier] ?? TIERS.free;
}

/** The paid tier one step above `tier`, or `null` at the top. */
export function nextTierUp(tier: Tier): Tier | null {
  const i = TIER_ORDER.indexOf(tier);
  if (i === -1) return null;
  for (let j = i + 1; j < TIER_ORDER.length; j++) {
    const t = TIER_ORDER[j];
    if (TIERS[t].priceOre != null) return t; // skip enterprise (no self-serve price)
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Credit packs (spec §3.3)                                            */
/* ------------------------------------------------------------------ */

/**
 * A purchasable one-off pack of scans. Credits are consumed BEFORE overage
 * billing and, being pre-paid, must not expire sooner than 12 months (Swedish
 * consumer-law requirement) — unlike monthly plan scans, they roll over.
 */
export const CREDIT_PACK = {
  lookupKey: "kvittino_credit_pack_100",
  scans: 100,
  priceOre: 5_000, // 50 kr
  /** Minimum shelf life; we set expiry to purchase + this. */
  validMonths: 12,
} as const;

/* ------------------------------------------------------------------ */
/* Overage spend cap (spec §3.4)                                       */
/* ------------------------------------------------------------------ */

/**
 * Default monthly ceiling on auto-billed overage per billing account. When the
 * accrued overage in a period reaches this, we stop auto-billing and notify the
 * user instead of generating a surprise invoice. Each account can adjust it.
 */
export const DEFAULT_OVERAGE_CAP_ORE = 20_000; // 200 kr

/* ------------------------------------------------------------------ */
/* Referral program (spec §4)                                          */
/* ------------------------------------------------------------------ */

export const REFERRAL = {
  /** Days a reward sits in `pending` before it can vest (refund/cancel window). */
  holdDays: intFromEnv("REFERRAL_HOLD_DAYS", 30),
  /** Days of Pro granted to the referrer on vesting. */
  rewardDays: intFromEnv("REFERRAL_REWARD_DAYS", 14),
  /** Max rewarded referrals per referrer per rolling 30 days. */
  monthlyCap: intFromEnv("REFERRAL_MONTHLY_CAP", 5),
  /** Max rewarded referrals per referrer per rolling 365 days. */
  annualCap: intFromEnv("REFERRAL_ANNUAL_CAP", 50),
  /**
   * Referred-user welcome bonus is OUT OF SCOPE for now (spec §4 "out of
   * scope"). Extension point only — keep referred users on standard Free.
   */
  newUserBonusEnabled: process.env.REFERRAL_NEW_USER_BONUS_ENABLED === "true",
} as const;

/** Length of the generated referral code (base32, non-guessable). */
export const REFERRAL_CODE_LENGTH = 10;

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Öre → "1 234 kr" style string (Swedish grouping). Display only. */
export function formatOre(ore: number): string {
  return `${(ore / 100).toLocaleString("sv-SE")} kr`;
}
