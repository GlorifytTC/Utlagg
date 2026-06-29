/**
 * Automatically suggests a BAS account (and therefore a spending category)
 * from the vendor name OCR already extracted — so the person doesn't have
 * to manually pick a category on every single receipt. They can always
 * change it afterwards; this is a suggestion, not a lock.
 *
 * Mirrors the merchant names already recognized in lib/ocr.ts's
 * KNOWN_MERCHANTS, mapped forward to the BAS codes in lib/bas.ts. Kept as
 * its own lookup table (rather than baking BAS codes into ocr.ts) so the
 * OCR module stays focused on text extraction and this one stays focused
 * on classification — the two evolve independently.
 */

// Vendor name (as returned by OCR/KNOWN_MERCHANTS or typed by hand) → BAS code.
const VENDOR_TO_BAS: Array<[RegExp, string]> = [
  // Groceries / food shopping → "Kost och logi i Sverige" is meant for
  // travel meals specifically, so everyday grocery shops go to the general
  // goods account instead; restaurants/cafés go to representation.
  [/^(ica|coop|willys|hemköp|city gross|lidl|tempo|gekås)$/i, "4000"],
  [/^café$/i, "6071"], // dine-in coffee/food → representation (deductible)
  [/^pressbyrån$/i, "4000"],
  [/^systembolaget$/i, "4000"],

  // Travel & transport
  [/^resa$/i, "5800"],
  [/^drivmedel$/i, "5611"],
  [/^parkering$/i, "5800"], // parking while traveling on business
  [/^biluthyrning$/i, "5800"],

  // Hotels / lodging — domestic by default; the person can switch to the
  // "abroad" account (5832) themselves if it was an international trip,
  // since OCR alone can't reliably tell domestic vs. foreign.
  [/^hotell$/i, "5831"],

  // Restaurants / fast food — representation, deductible by default.
  [/^restaurang$/i, "6071"],

  // Courier / postage.
  [/^frakt$/i, "6250"],

  // Hardware / building / office supplies
  [/^(biltema|bauhaus|k-rauta|byggmax|jula|rusta|ahlsell|beijer|mekonomen|clas ohlson)$/i, "6110"],
  [/^(ikea|jysk|dollarstore|granngården|plantagen|blomsterlandet)$/i, "5410"],

  // Electronics / IT
  [/^elektronik$/i, "6550"],
  [/^(kjell & company|teknikmagasinet|webhallen)$/i, "6550"],

  // Clothing — no dedicated BAS line in this subset; falls through to "other".

  // Pharmacy / health
  [/^apotek$/i, "6990"],
  [/^vårdtjänst$/i, "6990"],

  // Office supplies (exact match to the real BAS account name/spelling).
  [/^kontorsmateriel$/i, "6110"],

  // Telecom / mobile — recognized merchants map to mobile phone cost;
  // generic operators without a brand match fall through to "other".
  [/^(telia|tele2|tre|telenor|halebop|comviq)$/i, "6212"],

  // Banking fees and similar recurring financial-service line items.
  [/^(swedbank|handelsbanken|seb|nordea|danske bank|klarna)$/i, "6990"],

  // Office/co-working rent.
  [/^kontorshyra$/i, "5010"],

  // Printing services.
  [/^tryck$/i, "6110"],

  // Software / subscriptions (rarely OCR'd from a paper receipt, but
  // covers manually-typed vendor names for SaaS invoices).
  [/^(adobe|microsoft|google|spotify|netflix|github|figma|notion|slack|zoom|dropbox|stripe|vercel|aws|amazon web services)$/i, "6560"],
];

/**
 * Returns a suggested BAS code for a vendor name, or null if nothing
 * matches (the person picks manually in that case, same as today).
 */
export function suggestBasCode(vendorName: string | null | undefined): string | null {
  if (!vendorName) return null;
  const trimmed = vendorName.trim();
  if (!trimmed) return null;
  for (const [re, code] of VENDOR_TO_BAS) {
    if (re.test(trimmed)) return code;
  }
  return null;
}
