import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { receiptTrainingData } from "@/db/schema";
import { readReceiptWithGemini } from "@/lib/gemini-ocr";
import { checkLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

// ~15MB of base64 ≈ an 11MB image — generous for a phone photo, but bounded
// so a caller can't stream an arbitrarily large body into memory / to Gemini.
const schema = z.object({
  image: z.string().min(10).max(15_000_000),
});

/**
 * Reads a receipt image with Gemini (free-tier vision) and, in the same
 * request, saves the image + the AI's result as a training-data row. The
 * user's confirmed/corrected values are attached later via PATCH (see
 * /api/ocr/ai/confirm) once they save the receipt.
 *
 * Returns the structured fields for the uploader to pre-fill the form.
 * If Gemini is unavailable (no key, quota exhausted, error), responds 502
 * so the client falls back to free local Tesseract.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  // Cap paid-ish AI vision calls per user (30/min). No human scans receipts
  // faster than this; the ceiling exists to stop a scripted loop running up
  // Gemini quota/cost, independent of the plan scan-limit metering.
  if (!(await checkLimit("api", `ocrai:${session.user.id}`))) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen snart." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }

  let result;
  try {
    result = await readReceiptWithGemini(parsed.data.image);
  } catch (e) {
    console.error("Gemini OCR failed, client should fall back to Tesseract:", e);
    return NextResponse.json(
      { error: "AI-läsning misslyckades", fallback: true },
      { status: 502 },
    );
  }

  // Capture the training example. Non-blocking: a failure to log training
  // data must never break the user's actual scan.
  let trainingId: string | null = null;
  try {
    const [row] = await db
      .insert(receiptTrainingData)
      .values({
        userId: session.user.id,
        imageData: parsed.data.image.slice(0, 5_000_000), // safety cap
        aiResult: result,
        source: "gemini",
      })
      .returning({ id: receiptTrainingData.id });
    trainingId = row?.id ?? null;
  } catch (e) {
    console.error("training-data capture failed (non-blocking):", e);
  }

  return NextResponse.json({ ...result, trainingId });
}
