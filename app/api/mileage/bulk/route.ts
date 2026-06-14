import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { db } from "@/db";
import { mileageEntries } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { rateForVehicle } from "@/lib/mileage-rate";

export const runtime = "nodejs";

const schema = z.object({
  startAddress: z.string().trim().min(1).max(300),
  endAddress: z.string().trim().min(1).max(300),
  distanceKm: z.number().positive().max(100000),
  purpose: z.string().max(20).default("business"),
  vehicleId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
  dates: z.array(z.string().refine((s) => !Number.isNaN(Date.parse(s)))).min(1).max(366),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ogiltiga fält" }, { status: 400 });
  }
  const d = parsed.data;
  const km = Math.round(d.distanceKm * 100) / 100;
  const { rate, vehicleId } = await rateForVehicle(d.vehicleId);
  const amount = Math.round(km * rate * 100) / 100;

  const rows = Array.from(new Set(d.dates)).map((date) => ({
    userId: session.user.id,
    startAddress: d.startAddress,
    endAddress: d.endAddress,
    distanceKm: km.toFixed(2),
    ratePerKm: rate.toFixed(2),
    amount: amount.toFixed(2),
    date: new Date(date),
    purpose: d.purpose,
    note: d.note ?? null,
    vehicleId,
  }));
  await db.insert(mileageEntries).values(rows);
  return NextResponse.json({ created: rows.length }, { status: 201 });
}
