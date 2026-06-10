import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { runOcr, parseReceiptText, OCR_CONFIDENCE_THRESHOLD, type ExtractedReceipt } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  // Either pre-extracted text (free, browser Tesseract) OR a raw image (Vision, optional).
  text: z.string().optional(),
  image: z.string().optional(),
});

const EMPTY: ExtractedReceipt = {
  vendorName: null,
  date: null,
  totalAmount: null,
  vatAmount: null,
  vatRate: null,
  rawText: "",
  confidence: 0,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }

  let result: ExtractedReceipt = EMPTY;
  try {
    if (parsed.data.text && parsed.data.text.trim()) {
      // Free path: text already extracted in the browser (Tesseract).
      result = parseReceiptText(parsed.data.text);
    } else if (parsed.data.image && process.env.GOOGLE_CLOUD_API_KEY) {
      // Optional paid path: Google Vision, only if configured.
      result = await runOcr(parsed.data.image);
    }
    // else: no text and no Vision key -> return EMPTY (manual entry), never 502.
  } catch (err) {
    console.error("ocr parse error:", err);
    result = EMPTY;
  }

  return NextResponse.json({
    ...result,
    needsManualReview: result.confidence < OCR_CONFIDENCE_THRESHOLD,
  });
}
