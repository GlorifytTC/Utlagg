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
  form.set("OCREngine", "2");
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

export function parseReceiptText(rawText: string): ExtractedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let confidenceHits = 0;
  const totalSignals = 4;

  // Vendor: first line with letters that isn't a time/number row.
  const vendorName =
    lines.find((l) => /[A-Za-zÅÄÖåäö]{3,}/.test(l) && !/^\d{1,2}[:.]\d{2}/.test(l)) ??
    null;
  if (vendorName) confidenceHits++;

  // Date: ISO, dd/mm/yyyy, dd-mm-yyyy, yyyy/mm/dd, dd.mm.yy, etc.
  let date: string | null = null;
  const iso = rawText.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  const dmy = rawText.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  const pad = (s: string) => s.padStart(2, "0");
  if (iso) {
    date = `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  } else if (dmy) {
    const yr = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    date = `${yr}-${pad(dmy[2])}-${pad(dmy[1])}`;
  }
  if (date) confidenceHits++;

  // Total: prefer a labelled line (multilingual); else fall back to the largest
  // amount on the bill, which is the total on the vast majority of receipts.
  let totalAmount: number | null = null;
  const TOTAL_RE =
    /total|totalt|summa|att betala|att\s*betala|grand total|amount due|balance due|to pay|belopp|sum|beløp|yhteensä|gesamt|montant/i;
  const totalLine = [...lines].reverse().find((l) => TOTAL_RE.test(l));
  if (totalLine) {
    const m = totalLine.match(AMOUNT_RE);
    if (m) totalAmount = toNumber(m[1]);
  }
  if (totalAmount == null) {
    const amounts = allAmounts(rawText);
    if (amounts.length) totalAmount = Math.max(...amounts);
  }
  if (totalAmount != null) confidenceHits++;

  // VAT: labelled line (multilingual). Capture rate when it's a known value.
  let vatAmount: number | null = null;
  let vatRate: 6 | 12 | 25 | null = null;
  const vatLine = lines.find((l) => /\bmoms\b|\bvat\b|\btax\b|\bmva\b|\balv\b|\bmwst\b|\btva\b/i.test(l));
  if (vatLine) {
    const rateM = vatLine.match(/(\d{1,2})\s*%/);
    if (rateM) {
      const r = Number(rateM[1]);
      if (r === 6 || r === 12 || r === 25) vatRate = r;
    }
    const amountM = vatLine.match(AMOUNT_RE);
    if (amountM) vatAmount = toNumber(amountM[1]);
    if (vatAmount || vatRate) confidenceHits++;
  }

  const confidence = rawText ? confidenceHits / totalSignals : 0;

  return {
    vendorName,
    date,
    totalAmount,
    vatAmount,
    vatRate,
    rawText,
    confidence: Math.round(confidence * 100) / 100,
  };
}

export const OCR_CONFIDENCE_THRESHOLD = 0.8;
