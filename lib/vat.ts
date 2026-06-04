/**
 * Swedish VAT (moms) engine.
 *
 * Standard rate: 25%.
 * Reduced 12%: restaurant/catering eaten on-site, hotel accommodation,
 *              foodstuffs (groceries) under normal rules.
 * Reduced  6%: books, newspapers, public transport, cultural & sporting events.
 *
 * TEMPORARY MEASURE (Prop. 2025/26:55, approved by Riksdagen 2026-02-25):
 *   Foodstuffs, takeaway food and bottled water are reduced from 12% -> 6%
 *   between 2026-04-01 and 2027-12-31 (inclusive). Alcohol is excluded and
 *   keeps its normal rate. After 2027-12-31 food reverts to 12%.
 *
 * Because the correct rate depends on the transaction DATE, never hard-code a
 * static category->rate map. Always resolve through `resolveVatRate(category, date)`.
 */

export type VatRate = 6 | 12 | 25;

export type VatCategory =
  | "standard" // most goods & services
  | "groceries" // food bought in a store
  | "takeaway" // food to go
  | "restaurant_dinein" // food eaten on-site
  | "hotel"
  | "alcohol"
  | "books_news"
  | "transport"
  | "culture";

// Temporary food VAT cut window (UTC dates, inclusive).
export const FOOD_VAT_CUT_START = new Date("2026-04-01T00:00:00Z");
export const FOOD_VAT_CUT_END = new Date("2027-12-31T23:59:59Z");

export function isInFoodVatCutWindow(date: Date): boolean {
  const t = date.getTime();
  return t >= FOOD_VAT_CUT_START.getTime() && t <= FOOD_VAT_CUT_END.getTime();
}

/**
 * Resolve the statutory VAT rate for a category on a given transaction date.
 */
export function resolveVatRate(
  category: VatCategory,
  date: Date = new Date(),
): VatRate {
  switch (category) {
    case "standard":
    case "alcohol": // excluded from the temporary food cut
      return 25;

    case "restaurant_dinein":
    case "hotel":
      return 12;

    case "books_news":
    case "transport":
    case "culture":
      return 6;

    case "groceries":
    case "takeaway":
      // Normally 12%, temporarily 6% during the cut window.
      return isInFoodVatCutWindow(date) ? 6 : 12;

    default:
      return 25;
  }
}

export const VAT_RATE_OPTIONS: VatRate[] = [6, 12, 25];

/** Round to 2 decimals (öre) using banker-safe rounding. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface VatBreakdown {
  gross: number; // amount including VAT
  net: number; // amount excluding VAT
  vat: number; // VAT portion
  rate: VatRate;
}

/**
 * Given a GROSS amount (what the customer paid, VAT included) and a rate,
 * split out the VAT portion. This is how Swedish receipts are read.
 */
export function vatFromGross(gross: number, rate: VatRate): VatBreakdown {
  const vat = round2((gross * rate) / (100 + rate));
  return { gross: round2(gross), vat, net: round2(gross - vat), rate };
}

/** Given a NET amount (excluding VAT) and a rate, add VAT. */
export function vatFromNet(net: number, rate: VatRate): VatBreakdown {
  const vat = round2((net * rate) / 100);
  return { gross: round2(net + vat), vat, net: round2(net), rate };
}

/**
 * Sanity check: does an extracted (total, vat, rate) triple line up?
 * Returns true if the implied VAT is within a small tolerance of the stated VAT.
 */
export function isVatConsistent(
  total: number,
  vat: number,
  rate: VatRate,
  toleranceSek = 0.5,
): boolean {
  const expected = vatFromGross(total, rate).vat;
  return Math.abs(expected - vat) <= toleranceSek;
}
