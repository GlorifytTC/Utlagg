import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { mileageEntries, MILEAGE_RATE_PER_KM } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";
import { requireFeature } from "@/lib/entitlements";

export const runtime = "nodejs";

const schema = z.object({
  startAddress: z.string().trim().min(1).max(500),
  endAddress: z.string().trim().min(1).max(500),
  distanceKm: z.number().positive().max(100000),
  date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Ogiltigt datum"),
  purpose: z.enum(["business", "private"]).default("business"),
  note: z.string().max(500).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const rows = await db
    .select()
    .from(mileageEntries)
    .where(eq(mileageEntries.userId, session.user.id))
    .orderBy(desc(mileageEntries.date));
  return NextResponse.json({ entries: rows, ratePerKm: MILEAGE_RATE_PER_KM });
}

export async function POST(req: NextRequest) {
  const gate = await requireFeature("mileage");
  if (gate.status === 401) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!gate.ok)
    return NextResponse.json(
      { error: "Milersättning ingår i Företag-planen.", upgrade: true },
      { status: 403 },
    );
  const userId = gate.userId!;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ogiltiga fält" },
      { status: 400 },
    );
  }
  const km = Math.round(parsed.data.distanceKm * 100) / 100;
  const amount = Math.round(km * MILEAGE_RATE_PER_KM * 100) / 100;

  const [entry] = await db
    .insert(mileageEntries)
    .values({
      userId,
      startAddress: parsed.data.startAddress,
      endAddress: parsed.data.endAddress,
      distanceKm: km.toFixed(2),
      ratePerKm: MILEAGE_RATE_PER_KM.toFixed(2),
      amount: amount.toFixed(2),
      date: new Date(parsed.data.date),
      purpose: parsed.data.purpose,
      note: parsed.data.note,
    })
    .returning();

  await logAudit({
    userId,
    action: "mileage.create",
    details: `${km} km · ${amount} kr`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ entry }, { status: 201 });
}
