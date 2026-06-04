import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { runOcr, OCR_CONFIDENCE_THRESHOLD } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  image: z.string().min(1), // base64 (optionally a data URL)
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Bild saknas" }, { status: 400 });
    }

    const result = await runOcr(parsed.data.image);

    return NextResponse.json({
      ...result,
      needsManualReview: result.confidence < OCR_CONFIDENCE_THRESHOLD,
    });
  } catch (err) {
    console.error("ocr error:", err);
    return NextResponse.json(
      { error: "Kunde inte läsa kvittot. Ange uppgifterna manuellt." },
      { status: 502 },
    );
  }
}
