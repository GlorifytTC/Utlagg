/**
 * Extract the text layer from a digital PDF (emailed / Kivra receipts) so it can
 * feed the existing free parser in lib/ocr-parse.ts — no OCR, no image tokens.
 *
 * unpdf wraps a serverless build of pdf.js (no native deps), which runs on the
 * Node runtime used by our API routes. This handles PDFs that carry real text;
 * a scanned/image-only PDF has no text layer and returns "" — that's the analog
 * case and belongs to the image-scan path, not here.
 */
import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdfText(buffer: Buffer | Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  // mergePages:true → a single string across all pages.
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}
