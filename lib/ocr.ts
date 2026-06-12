/**
 * Receipt OCR via Google Cloud Vision (TEXT_DETECTION).
 *
 * Vision returns raw text; it does NOT understand "this is the total" or
 * "this is the VAT". We run lightweight Swedish-aware heuristics over the text
 * to pull out the fields we care about, each with a rough confidence score.
 *
 * For higher accuracy in production, consider Google Document AI's
 * "Expense Parser" or Azure Document Intelligence's prebuilt receipt model,
 * which return structured fields directly. The function signature below is
 * deliberately provider-agnostic so you can swap the implementation.
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

const VISION_URL = "https://vision.googleapis.com/v1/images:annotate";

export async function runOcr(imageBase64: string): Promise<ExtractedReceipt> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_API_KEY is not set");
  }

  // Strip a data-URL prefix if present.
  const content = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const res = await fetch(`${VISION_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content },
          features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vision API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
  };
  const rawText = data.responses?.[0]?.fullTextAnnotation?.text ?? "";

  return parseReceiptText(rawText);
}

/**
 * Free server-side OCR via OCR.space. Runs on the server, so there is NO browser
 * Web Worker and therefore NO Content-Security-Policy issue. Set OCR_SPACE_API_KEY
 * to your own free key (ocr.space/ocrapi); falls back to the demo key otherwise.
 */
export async function runOcrSpace(imageBase64: string): Promise<ExtractedReceipt> {
  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
  const dataUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const form = new URLSearchParams();
  form.set("base64Image", dataUrl);
  form.set("language", "swe");
  // Engine 1 supports Swedish ('swe'); Engine 2 rejects it (error E201).
  form.set("OCREngine", "1");
  form.set("scale", "true");
  form.set("detectOrientation", "true");
  form.set("isOverlayRequired", "false");

  const res = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`OCR.space error ${res.status}`);

  const data = (await res.json()) as {
    ParsedResults?: Array<{ ParsedText?: string }>;
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string | string[];
  };
  if (data.IsErroredOnProcessing) {
    throw new Error(
      Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join("; ") : data.ErrorMessage ?? "OCR failed",
    );
  }
  const rawText = data.ParsedResults?.[0]?.ParsedText ?? "";
  return parseReceiptText(rawText);
}

/* ----------------------- heuristic parsing ----------------------- */

// Amount with optional thousands separators and optional 1-2 decimal digits.
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
  [/bauhaus/i, "Bauhaus"],
  [/willy.?s|willy/i, "Willys"],
  [/\bica\b/i, "ICA"],
  [/\bcoop\b/i, "Coop"],
  [/hemköp|hemkop/i, "Hemköp"],
  [/citygross|city gross/i, "City Gross"],
  [/lidl/i, "Lidl"],
  [/\bk-?rauta|krauta/i, "K-Rauta"],
  [/byggmax/i, "Byggmax"],
  [/jula\b/i, "Jula"],
  [/clas ohlson/i, "Clas Ohlson"],
  [/circle ?k|statoil|preem|\bokq8\b|shell/i, "Drivmedel"],
  [/pressbyrån|pressbyran|7-?eleven/i, "Pressbyrån"],
  [/espresso house|wayne|starbucks/i, "Café"],
  [/elgiganten|media ?markt|power\b|netonnet/i, "Elektronik"],
  [/apoteket|apotek hjärtat|kronans/i, "Apotek"],
  [/\bsj\b|\bvy\b|\bsl\b|taxi|uber|bolt/i, "Resa"],
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

export function parseReceiptText(rawText: string): ExtractedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = rawText.toLowerCase();

  let confidenceHits = 0;
  const totalSignals = 4;

  // --- Receipt / kvitto number (only when clearly labelled) ---
  const recM = rawText.match(/(?:kvitto\s*(?:nr|nummer)?|kvittonr|bong|kassakvitto|receipt|kassa\s*nr)\s*[:.#]?\s*(\d{2,})/i);
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
    vendorName =
      lines.find(
        (l) =>
          /[A-Za-zÅÄÖåäö]{3,}/.test(l) &&
          !/^\d{1,2}[:.]\d{2}/.test(l) &&
          !looksLikePhoneOrgOrUrl(l) &&
          !/\b\d{4,}\b/.test(l), // skip lines dominated by long numbers
      ) ?? lines[0] ?? null;
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
  const EXCLUDE_RE = /moms|netto|brutto|mottaget|kontant|\båter\b|växel|change|tillbaka|öresavrund|avrund/i;
  const totalCandidates = lines.filter(
    (l) => TOTAL_RE.test(l) && !EXCLUDE_RE.test(l) && decimalAmountOnLine(l) != null,
  );
  if (totalCandidates.length) {
    // The "att betala/total" total is usually the largest such labelled amount.
    totalAmount = Math.max(...totalCandidates.map((l) => decimalAmountOnLine(l)!));
  }
  if (totalAmount == null) {
    // Fallback: largest decimal amount that isn't on a phone/org line.
    const candidates: number[] = [];
    for (const l of lines) {
      if (looksLikePhoneOrgOrUrl(l)) continue;
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
