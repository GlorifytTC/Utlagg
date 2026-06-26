/**
 * Receipt OCR via paid providers (Google Cloud Vision, OCR.space, Mindee,
 * vision LLM) — server-only, since each needs a secret API key from
 * process.env. The actual text-parsing logic (turning raw OCR text into
 * vendor/date/amount/VAT fields) lives in lib/ocr-parse.ts instead, since
 * that part has no server dependencies and is also used client-side for
 * free, local OCR via Tesseract.js (see lib/ocr-client.ts).
 *
 * For higher accuracy in production, consider Google Document AI's
 * "Expense Parser" or Azure Document Intelligence's prebuilt receipt model,
 * which return structured fields directly. The function signatures below
 * are deliberately provider-agnostic so you can swap the implementation.
 */

export type { ExtractedReceipt } from "./ocr-parse";
export { parseReceiptText, OCR_CONFIDENCE_THRESHOLD } from "./ocr-parse";
import type { ExtractedReceipt } from "./ocr-parse";
import { parseReceiptText as parseReceiptTextImpl } from "./ocr-parse";

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

  return parseReceiptTextImpl(rawText);
}

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
  return parseReceiptTextImpl(rawText);
}


/**
 * Mindee Expense-Receipts API — a receipt-trained model that returns structured
 * fields (vendor, date, total, taxes, org number) directly, instead of us
 * guessing from raw OCR text. Enabled only when MINDEE_API_KEY is set; the
 * caller falls back to OCR.space/Vision if this throws.
 */
export async function runMindee(image: string): Promise<ExtractedReceipt> {
  const key = process.env.MINDEE_API_KEY;
  if (!key) throw new Error("MINDEE_API_KEY not set");

  const base64 = image.replace(/^data:[^;]+;base64,/, "");
  const bytes = Buffer.from(base64, "base64");
  const form = new FormData();
  form.append("document", new Blob([bytes], { type: "image/jpeg" }), "receipt.jpg");

  const res = await fetch(
    "https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict",
    { method: "POST", headers: { Authorization: `Token ${key}` }, body: form },
  );
  if (!res.ok) throw new Error(`Mindee HTTP ${res.status}`);

  // Defensive parsing — field names per Mindee Expense-Receipts v5.
  const json = (await res.json()) as Record<string, unknown>;
  const doc = json?.document as { inference?: { prediction?: Record<string, unknown> } } | undefined;
  const p = (doc?.inference?.prediction ?? {}) as Record<string, unknown>;
  const field = (k: string) => p[k] as { value?: unknown } | undefined;
  const strOf = (k: string): string | null => {
    const v = field(k)?.value;
    return v == null || v === "" ? null : String(v);
  };
  const numOf = (k: string): number | null => {
    const v = field(k)?.value;
    return v == null || v === "" ? null : Number(v);
  };

  const totalAmount = numOf("total_amount");
  const taxes = (Array.isArray(p.taxes) ? p.taxes : []) as Array<{ value?: number; rate?: number }>;
  const firstTax = taxes.find((t) => t && (t.value != null || t.rate != null)) ?? null;

  let vatAmount = numOf("total_tax");
  if (vatAmount == null && firstTax?.value != null) vatAmount = Number(firstTax.value);

  let vatRate: 6 | 12 | 25 | null = null;
  const rate = firstTax?.rate != null ? Number(firstTax.rate) : null;
  if (rate != null) {
    const nearest = [6, 12, 25].reduce((a, b) => (Math.abs(b - rate) < Math.abs(a - rate) ? b : a));
    if (Math.abs(nearest - rate) <= 2) vatRate = nearest as 6 | 12 | 25;
  }

  const regs = (Array.isArray(p.supplier_company_registrations)
    ? p.supplier_company_registrations
    : []) as Array<{ value?: string }>;

  return {
    vendorName: strOf("supplier_name"),
    orgNumber: regs.length ? (regs[0]?.value ?? null) : null,
    receiptNumber: strOf("receipt_number"),
    date: strOf("date"),
    totalAmount,
    vatAmount,
    vatRate,
    rawText: "",
    confidence: 0.95,
  };
}

/**
 * Vision LLM extraction — sends the receipt IMAGE to a multimodal model that
 * reads the layout the way a person would, returning structured fields. This is
 * the most accurate path (handles logos, table-style VAT, cash/change rows).
 * Enabled when OPENAI_API_KEY is set; callers fall back to Mindee/OCR on error.
 */
export async function runVisionLLM(image: string): Promise<ExtractedReceipt> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const dataUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
  const prompt = `You read Swedish receipts (kvitton). Return ONLY a JSON object (no markdown) with exactly these keys:
{
  "vendorName": string|null,     // store/company name, e.g. "Bauhaus", "Willys"
  "orgNumber": string|null,      // Swedish org number like "969630-6944"
  "receiptNumber": string|null,  // kvittonummer / bong / receipt no. if printed
  "date": string|null,           // purchase date as YYYY-MM-DD
  "totalAmount": number|null,    // amount actually PAID (grand total). NOT cash given ("Mottaget"), NOT change ("Åter"/"Växel"), NOT a phone or org number
  "vatRate": number|null,        // main VAT percent: 6, 12 or 25
  "vatAmount": number|null       // VAT amount in kronor ("Moms")
}
Use a dot as the decimal separator. Return null for anything not clearly printed. If several VAT rates appear, pick the main one.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      max_tokens: 500,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You extract structured data from receipt images and reply with JSON only." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(content);
  } catch {
    data = {};
  }
  const num = (v: unknown): number | null => (v == null || v === "" ? null : Number(v));
  const str = (v: unknown): string | null => (v == null || v === "" ? null : String(v));
  let vatRate: 6 | 12 | 25 | null = null;
  const r = num(data.vatRate);
  if (r === 6 || r === 12 || r === 25) vatRate = r;

  return {
    vendorName: str(data.vendorName),
    orgNumber: str(data.orgNumber),
    receiptNumber: str(data.receiptNumber),
    date: str(data.date),
    totalAmount: num(data.totalAmount),
    vatAmount: num(data.vatAmount),
    vatRate,
    rawText: "",
    confidence: 0.97,
  };
}

/**
 * Read a SINGLE field from a small cropped region the user pointed to.
 * Uses the vision LLM when configured (most accurate on a tight crop),
 * otherwise OCR.space. Returns the best-effort plain-text value.
 */
const FIELD_HINTS: Record<string, string> = {
  receiptNumber: "the receipt or invoice number (kvittonummer / fakturanummer / bong)",
  vendorName: "the store or company name",
  date: "the date, formatted as YYYY-MM-DD",
  totalAmount: "the total amount paid, digits only with a dot decimal",
  vatAmount: "the VAT (moms) amount in kronor, digits only with a dot decimal",
  vatRate: "the VAT (moms) percentage, just the number (6, 12 or 25)",
};

export async function readRegion(crop: string, field: string): Promise<string> {
  const hint = FIELD_HINTS[field] ?? "the value";
  const key = process.env.OPENAI_API_KEY;

  if (key) {
    const dataUrl = crop.startsWith("data:") ? crop : `data:image/jpeg;base64,${crop}`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        max_tokens: 60,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `This is a small cropped region of a Swedish receipt. Read ${hint}. Reply with ONLY the value, no labels, no quotes. If nothing is readable, reply with an empty response.`,
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return (json?.choices?.[0]?.message?.content ?? "").trim();
  }

  const r = await runOcrSpace(crop);
  return (r.rawText ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean)[0] ?? "";
}
