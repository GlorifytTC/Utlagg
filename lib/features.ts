import { PLANS, type Tier } from "@/lib/plans";

/** Premium features that require a paid tier. */
export type Feature = "fortnox" | "mileage" | "approvals" | "invoicing";

const TIER_ORDER: Tier[] = ["free", "pro", "business", "enterprise"];
export function tierRank(t: Tier): number {
  const i = TIER_ORDER.indexOf(t);
  return i === -1 ? 0 : i;
}

/** Minimum tier required per feature (matches the pricing page). */
export const FEATURE_MIN_TIER: Record<Feature, Tier> = {
  fortnox: "pro", // Pro+
  mileage: "business", // Företag+
  approvals: "business", // Företag+
  invoicing: "pro", // Pro+ (kundfakturor)
};

export const FEATURE_LABEL: Record<Feature, string> = {
  fortnox: "Fortnox-integration",
  mileage: "Milersättning",
  approvals: "Attestflöden",
  invoicing: "Fakturering",
};

export function hasFeature(tier: Tier, feature: Feature): boolean {
  return tierRank(tier) >= tierRank(FEATURE_MIN_TIER[feature]);
}

/** Plan name for the tier a feature unlocks at (for upsell copy). */
export function requiredPlanName(feature: Feature): string {
  const t = FEATURE_MIN_TIER[feature];
  return PLANS.find((p) => p.tier === t)?.name ?? t;
}

/** All features → entitlement booleans for a tier (used by /api/me + UI). */
export function entitlementsFor(tier: Tier): Record<Feature, boolean> {
  return {
    fortnox: hasFeature(tier, "fortnox"),
    mileage: hasFeature(tier, "mileage"),
    approvals: hasFeature(tier, "approvals"),
    invoicing: hasFeature(tier, "invoicing"),
  };
}
