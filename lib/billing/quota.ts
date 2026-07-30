/**
 * Pure scan-quota decision logic (no I/O) — the heart of metering, kept
 * side-effect-free so the taper, credit-ordering and spend-cap rules can be
 * unit-tested in isolation (see tests/unit/quota.test.ts).
 *
 * Consumption order (spec §2–§3):
 *   1. Included monthly plan scans (free, reset each cycle, no roll-over)
 *   2. Purchased credit packs (pre-paid, roll over ≥12 months) — BEFORE overage
 *   3. Auto-overage at the tier's tapered per-scan rate, up to the spend cap
 * Free tier has no overage: it hard-stops at its quota with an upgrade prompt.
 */

export type ConsumeSource = "plan" | "credit" | "overage";

export type ScanReason =
  | "unlimited" // legacy-grandfathered Pro / enterprise — never capped
  | "plan" // within included monthly quota
  | "credit" // paid from a rolled-over credit pack
  | "overage" // billed as tapered per-scan overage
  | "free_hard_stop" // free tier exhausted — no auto-charge, prompt upgrade
  | "spend_cap_reached"; // paid tier hit its overage spend ceiling — stop + notify

export interface ScanDecisionInput {
  /** Legacy-unlimited Pro or an UNLIMITED-quota tier (enterprise). */
  unlimited: boolean;
  /** Scans already counted against the included monthly quota this period. */
  planScansUsed: number;
  /** Included monthly scans for the tier. */
  planLimit: number;
  /** Total unexpired purchased credits available. */
  creditsRemaining: number;
  /** Öre per overage scan for the tier; `null` = tier has no overage (free). */
  overageRateOre: number | null;
  /** Overage öre already accrued this period. */
  overageOreSoFar: number;
  /** Monthly overage spend ceiling in öre. */
  spendCapOre: number;
}

export interface ScanDecision {
  allowed: boolean;
  /** Which balance this scan draws from (null when not allowed). */
  consume: ConsumeSource | null;
  /** Öre to bill for this scan (>0 only when `consume === "overage"`). */
  overageChargeOre: number;
  reason: ScanReason;
}

export function decideScan(i: ScanDecisionInput): ScanDecision {
  if (i.unlimited) {
    return { allowed: true, consume: "plan", overageChargeOre: 0, reason: "unlimited" };
  }

  // 1. Included monthly plan quota.
  if (i.planScansUsed < i.planLimit) {
    return { allowed: true, consume: "plan", overageChargeOre: 0, reason: "plan" };
  }

  // 2. Pre-paid credit packs (before any overage billing).
  if (i.creditsRemaining > 0) {
    return { allowed: true, consume: "credit", overageChargeOre: 0, reason: "credit" };
  }

  // 3a. Free tier hard-stops — never auto-charge an account with no card.
  if (i.overageRateOre == null) {
    return { allowed: false, consume: null, overageChargeOre: 0, reason: "free_hard_stop" };
  }

  // 3b. Paid overage, bounded by the spend cap.
  if (i.overageOreSoFar + i.overageRateOre > i.spendCapOre) {
    return {
      allowed: false,
      consume: null,
      overageChargeOre: 0,
      reason: "spend_cap_reached",
    };
  }

  return {
    allowed: true,
    consume: "overage",
    overageChargeOre: i.overageRateOre,
    reason: "overage",
  };
}
