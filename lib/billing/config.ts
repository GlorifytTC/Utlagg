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

/* ------------------------------------------------------------------ */
/* Pricing V3 rollout flags (Trial + Starter + export gating)          */
/* ------------------------------------------------------------------ */

/**
 * Master switch for the Pricing V3 rework (one-time 30-day Trial replacing the
 * recurring Free plan, the new Starter tier, lapse→read-only, export gating and
 * the repeat-trial email guard). Independently toggleable from V2 so the metered
 * engine (caps/overage/credits/referrals) can stay live while V3 is dark, and so
 * V3 can be rolled back without touching V2. When off, none of the trial /
 * read-only / Starter logic takes effect and the app behaves exactly as V2.
 */
export function pricingV3Enabled(): boolean {
  return process.env.PRICING_V3_ENABLED === "true";
}

/**
 * Gate premium/SIE exports behind an active subscription when an account is in
 * read-only / lapsed / expired-trial state (spec §C). Independently
 * toggleable/rollback-able. CSV + original-file download are NEVER gated by this
 * flag — that invariant lives in {@link ALWAYS_AVAILABLE_EXPORTS} and the
 * canUseExport helper, not here.
 */
export function exportGatingEnabled(): boolean {
  return process.env.EXPORT_GATING_ENABLED === "true";
}

/**
 * Enable the pseudonymised email-hash guard that blocks "delete account → same
 * email starts a new trial" (spec §E). Independently toggleable.
 */
export function trialEmailGuardEnabled(): boolean {
  return process.env.TRIAL_EMAIL_GUARD_ENABLED === "true";
}

/**
 * Card-required trial (spec §3.3, default TRUE). With BankID down, requiring a
 * card at trial start makes payment the identity anchor and neutralises
 * new-email trial farming. Set `TRIAL_REQUIRE_CARD=false` for the no-card
 * variant (which still expires to read-only lockout — never to reusable free
 * scans).
 */
export function trialRequireCard(): boolean {
  return process.env.TRIAL_REQUIRE_CARD !== "false";
}

/** All monthly resets and hold-period math use Swedish wall-clock time. */
export const BILLING_TIMEZONE = "Europe/Stockholm";

/* ------------------------------------------------------------------ */
/* Trial (spec §A) — one-time, 30 days, full Pro entitlement           */
/* ------------------------------------------------------------------ */

/** Trial length in days (spec §3.1). ToS §F.2 quotes "trettio (30)". */
export const TRIAL_DAYS = intFromEnv("TRIAL_DAYS", 30);
/** Included scans during the trial — full Pro entitlement, no overage. */
export const TRIAL_SCANS = intFromEnv("TRIAL_SCANS", 500);
/**
 * The plan a card-required trial converts to when the user didn't actively pick
 * one at checkout (spec §13.2, default Pro). Full Pro entitlement applies during
 * the trial regardless of this.
 */
export const POST_TRIAL_DEFAULT_PLAN: Tier = "pro";

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
  /**
   * Whether this tier can be picked at checkout / shown on the pricing page as
   * an offerable plan. Free is a deprecated V2 tombstone (spec §7): the enum
   * value and live rows are retained for referential integrity until migrated,
   * but it is NEVER offered again — the one-time Trial replaces it.
   * @deprecated `free` is not an offerable plan under Pricing V3.
   */
  selectable: boolean;
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
    // Deprecated V2 tombstone (spec §7): retained for existing rows, never offered.
    selectable: false,
  },
  starter: {
    tier: "starter",
    name: "Starter",
    priceOre: 5_000, // 50 kr
    monthlyScans: 100,
    seats: 1,
    overageOrePerScan: 50, // 0.50 kr/scan (spec §2 taper)
    stripeLookupKey: "kvittino_starter_monthly",
    selectable: true,
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
    selectable: true,
  },
  business: {
    tier: "business",
    name: "Företag",
    priceOre: 29_900, // 299 kr
    monthlyScans: 1_500,
    seats: 10, // 5–10 seats; enforced max is 10
    overageOrePerScan: 29, // 0.29 kr/scan
    stripeLookupKey: "kvittino_business_monthly",
    selectable: true,
  },
  max: {
    tier: "max",
    name: "Max",
    priceOre: 69_900, // 699 kr
    monthlyScans: 5_000,
    seats: UNLIMITED, // multi
    overageOrePerScan: 19, // 0.19 kr/scan
    stripeLookupKey: "kvittino_max_monthly",
    selectable: true,
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    priceOre: null, // consultation / offert
    monthlyScans: UNLIMITED,
    seats: UNLIMITED,
    overageOrePerScan: null,
    stripeLookupKey: null,
    selectable: true, // contact-sales, but shown on the pricing page
  },
};

/** Single config constant for the free quota (spec §2.4). Change it here only. */
export const FREE_MONTHLY_SCANS = TIERS.free.monthlyScans;

/** Ascending rank — used for upgrade nudges ("next tier up"). */
export const TIER_ORDER: Tier[] = [
  "free",
  "starter",
  "pro",
  "business",
  "max",
  "enterprise",
];

/** Offerable plans, in display order (Free tombstone excluded — spec §7). */
export const SELECTABLE_TIERS: Tier[] = TIER_ORDER.filter(
  (t) => TIERS[t].selectable,
);

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
/* Export gating (spec §C) — the legal guardrail lives here            */
/* ------------------------------------------------------------------ */

/**
 * Canonical export format identifiers used by {@link canUseExport}
 * (lib/billing/export-gating.ts). Every export entry point maps its output to
 * one of these — no inline format string checks anywhere else.
 */
export type ExportFormat =
  | "csv"
  | "original_files"
  | "sie"
  | "sie4"
  | "pdf"
  | "premium_pdf"
  | "integration_fortnox";

/**
 * Formats gated behind an ACTIVE paid subscription / active trial (spec §C.2).
 * Blocked in read-only / lapsed / expired-trial state. `integration_*` covers
 * every accounting-integration export (Fortnox today).
 *
 * ⚠️ Adding a format here that a user needs to satisfy their 7-year archiving
 * duty (Bokföringslagen) is a legal-exposure change — CSV and original files
 * must never appear here. See ALWAYS_AVAILABLE_EXPORTS.
 */
export const GATED_EXPORT_FORMATS: ExportFormat[] = [
  "sie",
  "sie4",
  "premium_pdf",
  "integration_fortnox",
];

/**
 * Formats that MUST remain available even in read-only / lapsed state (spec §C
 * CRITICAL GUARDRAIL). The user may hold the only copy of records they are
 * legally required to keep for 7 years, so a complete machine-readable export
 * and the original files can never be gated.
 */
export const ALWAYS_AVAILABLE_EXPORTS: ExportFormat[] = ["csv", "original_files"];

/* ------------------------------------------------------------------ */
/* Repeat-trial email guard (spec §E)                                  */
/* ------------------------------------------------------------------ */

/**
 * How long a pseudonymised trial-guard token is retained after account deletion
 * (spec §E.2 / §8; default 24 months). MUST stay consistent with the "tjugofyra
 * (24) månader" figure in the Privacy Policy clause F.5 — note the coupling in
 * the PR. The HMAC secret itself (`TRIAL_GUARD_HMAC_SECRET`) is a stable
 * server-side secret from the env store; rotating it invalidates the table.
 */
export const TRIAL_GUARD_RETENTION_MONTHS = intFromEnv(
  "TRIAL_GUARD_RETENTION_MONTHS",
  24,
);

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
   * Referred-user welcome bonus is OUT OF SCOPE for now. Extension point only.
   * Under Pricing V3 referred users land in the one-time 30-day Trial (not Free)
   * like everyone else; the referrer reward still vests on the referred user's
   * first PAID conversion after the hold (spec §11), i.e. on trial→paid, not on
   * trial start. Default unchanged.
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
