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

/* ----------------------- heuristic parsing ----------------------- */

const AMOUNT_RE = /(\d{1,3}(?:[ .]\d{3})*(?:[.,]\d{2}))/;

function toNumber(raw: string): number | null {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}\b)/g, "") // thousands dot
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseReceiptText(rawText: string): ExtractedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let confidenceHits = 0;
  const totalSignals = 4;

  // Vendor: first non-numeric line is a decent guess for the store name.
  const vendorName =
    lines.find((l) => /[A-Za-zÅÄÖåäö]{3,}/.test(l) && !/\d{2}[:.]\d{2}/.test(l)) ??
    null;
  if (vendorName) confidenceHits++;

  // Date: match common Swedish formats yyyy-mm-dd or dd/mm/yyyy.
  let date: string | null = null;
  const isoMatch = rawText.match(/(\d{4})-(\d{2})-(\d{2})/);
  const dmyMatch = rawText.match(/(\d{2})[/.](\d{2})[/.](\d{2,4})/);
  if (isoMatch) {
    date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  } else if (dmyMatch) {
    const yr = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
    date = `${yr}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }
  if (date) confidenceHits++;

  // Total: prefer a line mentioning "total"/"summa"/"att betala".
  let totalAmount: number | null = null;
  const totalLine = lines.find((l) =>
    /total|summa|att betala|totalt/i.test(l),
  );
  const totalSource = totalLine ?? lines.slice(-5).join(" ");
  const totalM = totalSource.match(AMOUNT_RE);
  if (totalM) totalAmount = toNumber(totalM[1]);
  if (totalAmount) confidenceHits++;

  // VAT: line mentioning "moms" / "vat".
  let vatAmount: number | null = null;
  let vatRate: 6 | 12 | 25 | null = null;
  const vatLine = lines.find((l) => /\bmoms\b|\bvat\b/i.test(l));
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
