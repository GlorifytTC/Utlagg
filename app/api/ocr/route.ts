import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { runOcr, runOcrSpace, runMindee, parseReceiptText, OCR_CONFIDENCE_THRESHOLD, type ExtractedReceipt } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  // Either pre-extracted text (free, browser Tesseract) OR a raw image (Vision, optional).
  text: z.string().optional(),
  image: z.string().optional(),
});

const EMPTY: ExtractedReceipt = {
  vendorName: null,
  orgNumber: null,
  receiptNumber: null,
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
    if (parsed.data.image) {
      // Best: Mindee receipt model (structured fields). If it's not configured
      // or fails, fall back to server OCR (Vision if keyed, else OCR.space).
      const ocrFallback = () =>
        process.env.GOOGLE_CLOUD_API_KEY
          ? runOcr(parsed.data.image!)
          : runOcrSpace(parsed.data.image!);
      if (process.env.MINDEE_API_KEY) {
        try {
          result = await runMindee(parsed.data.image);
        } catch (e) {
          console.error("mindee failed, falling back to OCR:", e);
          result = await ocrFallback();
        }
      } else {
        result = await ocrFallback();
      }
    } else if (parsed.data.text && parsed.data.text.trim()) {
      // Back-compat: text already extracted client-side.
      result = parseReceiptText(parsed.data.text);
    }
  } catch (err) {
    console.error("ocr error:", err);
    result = EMPTY;
  }

  return NextResponse.json({
    ...result,
    needsManualReview: result.confidence < OCR_CONFIDENCE_THRESHOLD,
  });
}
