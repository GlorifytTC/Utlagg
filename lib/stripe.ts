import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY || undefined;
if (!key) {
  // Don't throw at import time in dev so the app still boots without Stripe,
  // but fail loudly when an endpoint actually tries to use it.
  console.warn("STRIPE_SECRET_KEY is not set — Stripe features disabled.");
}

export const stripe = new Stripe(key ?? "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const CURRENCY = "sek";

/** Map a Stripe price ID back to our internal tier. */
export function tierFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_FORETAG) return "business";
  return null;
}
