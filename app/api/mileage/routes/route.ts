import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { mileageRoutes } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  try {
    const routes = await db
      .select()
      .from(mileageRoutes)
      .where(eq(mileageRoutes.userId, session.user.id))
      .orderBy(desc(mileageRoutes.createdAt));
    return NextResponse.json({ routes });
  } catch (e) {
    console.error("routes GET failed (run migrations?):", e);
    return NextResponse.json({ routes: [] });
  }
}

const schema = z.object({
  label: z.string().trim().min(1).max(120),
  startAddress: z.string().trim().min(1).max(300),
  endAddress: z.string().trim().min(1).max(300),
  distanceKm: z.number().positive().max(100000),
  purpose: z.string().max(20).default("business"),
  vehicleId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ogiltiga fält" }, { status: 400 });
  }
  const d = parsed.data;
  let route;
  try {
    [route] = await db
      .insert(mileageRoutes)
      .values({
        userId: session.user.id,
        label: d.label,
        startAddress: d.startAddress,
        endAddress: d.endAddress,
        distanceKm: d.distanceKm.toFixed(2),
        purpose: d.purpose,
        vehicleId: d.vehicleId ?? null,
      })
      .returning();
  } catch (e) {
    console.error("route POST insert failed:", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Kunde inte spara: ${detail}` }, { status: 500 });
  }
  return NextResponse.json({ route }, { status: 201 });
}
