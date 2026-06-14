import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { ocrSamples } from "@/db/schema";

export const runtime = "nodejs";

const schema = z.object({
  field: z.string().max(40),
  value: z.string().max(500).optional(),
  vendor: z.string().max(300).optional(),
  bbox: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
  crop: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  }
  const d = parsed.data;
  try {
    await db.insert(ocrSamples).values({
      userId: session.user.id,
      field: d.field,
      value: d.value ?? null,
      vendor: d.vendor ?? null,
      bboxX: d.bbox?.x ?? null,
      bboxY: d.bbox?.y ?? null,
      bboxW: d.bbox?.w ?? null,
      bboxH: d.bbox?.h ?? null,
      crop: d.crop ?? null,
      source: "manual",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("sample save error:", e);
    return NextResponse.json({ error: "Kunde inte spara" }, { status: 500 });
  }
}
