/**
 * Pure, dependency-free Swedish receipt text parsing — no network calls, no
 * process.env, no server-only code. Deliberately split out from lib/ocr.ts
 * (which also contains the paid-API-calling functions: Google Vision,
 * OCR.space, Mindee, the vision LLM) so this can be safely imported into
 * CLIENT components, e.g. to parse text that came back from a local,
 * in-browser OCR engine (Tesseract.js — see lib/ocr-client.ts) without
 * pulling server secrets or fetch-to-external-APIs code into the browser
 * bundle.
 *
 * lib/ocr.ts re-exports everything from here, so server code that already
 * imports from "@/lib/ocr" keeps working unchanged.
 */

export interface ExtractedReceipt {
  vendorName: string | null;
  orgNumber: string | null;
  receiptNumber: string | null;
  date: string | null; // ISO yyyy-mm-dd
  totalAmount: number | null;
  vatAmount: number | null;
  vatRate: 6 | 12 | 25 | null;
  rawText: string;
  confidence: number; // 0..1, aggregate
}

const AMOUNT_RE = /(\d{1,3}(?:[ .,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/;
const AMOUNT_RE_G = new RegExp(AMOUNT_RE.source, "g");

// Handle both EU ("1.234,56") and US ("1,234.56") number formats.
function toNumber(raw: string): number | null {
  let s = raw.replace(/[^\d.,]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 || lastDot > -1) {
    const decSep = lastComma > lastDot ? "," : ".";
    const thouSep = decSep === "," ? "." : ",";
    s = s.split(thouSep).join("");
    s = s.replace(decSep, ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function allAmounts(text: string): number[] {
  const out: number[] = [];
  const matches = text.match(AMOUNT_RE_G) ?? [];
  for (const m of matches) {
    const n = toNumber(m);
    // Ignore bare years / tiny integers that are usually not money.
    if (n != null && n >= 1 && !(Number.isInteger(n) && n >= 1900 && n <= 2100)) {
      out.push(n);
    }
  }
  return out;
}

const KNOWN_MERCHANTS: Array<[RegExp, string]> = [
  [/biltema/i, "Biltema"],
  [/bauhaus/i, "Bauhaus"],
  [/willy.?s|willy/i, "Willys"],
  [/\bica\b/i, "ICA"],
  [/\bcoop\b/i, "Coop"],
  [/hemköp|hemkop/i, "Hemköp"],
  [/citygross|city gross/i, "City Gross"],
  [/lidl/i, "Lidl"],
  [/\btempo\b/i, "Tempo"],
  [/\bk-?rauta|krauta/i, "K-Rauta"],
  [/byggmax/i, "Byggmax"],
  [/\bjula\b/i, "Jula"],
  [/\brusta\b/i, "Rusta"],
  [/dollarstore|dollar store/i, "DollarStore"],
  [/\bikea\b/i, "IKEA"],
  [/\bjysk\b/i, "Jysk"],
  [/ahlsell/i, "Ahlsell"],
  [/beijer/i, "Beijer"],
  [/granngård|granngard/i, "Granngården"],
  [/mekonomen/i, "Mekonomen"],
  [/plantagen/i, "Plantagen"],
  [/blomsterland/i, "Blomsterlandet"],
  [/systembolaget/i, "Systembolaget"],
  [/clas ohlson/i, "Clas Ohlson"],
  [/kjell ?(&|och)? ?company|kjell\.com/i, "Kjell & Company"],
  [/teknikmagasinet/i, "Teknikmagasinet"],
  [/\bxxl\b/i, "XXL"],
  [/stadium/i, "Stadium"],
  [/intersport/i, "Intersport"],
  [/åhléns|ahlens/i, "Åhléns"],
  [/\bgekås|gekas\b/i, "Gekås"],
  [/h\s?&\s?m|hennes ?&? ?mauritz/i, "H&M"],
  [/kappahl/i, "KappAhl"],
  [/lindex/i, "Lindex"],
  [/\bzara\b/i, "Zara"],
  [/\bzara home\b/i, "Zara"],
  [/\bnormal\b/i, "Normal"],
  [/circle ?k|statoil|preem|\bokq8\b|shell|ingo\b|\bst1\b/i, "Drivmedel"],
  [/pressbyrån|pressbyran|7-?eleven/i, "Pressbyrån"],
  [/espresso house|wayne|starbucks/i, "Café"],
  [/elgiganten|media ?markt|power\b|netonnet|webhallen/i, "Elektronik"],
  [/apoteket|apotek hjärtat|kronans|apotea/i, "Apotek"],
  [/\bsj\b|\bvy\b|\bsl\b|taxi|uber|bolt/i, "Resa"],

  // Parking — extremely common on Swedish business-trip receipts and easy
  // to miss without explicit matching, since the printed name is often just
  // the app/operator, not a recognizable "shop".
  [/easypark|parkster|aimo park|apcoa|q-?park|parkman\b/i, "Parkering"],

  // Hotels / lodging — chains common for business travel in Sweden.
  [/scandic|nordic choice|elite hotel|best western|radisson|comfort hotel|quality hotel|clarion hotel|first hotel/i, "Hotell"],

  // Courier / postage — frequent for businesses shipping goods or documents.
  [/postnord|\bdhl\b|\bups\b|bring\b|schenker|instabox|budbee/i, "Frakt"],

  // Car rental.
  [/hertz|avis\b|sixt\b|europcar|mabi hyrbil/i, "Biluthyrning"],

  // Fast food / restaurant chains (representation-style spend, distinct
  // from grocery shopping).
  [/max hamburgare|\bmax\b restaurang|burger king|mcdonald|sibylla|o'?learys/i, "Restaurang"],
];

// A token that is clearly a phone number / org number / postcode, not money.
function looksLikePhoneOrgOrUrl(line: string): boolean {
  return (
    /\b(tlf|tel|telefon|phone|fax)\b/i.test(line) ||
    /\borg\.?\s*nr\b|\bvat\b|momsreg/i.test(line) ||
    /\d{6}-\d{4}\b/.test(line) || // Swedish org/VAT number
    /\bwww\.|\.se\b|\.com\b|@/i.test(line) ||
    /\bS-?\d{3}\s?\d{2}\b/.test(line) // postcode like S-721 38
  );
}

// Largest amount WITH decimals on a single line (totals are written x,xx).
function decimalAmountOnLine(line: string): number | null {
  const matches = line.match(/\d{1,3}(?:[ .]\d{3})*[.,]\d{2}|\d+[.,]\d{2}/g);
  if (!matches) return null;
  const nums = matches.map(toNumber).filter((n): n is number => n != null);
  return nums.length ? Math.max(...nums) : null;
}

// For lines starting with a total/summa label, Swedish receipts often
// format the line as "TOTALT <item count> <amount>,<öre>" (e.g. "TOTALT 3
// 640,00" = 3 items, 640 kr). Plain digit-amount matching reads "3
// 640,00" as ONE number (3640), because Sweden ALSO writes large amounts
// with a space as the thousands separator (e.g. "1 234,56 kr") — the two
// conventions are genuinely ambiguous from the digits alone. This resolves
// it the way a person reading the receipt would: a lone 1-2 digit integer
// immediately after the label, followed by a separate properly-formatted
// amount, is the item count, not part of the price — so it's stripped
// before the amount is extracted.
function totalLineReadings(line: string, totalRe: RegExp): number[] {
  const stripped = line.replace(totalRe, "").trim();
  const leadingCount = stripped.match(/^(\d{1,2})\s+(?=\d)/);
  const readings: number[] = [];
  // Reading A: treat a leading 1-2 digit number as an item count and
  // strip it before reading the amount (handles "TOTALT 3 640,00").
  if (leadingCount) {
    const withoutCount = decimalAmountOnLine(stripped.slice(leadingCount[0].length));
    if (withoutCount != null) readings.push(withoutCount);
  }
  // Reading B: take the line at face value, no stripping (handles a
  // genuine large total like "TOTALT 1 234,56" with no item count at all).
  const direct = decimalAmountOnLine(stripped);
  if (direct != null) readings.push(direct);
  return readings;
}

export function parseReceiptText(rawText: string): ExtractedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = rawText.toLowerCase();

  let confidenceHits = 0;
  const totalSignals = 4;

  // --- Receipt / kvitto number (only when clearly labelled) ---
  // Real receipts vary a lot in how this is printed: "Bongnr", "Bong nr:",
  // "Kvittonummer", "Ordernr", "Transaktion", "Receipt No." — the label and
  // the digits can also land on separate lines after OCR. This matches the
  // label word(s) first, then allows an optional second word (nr/nummer/no),
  // then any punctuation/whitespace (including a line break), then digits.
  const recM = rawText.match(
    /(?:kvitto|bong|kassakvitto|transaktion|order|receipt)\s*(?:nr|nummer|no)?\.?\s*[:.#]?\s*(\d{2,})/i,
  );
  const receiptNumber = recM ? recM[1] : null;

  // --- Org number (Swedish): 6 digits - 4 digits ---
  const orgM = rawText.match(/(\d{6})-(\d{4})/);
  const orgNumber = orgM ? `${orgM[1]}-${orgM[2]}` : null;

  // --- Vendor ---
  let vendorName: string | null = null;
  for (const [re, name] of KNOWN_MERCHANTS) {
    if (re.test(lower)) { vendorName = name; break; }
  }
  if (!vendorName) {
    // Website domain → name (e.g. www.bauhaus.se → Bauhaus).
    const dom = rawText.match(/(?:www\.)?([a-zA-ZåäöÅÄÖ][a-zA-Z0-9åäöÅÄÖ-]{2,})\.(?:se|com|nu)\b/);
    if (dom) vendorName = dom[1].charAt(0).toUpperCase() + dom[1].slice(1);
  }
  if (!vendorName) {
    // Company line near the top: "X SWEDEN AB" / "X Aktiebolag".
    const abLine = lines.slice(0, 8).find(
      (l) => /\b(aktiebolag|AB|HB|KB)\b/.test(l) && !looksLikePhoneOrgOrUrl(l) && /[A-Za-zÅÄÖåäö]{3,}/.test(l),
    );
    if (abLine) {
      vendorName = abLine
        .replace(/\b(sweden|sverige|norge|nordic)\b/gi, "")
        .replace(/\b(aktiebolag|AB|HB|KB)\b\.?/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    }
  }
  if (!vendorName) {
    vendorName =
      lines.find(
        (l) =>
          /[A-Za-zÅÄÖåäö]{3,}/.test(l) &&
          !/^\d{1,2}[:.]\d{2}/.test(l) &&
          !looksLikePhoneOrgOrUrl(l) &&
          !/\b\d{4,}\b/.test(l), // skip lines dominated by long numbers
      ) ?? lines[0] ?? null;
  }
  // Clean leading junk (e.g. a misread "*" from a logo) and trailing noise.
  if (vendorName) {
    vendorName = vendorName.replace(/^[^A-Za-zÅÄÖåäö0-9]+/, "").trim() || vendorName;
  }
  if (vendorName) confidenceHits++;

  // --- Date: ISO, dd/mm/yyyy, dd-mm-yyyy, and footer "DD MM YY" ---
  const pad = (s: string) => s.padStart(2, "0");
  let date: string | null = null;
  const iso = rawText.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  const dmy = rawText.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/);
  if (iso) {
    date = `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  } else if (dmy) {
    const yr = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    date = `${yr}-${pad(dmy[2])}-${pad(dmy[1])}`;
  } else {
    // Space-separated footer date "DD MM YY" (e.g. 29 09 14), maybe + time.
    const sp = rawText.match(/\b(\d{2})\s(\d{2})\s(\d{2})\b/);
    if (sp) {
      const d = +sp[1], mo = +sp[2];
      if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) date = `20${pad(sp[3])}-${pad(sp[2])}-${pad(sp[1])}`;
    }
  }
  if (date) confidenceHits++;

  // --- Total: labelled line with a decimal amount, ignoring change/cash rows ---
  let totalAmount: number | null = null;
  const TOTAL_RE = /\b(total|totalt|att\s*betala|summa|grand total|amount due|to pay)\b/i;
  const EXCLUDE_RE =
    /moms|netto|brutto|mottaget|kontant|\båter\b|\bater\b|växel|vaxel|change|tillbaka|retur|öresavrund|oresavrund|avrund|dragning|växelpengar/i;
  // A line carrying a negative amount is change/refund, never the total.
  const isNegative = (l: string) => /[-−]\s*\d/.test(l);

  // The net subtotal ("Totalsumma netto", "Netto", etc.) has no item-count
  // ambiguity — it's used below to pick the right reading of a TOTALT line
  // when "<item count> <amount>" vs. a genuine 4+ digit total can't be
  // told apart from the digits alone (see totalLineAmount's comment).
  const nettoLine = lines.find((l) => /netto|nettobelopp/i.test(l) && !isNegative(l));
  const nettoAmount = nettoLine ? decimalAmountOnLine(nettoLine) : null;

  const totalLines = lines.filter((l) => TOTAL_RE.test(l) && !EXCLUDE_RE.test(l) && !isNegative(l));
  const readings = totalLines.flatMap((l) => totalLineReadings(l, TOTAL_RE));
  if (readings.length) {
    if (nettoAmount != null) {
      // The real total (incl. VAT) is always >= netto and normally within
      // ~50% of it (VAT in Sweden tops out at 25%) — a reading that's
      // wildly larger is almost certainly the item-count-merge artefact
      // (e.g. "TOTALT 3 640,00" misread as 3640), so prefer the smallest
      // reading that still clears the netto bar.
      const plausible = readings.filter((n) => n >= nettoAmount * 0.99);
      totalAmount = plausible.length ? Math.min(...plausible) : Math.max(...readings);
    } else {
      // No netto line to cross-check against — fall back to the largest
      // reading, same as the original behavior (covers "Totalsumma netto"
      // AND "TOTALT" both matching TOTAL_RE, where the real total is the
      // bigger one).
      totalAmount = Math.max(...readings);
    }
  }
  if (totalAmount == null) {
    // Fallback: largest decimal amount on a line that isn't a phone/org row,
    // a VAT/net/gross breakdown, cash given, change returned, or a negative.
    const candidates: number[] = [];
    for (const l of lines) {
      if (looksLikePhoneOrgOrUrl(l) || EXCLUDE_RE.test(l) || isNegative(l)) continue;
      const a = decimalAmountOnLine(l);
      if (a != null) candidates.push(a);
    }
    if (candidates.length) totalAmount = Math.max(...candidates);
  }
  if (totalAmount != null) confidenceHits++;

  // --- VAT rate + amount ---
  let vatAmount: number | null = null;
  let vatRate: 6 | 12 | 25 | null = null;
  const rateM = rawText.match(/moms%?\s*[:=]?\s*(\d{1,2})|(\d{1,2})\s*%\s*(?:av|moms|vat)/i);
  const rawRate = rateM ? Number(rateM[1] ?? rateM[2]) : null;
  if (rawRate === 6 || rawRate === 12 || rawRate === 25) vatRate = rawRate;
  // VAT amount: a "moms" line (not the "moms%" header) with a decimal amount.
  const momsLine = lines.find(
    (l) => /\bmoms\b/i.test(l) && !/moms%/i.test(l) && !/\bav\b/i.test(l) && decimalAmountOnLine(l) != null,
  );
  if (momsLine) vatAmount = decimalAmountOnLine(momsLine);

  // Cross-fill: if we have two of {total, vatAmount, vatRate} infer the third.
  if (vatRate == null && vatAmount != null && totalAmount != null && totalAmount > vatAmount) {
    const net = totalAmount - vatAmount;
    const pct = (vatAmount / net) * 100;
    const nearest = [6, 12, 25].reduce((a, b) => (Math.abs(b - pct) < Math.abs(a - pct) ? b : a));
    if (Math.abs(nearest - pct) <= 1.5) vatRate = nearest as 6 | 12 | 25;
  }
  if (vatAmount == null && vatRate != null && totalAmount != null) {
    vatAmount = Math.round((totalAmount - totalAmount / (1 + vatRate / 100)) * 100) / 100;
  }

  if (vatAmount != null || vatRate != null) confidenceHits++;

  const confidence = rawText ? confidenceHits / totalSignals : 0;

  return {
    vendorName,
    orgNumber,
    receiptNumber,
    date,
    totalAmount,
    vatAmount,
    vatRate,
    rawText,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export const OCR_CONFIDENCE_THRESHOLD = 0.8;
