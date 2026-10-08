import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { receiptTrainingData } from "@/db/schema";
import { checkLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Same structured shape the Gemini reader returns, so both results can be
// scored against the confirmed label with identical rules.
const resultSchema = z.object({
  vendorName: z.string().max(300).nullable().optional(),
  orgNumber: z.string().max(20).nullable().optional(),
  receiptNumber: z.string().max(100).nullable().optional(),
  date: z.string().max(10).nullable().optional(),
  totalAmount: z.number().finite().nullable().optional(),
  vatAmount: z.number().finite().nullable().optional(),
  vatRate: z.number().finite().nullable().optional(),
});

const schema = z.object({
  // Attach to the row Gemini created for this same receipt...
  trainingId: z.string().uuid().optional(),
  // ...or, when only the own model read it, create a new row with the image.
  image: z.string().min(10).max(15_000_000).optional(),
  localResult: resultSchema,
  localConfidence: z.number().min(0).max(100).nullable().optional(),
});

/**
 * Own-model ("shadow") read of a scanned receipt, used to measure whether the
 * free local pipeline can replace Gemini.
 *
 *  - with trainingId: stores the own model's result on that row (only if the
 *    row belongs to the caller).
 *  - without trainingId: Gemini did not read this receipt; creates a training
 *    row (source 'local') so it is still labeled when the user saves.
 *
 * Best-effort: training capture must never break scanning.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  if (!(await checkLimit("api", `ocrshadow:${session.user.id}`))) {
    return NextResponse.json({ error: "För många förfrågningar." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  const { trainingId, image, localResult, localConfidence } = parsed.data;

  try {
    if (trainingId) {
      await db
        .update(receiptTrainingData)
        .set({ localResult, localConfidence: localConfidence ?? null })
        .where(and(eq(receiptTrainingData.id, trainingId), eq(receiptTrainingData.userId, session.user.id)));
      return NextResponse.json({ ok: true, trainingId });
    }

    if (!image) return NextResponse.json({ error: "Bild saknas" }, { status: 400 });
    const [row] = await db
      .insert(receiptTrainingData)
      .values({
        userId: session.user.id,
        imageData: image,
        aiResult: null,
        source: "local",
        localResult,
        localConfidence: localConfidence ?? null,
      })
      .returning({ id: receiptTrainingData.id });
    return NextResponse.json({ ok: true, trainingId: row?.id ?? null });
  } catch (e) {
    console.error("own-model shadow capture failed (non-blocking):", e);
    return NextResponse.json({ ok: false, trainingId: null });
  }
}
