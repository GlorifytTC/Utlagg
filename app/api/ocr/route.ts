import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { runOcr, runOcrSpace, parseReceiptText, OCR_CONFIDENCE_THRESHOLD, type ExtractedReceipt } from "@/lib/ocr";

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
      // Server-side OCR. Vision if a key is configured (best quality), else the
      // free OCR.space engine. Either way it runs on the server — no browser
      // worker, so no CSP can block it.
      result = process.env.GOOGLE_CLOUD_API_KEY
        ? await runOcr(parsed.data.image)
        : await runOcrSpace(parsed.data.image);
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
