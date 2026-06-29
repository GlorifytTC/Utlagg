import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { lookupVendorCorrection, recordVendorCorrection } from "@/lib/vendor-learning";

export const runtime = "nodejs";

const lookupSchema = z.object({
  orgNumber: z.string().max(11).optional(),
  ocrGuess: z.string().max(300).optional(),
});

/**
 * Checks whether the shared, cross-user correction history already knows
 * the right vendor name for this org number / OCR text, before the
 * receipt is shown to the person. Called client-side right after local
 * Tesseract OCR runs, so a previously-corrected store (by ANY user) shows
 * the right name immediately instead of the same garbled guess every time.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const parsed = lookupSchema.safeParse({
    orgNumber: req.nextUrl.searchParams.get("orgNumber") ?? undefined,
    ocrGuess: req.nextUrl.searchParams.get("ocrGuess") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ correction: null });
  }
  const correction = await lookupVendorCorrection(parsed.data);
  return NextResponse.json({ correction });
}

const recordSchema = z.object({
  orgNumber: z.string().max(11).optional(),
  ocrGuess: z.string().max(300).optional(),
  correctVendor: z.string().min(1).max(300),
  basCode: z.string().max(10).optional(),
});

/**
 * Records a vendor-name correction the person made — called from the
 * receipt save flow, never blocking the save itself if it fails.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const parsed = recordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await recordVendorCorrection(parsed.data);
  return NextResponse.json({ ok: true });
}
