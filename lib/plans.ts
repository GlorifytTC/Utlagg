/**
 * Subscription plans — the consumer-facing view of the tier table.
 *
 * Prices, quotas and Stripe lookup keys are the SINGLE SOURCE OF TRUTH in
 * lib/billing/config.ts; this module only adds display copy (feature bullet
 * lists, price labels) on top of it so the pricing page and plan-selector UI
 * render from config and can never drift from what the metering code enforces.
 */
import type { subscriptionTier } from "@/db/schema";
import {
  TIERS,
  TIER_ORDER,
  UNLIMITED,
  formatOre,
  type TierConfig,
} from "@/lib/billing/config";

export type Tier = (typeof subscriptionTier.enumValues)[number];

export interface Plan {
  tier: Tier;
  name: string;
  priceSek: number | null; // null = custom / contact sales
  priceLabel: string;
  scanLimit: number; // -1 = unlimited
  features: string[];
  stripePriceEnv?: "STRIPE_PRICE_PRO" | "STRIPE_PRICE_FORETAG";
  highlight?: boolean;
}

/** Feature bullet copy per tier (Swedish). Display only. */
const FEATURES: Record<Tier, string[]> = {
  free: ["15 skanningar/mån", "Grundläggande OCR", "CSV-export"],
  pro: [
    "500 skanningar/mån",
    "SIE/PDF-export, moms & BAS",
    "Milersättning",
    "Fortnox-integration",
    "7-årig revisionslogg",
  ],
  business: [
    "1 500 skanningar/mån (delas i teamet)",
    "Allt i Pro",
    "5–10 användare, roller",
    "Attestflöden",
    "Bokföringsintegrationer",
  ],
  max: [
    "5 000 skanningar/mån (delas i teamet)",
    "Allt i Företag",
    "Flera klienter",
    "Prioriterad support",
  ],
  // Enterprise: contact-sales only. Do NOT list SSO/API/white-label as live —
  // they are roadmap items, not built features.
  enterprise: [
    "Allt i Max",
    "Skräddarsydda volymer",
    "Dedikerad kontakt (offert)",
  ],
};

function priceLabel(c: TierConfig): string {
  if (c.priceOre == null) return "Offert";
  if (c.priceOre === 0) return "0 kr";
  return `${formatOre(c.priceOre)}/mån`;
}

function toPlan(c: TierConfig): Plan {
  const scanLimit = c.monthlyScans === UNLIMITED ? -1 : c.monthlyScans;
  const stripePriceEnv =
    c.tier === "pro"
      ? ("STRIPE_PRICE_PRO" as const)
      : c.tier === "business"
        ? ("STRIPE_PRICE_FORETAG" as const)
        : undefined;
  return {
    tier: c.tier,
    name: c.name,
    priceSek: c.priceOre == null ? null : c.priceOre / 100,
    priceLabel: priceLabel(c),
    scanLimit,
    features: FEATURES[c.tier],
    stripePriceEnv,
    highlight: c.highlight,
  };
}

export const PLANS: Plan[] = TIER_ORDER.map((t) => toPlan(TIERS[t]));

export function planForTier(tier: Tier): Plan {
  return PLANS.find((p) => p.tier === tier) ?? PLANS[0];
}
