/**
 * Account access-state resolution (Pricing V3 §A/§C) — pure, no I/O, so the
 * trial / read-only / lapse rules can be unit-tested in isolation.
 *
 * One function decides three things every gate needs to agree on:
 *   - the ACCESS STATE (active | trial | read_only), and
 *   - the ENTITLED TIER (what feature/scan entitlement actually applies).
 *
 * The trial grants the FULL Pro entitlement for its duration regardless of the
 * plan the user picked to convert to (spec §3.3), so a trialing account is
 * entitled as `pro` even if `post_trial_plan` is Starter.
 *
 * When Pricing V3 is disabled we ignore the trial/read-only specifics and fall
 * back to the V2 behaviour (tier as-is, always "active"), so V3 is independently
 * rollback-able (spec §0 feature-flag rule).
 */
import type { Tier } from "@/lib/plans";

/** subscription_status values that participate in V3 state resolution. */
export type SubscriptionStatusLike = string;

export type AccessState = "active" | "trial" | "read_only";

export interface AccountStateInput {
  subscriptionTier: Tier;
  subscriptionStatus: SubscriptionStatusLike;
  subscriptionPaused: boolean;
  subscriptionGrantedUntil: Date | null;
  /** End of the current trial, if any. An elapsed trial → read-only. */
  trialEndsAt: Date | null;
  /** Pricing V3 master flag — when false, legacy V2 behaviour. */
  v3Enabled: boolean;
  now?: Date;
}

export interface AccountState {
  state: AccessState;
  /** The tier whose entitlement/quota actually applies right now. */
  entitledTier: Tier;
}

export function resolveAccountState(i: AccountStateInput): AccountState {
  const now = i.now ?? new Date();

  // ---- Legacy path: V3 off → V2 behaviour (no trial / read-only states). ----
  if (!i.v3Enabled) {
    return { state: "active", entitledTier: legacyEffectiveTier(i, now) };
  }

  // ---- Explicit read-only (lapsed paid, or a flipped expired trial). --------
  if (i.subscriptionStatus === "read_only") {
    return { state: "read_only", entitledTier: i.subscriptionTier };
  }

  // ---- Trial. ---------------------------------------------------------------
  if (i.subscriptionStatus === "trialing") {
    // Trial window elapsed but the webhook/cron hasn't flipped it yet: treat as
    // read-only NOW so entitlement never lingers past the trial end.
    if (i.trialEndsAt && i.trialEndsAt.getTime() <= now.getTime()) {
      return { state: "read_only", entitledTier: i.subscriptionTier };
    }
    // Active trial → full Pro entitlement (spec §3.1/§3.3).
    return { state: "trial", entitledTier: "pro" };
  }

  // ---- Otherwise active, honouring pause + expired manual grant (V2 rules). --
  return { state: "active", entitledTier: legacyEffectiveTier(i, now) };
}

/** V2 effective-tier rules: expired manual grant or pause → free. */
function legacyEffectiveTier(
  i: Pick<
    AccountStateInput,
    "subscriptionTier" | "subscriptionPaused" | "subscriptionGrantedUntil"
  >,
  now: Date,
): Tier {
  const grantExpired =
    !!i.subscriptionGrantedUntil &&
    new Date(i.subscriptionGrantedUntil).getTime() < now.getTime();
  if (grantExpired) return "free";
  if (i.subscriptionPaused) return "free";
  return i.subscriptionTier;
}

/** Convenience: is the account allowed to CREATE new data (scan/upload)? */
export function isReadOnly(state: AccessState): boolean {
  return state === "read_only";
}
