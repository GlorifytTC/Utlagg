import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { receiptTrainingData } from "@/db/schema";
import { readReceiptWithGemini } from "@/lib/gemini-ocr";
import { guardCostlyCall } from "@/lib/cost-guard";
import { decodeImage } from "@/lib/storage";
import { and, count, eq, gte } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 30;

// ~15MB of base64 ≈ an 11MB image - generous for a phone photo, but bounded
// so a caller can't stream an arbitrarily large body into memory / to Gemini.
const MAX_DAILY = 300;
const MAX_STORED_DAILY = 100;

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

  // Cap paid-ish AI vision calls per user (30/min) and refuse accounts that
  // can't scan. No human scans receipts faster than this; the ceiling stops a
  // scripted loop running up Gemini quota/cost.
  const blocked = await guardCostlyCall(session.user.id, "ocrai");
  if (blocked) return blocked;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }

  try {
    decodeImage(parsed.data.image); // type-sniff: only real images/PDFs go to Gemini
  } catch {
    return NextResponse.json({ error: "Filtypen stöds inte" }, { status: 400 });
  }

  // Daily caps per user (rows double as the usage counter): hard stop at
  // MAX_DAILY, and past MAX_STORED_DAILY we still read but skip storing images.
  const [{ n: today }] = await db
    .select({ n: count() })
    .from(receiptTrainingData)
    .where(
      and(
        eq(receiptTrainingData.userId, session.user.id),
        gte(receiptTrainingData.createdAt, new Date(Date.now() - 86_400_000)),
      ),
    );
  if (today >= MAX_DAILY) {
    return NextResponse.json(
      { error: "Dagsgränsen för AI-läsning är nådd. Försök igen i morgon." },
      { status: 429 },
    );
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
    if (today >= MAX_STORED_DAILY) return NextResponse.json({ ...result, trainingId });
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
