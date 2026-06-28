import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { runOcr, runOcrSpace, runMindee, runVisionLLM, parseReceiptText, OCR_CONFIDENCE_THRESHOLD, type ExtractedReceipt } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * DECISION (recorded here so it isn't silently reversed by an env var
 * appearing later): this app does not call paid OCR/vision APIs, and does
 * not use OCR.space's shared "helloworld" demo key as a fallback — it
 * produced unusable results (e.g. "net te" for a ZARA receipt) and is a
 * shared, rate-limited resource that doesn't belong in a production app
 * regardless of cost. The primary, supported OCR path is free, local
 * Tesseract.js running in the browser (lib/ocr-client.ts) — this route
 * exists only for back-compat / manual testing of the parsing logic on
 * already-extracted text, and as an explicit opt-in if someone deliberately
 * sets a paid API key AND sets ALLOW_PAID_OCR_FALLBACK=true.
 */
const PAID_FALLBACK_ALLOWED = process.env.ALLOW_PAID_OCR_FALLBACK === "true";

const schema = z.object({
  // Either pre-extracted text (free, browser Tesseract) OR a raw image
  // (only used if a paid fallback has been explicitly opted into).
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
    if (parsed.data.text && parsed.data.text.trim()) {
      // Back-compat: text already extracted client-side (e.g. by Tesseract).
      result = parseReceiptText(parsed.data.text);
    } else if (parsed.data.image) {
      if (!PAID_FALLBACK_ALLOWED) {
        // No silent OCR.space demo-key call, no silent paid API call —
        // tell the caller plainly instead of guessing badly.
        return NextResponse.json(
          {
            ...EMPTY,
            needsManualReview: true,
            error:
              "Server-side OCR är inaktiverad (ingen betald AI-fallback är aktiverad). Använd lokal skanning eller fyll i manuellt.",
          },
          { status: 200 },
        );
      }
      const img = parsed.data.image;
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
