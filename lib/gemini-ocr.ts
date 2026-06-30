import type { ExtractedReceipt } from "@/lib/ocr-parse";

/**
 * Reads a receipt image with Google Gemini's vision model.
 *
 * Uses the Gemini free tier (Flash / Flash-Lite) by default — no credit
 * card required, ~1,500 requests/day. Unlike Tesseract (which only reads
 * text and cannot understand layout), Gemini actually understands an
 * arbitrary receipt: any vendor, any format, any language, returning
 * structured fields directly.
 *
 * IMPORTANT privacy note: on the FREE tier, Google may use submitted
 * content to improve their models. Receipts contain business financial
 * data, so this is a deliberate tradeoff the operator has chosen. To opt
 * out of training, the project must move to a paid Gemini tier (set
 * GEMINI_PAID=true once billing is enabled) — the code path is identical.
 *
 * Requires GEMINI_API_KEY in the environment (get one free, no card, at
 * https://aistudio.google.com/apikey). If unset, this throws and the
 * caller falls back to free local Tesseract.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

interface GeminiReceiptJson {
  vendorName: string | null;
  orgNumber: string | null;
  date: string | null; // YYYY-MM-DD
  totalAmount: number | null;
  vatAmount: number | null;
  vatRate: number | null; // 6 | 12 | 25 | null
  receiptNumber: string | null;
}

const PROMPT = `Du är expert på att läsa svenska kvitton och fakturor från ALLA företag och format (ICA, ZARA, restauranger, parkering, fakturor, etc).

Extrahera dessa fält från kvittobilden. Använd null om ett fält saknas.

Returnera ENDAST giltig JSON, inget annat, ingen markdown, inga backticks:
{
  "vendorName": "företagets/butikens namn",
  "orgNumber": "organisationsnummer i format 556677-8899 om det finns, annars null",
  "date": "transaktionsdatum i format ÅÅÅÅ-MM-DD",
  "totalAmount": totalbelopp i kronor som tal (t.ex. 640.00),
  "vatAmount": momsbelopp i kronor som tal (eller null),
  "vatRate": momssats som tal: 6, 12 eller 25 (eller null),
  "receiptNumber": "kvitto-/ordernummer om det finns, annars null"
}`;

function stripToJson(text: string): string {
  // Models sometimes wrap JSON in ```json fences despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const braces = text.match(/\{[\s\S]*\}/);
  return braces ? braces[0] : text.trim();
}

function coerceRate(v: unknown): 6 | 12 | 25 | null {
  const n = typeof v === "number" ? v : Number(v);
  return n === 6 || n === 12 || n === 25 ? n : null;
}

function coerceNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Sends the image to Gemini and returns structured receipt fields, in the
 * same ExtractedReceipt shape the rest of the app already uses (so it's a
 * drop-in alongside the Tesseract/regex path). `base64Image` may be a data
 * URL or a bare base64 string.
 */
export async function readReceiptWithGemini(base64Image: string): Promise<ExtractedReceipt> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  // Accept either a data URL ("data:image/jpeg;base64,...") or raw base64.
  const commaIdx = base64Image.indexOf(",");
  const inlineData = commaIdx >= 0 ? base64Image.slice(commaIdx + 1) : base64Image;
  const mimeMatch = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: inlineData } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      // Ask Gemini to return JSON directly — supported on the free tier.
      responseMimeType: "application/json",
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    // 429 = free-tier daily/RPM quota exhausted; surface a distinct message
    // so the caller can fall back to Tesseract rather than failing hard.
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini returned no text");

  let parsed: GeminiReceiptJson;
  try {
    parsed = JSON.parse(stripToJson(text));
  } catch {
    throw new Error("Gemini response was not valid JSON");
  }

  return {
    vendorName: parsed.vendorName?.trim() || null,
    orgNumber: parsed.orgNumber?.trim() || null,
    receiptNumber: parsed.receiptNumber?.trim() || null,
    date: parsed.date?.trim() || null,
    totalAmount: coerceNumber(parsed.totalAmount),
    vatAmount: coerceNumber(parsed.vatAmount),
    vatRate: coerceRate(parsed.vatRate),
    rawText: "", // Gemini returns structured data, not raw OCR text.
    // Gemini's structured reads are high-confidence by construction; we
    // mark it just below 1.0 so genuine "couldn't read" cases (all-null)
    // still trip the manual-review threshold via the null-field check.
    confidence: parsed.vendorName || parsed.totalAmount != null ? 0.95 : 0.3,
  };
}
