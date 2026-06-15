import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  mileageEntries,
  companyVehicles,
  MILEAGE_RATE_PER_KM,
  COMPANY_CAR_RATE_FOSSIL,
  COMPANY_CAR_RATE_ELECTRIC,
} from "@/db/schema";
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
  vehicleId: z.string().uuid().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  try {
    const rows = await db
      .select()
      .from(mileageEntries)
      .where(eq(mileageEntries.userId, session.user.id))
      .orderBy(desc(mileageEntries.date));
    return NextResponse.json({ entries: rows, ratePerKm: MILEAGE_RATE_PER_KM });
  } catch (e) {
    console.error("mileage GET failed (run migrations?):", e);
    return NextResponse.json({ entries: [], ratePerKm: MILEAGE_RATE_PER_KM });
  }
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

  // Determine the correct Skatteverket rate. Own/private car = 2.50 kr/km
  // (any fuel). A selected company vehicle uses the förmånsbil rate:
  // 0.95 kr/km if fully electric, otherwise 1.20 kr/km.
  let ratePerKm = MILEAGE_RATE_PER_KM;
  let vehicleId: string | null = null;
  if (parsed.data.vehicleId) {
    const [v] = await db
      .select()
      .from(companyVehicles)
      .where(eq(companyVehicles.id, parsed.data.vehicleId))
      .limit(1);
    if (v) {
      vehicleId = v.id;
      ratePerKm = v.isElectric ? COMPANY_CAR_RATE_ELECTRIC : COMPANY_CAR_RATE_FOSSIL;
    }
  }
  const amount = Math.round(km * ratePerKm * 100) / 100;

  let entry;
  try {
    [entry] = await db
      .insert(mileageEntries)
      .values({
        userId,
        startAddress: parsed.data.startAddress,
        endAddress: parsed.data.endAddress,
        distanceKm: km.toFixed(2),
        ratePerKm: ratePerKm.toFixed(2),
        amount: amount.toFixed(2),
        date: new Date(parsed.data.date),
        purpose: parsed.data.purpose,
        note: parsed.data.note,
        vehicleId,
      })
      .returning();
  } catch (e) {
    console.error("mileage POST insert failed:", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Kunde inte spara: ${detail}` },
      { status: 500 },
    );
  }

  await logAudit({
    userId,
    action: "mileage.create",
    details: `${km} km · ${amount} kr`,
    ipAddress: clientIp(req),
  });
  return NextResponse.json({ entry }, { status: 201 });
}
