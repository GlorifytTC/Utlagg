/**
 * Subscription plans. Prices are in SEK. The actual Stripe Price IDs live in
 * environment variables so the same code works across test/live modes.
 */
import type { subscriptionTier } from "@/db/schema";

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

export const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Gratis",
    priceSek: 0,
    priceLabel: "0 kr",
    scanLimit: 25,
    features: ["25 skanningar/mån", "Grundläggande OCR", "CSV-export"],
  },
  {
    tier: "pro",
    name: "Pro",
    priceSek: 149,
    priceLabel: "149 kr/mån",
    scanLimit: -1,
    stripePriceEnv: "STRIPE_PRICE_PRO",
    highlight: true,
    features: [
      "Obegränsade skanningar",
      "Fortnox-integration",
      "Svensk moms (6/12/25 %)",
      "7-årig revisionslogg",
    ],
  },
  {
    tier: "business",
    name: "Företag",
    priceSek: 299,
    priceLabel: "299 kr/mån",
    scanLimit: -1,
    stripePriceEnv: "STRIPE_PRICE_FORETAG",
    features: [
      "Allt i Pro",
      "Attestflöden",
      "BankID",
      "Milersättning",
      "Koldioxidavtryck",
    ],
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    priceSek: null,
    priceLabel: "Offert",
    scanLimit: -1,
    features: ["Allt i Företag", "SSO", "API", "White-label"],
  },
];

export function planForTier(tier: Tier): Plan {
  return PLANS.find((p) => p.tier === tier) ?? PLANS[0];
}
