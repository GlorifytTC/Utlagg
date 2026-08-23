/**
 * Idempotent Stripe product/price setup for Pricing V2 (spec §5).
 *
 * Creates (or reuses) the recurring plan prices for Pro / Business / Max and the
 * one-off credit-pack price, each keyed by a stable `lookup_key` so every
 * environment converges to the same objects and re-runs are safe. Prints the
 * resulting price IDs to paste into your env (STRIPE_PRICE_*).
 *
 * Run:  STRIPE_SECRET_KEY=sk_test_... npm run stripe:setup
 *
 * Amounts come straight from lib/billing/config.ts (öre) — the single source of
 * truth — so this script and the app can never disagree on price.
 */
import Stripe from "stripe";
import { TIERS, CREDIT_PACK } from "@/lib/billing/config";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY is required");
  process.exit(1);
}
const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia", typescript: true });

/** Find an existing active price by lookup_key, or create product+price. */
async function ensurePrice(opts: {
  lookupKey: string;
  productName: string;
  unitAmountOre: number;
  recurring: boolean;
}): Promise<string> {
  const existing = await stripe.prices.list({
    lookup_keys: [opts.lookupKey],
    active: true,
    limit: 1,
  });
  if (existing.data[0]) {
    console.log(`✓ ${opts.lookupKey} already exists → ${existing.data[0].id}`);
    return existing.data[0].id;
  }

  const product = await stripe.products.create({
    name: opts.productName,
    metadata: { lookup_key: opts.lookupKey },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "sek",
    unit_amount: opts.unitAmountOre,
    lookup_key: opts.lookupKey,
    ...(opts.recurring ? { recurring: { interval: "month" } } : {}),
  });
  console.log(`＋ created ${opts.lookupKey} → ${price.id}`);
  return price.id;
}

async function main() {
  const ids: Record<string, string> = {};

  for (const tier of ["starter", "pro", "business", "max"] as const) {
    const cfg = TIERS[tier];
    if (cfg.priceOre == null || !cfg.stripeLookupKey) continue;
    ids[tier] = await ensurePrice({
      lookupKey: cfg.stripeLookupKey,
      productName: `Kvittino ${cfg.name}`,
      unitAmountOre: cfg.priceOre,
      recurring: true,
    });
  }

  ids.creditPack = await ensurePrice({
    lookupKey: CREDIT_PACK.lookupKey,
    productName: `Kvittino ${CREDIT_PACK.scans} skanningar`,
    unitAmountOre: CREDIT_PACK.priceOre,
    recurring: false,
  });

  console.log("\nAdd these to your environment:");
  console.log(`STRIPE_PRICE_STARTER=${ids.starter ?? "(unchanged)"}`);
  console.log(`STRIPE_PRICE_PRO=${ids.pro ?? "(unchanged)"}`);
  console.log(`STRIPE_PRICE_FORETAG=${ids.business ?? "(unchanged)"}`);
  console.log(`STRIPE_PRICE_MAX=${ids.max ?? "(unchanged)"}`);
  console.log(`STRIPE_PRICE_CREDIT_PACK=${ids.creditPack}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("stripe setup failed:", err);
  process.exit(1);
});
