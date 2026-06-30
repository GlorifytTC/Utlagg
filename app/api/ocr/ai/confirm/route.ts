import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { receiptTrainingData } from "@/db/schema";

export const runtime = "nodejs";

const schema = z.object({
  trainingId: z.string().uuid(),
  confirmedVendor: z.string().max(300).optional(),
  confirmedOrgNumber: z.string().max(11).optional(),
  confirmedDate: z.string().max(10).optional(),
  confirmedTotal: z.number().optional(),
  confirmedVat: z.number().optional(),
  confirmedVatRate: z.number().int().optional(),
  wasCorrected: z.boolean(),
});

/**
 * Attaches the user's final, confirmed values to a training row after they
 * save a receipt. These confirmed values are the "labels" — the ground
 * truth a future model would be trained against. `wasCorrected` flags the
 * rows where the user changed what the AI proposed, which are the most
 * valuable training examples (the AI's actual mistakes).
 *
 * Best-effort and auth-scoped: only updates a row owned by this user.
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { trainingId, ...fields } = parsed.data;
  try {
    await db
      .update(receiptTrainingData)
      .set({
        confirmedVendor: fields.confirmedVendor ?? null,
        confirmedOrgNumber: fields.confirmedOrgNumber ?? null,
        confirmedDate: fields.confirmedDate ?? null,
        confirmedTotal: fields.confirmedTotal != null ? String(fields.confirmedTotal) : null,
        confirmedVat: fields.confirmedVat != null ? String(fields.confirmedVat) : null,
        confirmedVatRate: fields.confirmedVatRate ?? null,
        wasCorrected: fields.wasCorrected,
      })
      .where(
        and(
          eq(receiptTrainingData.id, trainingId),
          eq(receiptTrainingData.userId, session.user.id),
        ),
      );
  } catch (e) {
    console.error("training-data confirm failed (non-blocking):", e);
  }
  return NextResponse.json({ ok: true });
}
