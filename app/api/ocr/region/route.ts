import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { readRegion } from "@/lib/ocr";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  crop: z.string().min(10),
  field: z.string().max(40),
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
  try {
    const value = await readRegion(parsed.data.crop, parsed.data.field);
    return NextResponse.json({ value });
  } catch (e) {
    console.error("region read error:", e);
    return NextResponse.json({ error: "Kunde inte läsa området" }, { status: 500 });
  }
}
