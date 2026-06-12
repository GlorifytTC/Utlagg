import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { runOcr, runOcrSpace, runMindee, runVisionLLM, parseReceiptText, OCR_CONFIDENCE_THRESHOLD, type ExtractedReceipt } from "@/lib/ocr";

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
      const img = parsed.data.image;
      // Priority: Vision LLM (most accurate) -> Mindee -> server OCR.
      const ocrFallback = () =>
        process.env.GOOGLE_CLOUD_API_KEY ? runOcr(img) : runOcrSpace(img);
      const mindeeOrOcr = async (): Promise<ExtractedReceipt> => {
        if (process.env.MINDEE_API_KEY) {
          try {
            return await runMindee(img);
          } catch (e) {
            console.error("mindee failed, falling back to OCR:", e);
            return await ocrFallback();
          }
        }
        return await ocrFallback();
      };
      if (process.env.OPENAI_API_KEY) {
        try {
          result = await runVisionLLM(img);
        } catch (e) {
          console.error("vision LLM failed, falling back:", e);
          result = await mindeeOrOcr();
        }
      } else {
        result = await mindeeOrOcr();
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
