import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companyVehicles, companyMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

async function membership(userId: string) {
  const [m] = await db
    .select()
    .from(companyMembers)
    .where(eq(companyMembers.userId, userId))
    .limit(1);
  return m ?? null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  try {
    const m = await membership(session.user.id);
    if (!m) return NextResponse.json({ vehicles: [], isAdmin: false });
    const vehicles = await db
      .select()
      .from(companyVehicles)
      .where(eq(companyVehicles.companyId, m.companyId));
    return NextResponse.json({ vehicles, isAdmin: m.role === "owner" || m.role === "admin" });
  } catch (e) {
    console.error("vehicles GET failed (run migrations?):", e);
    return NextResponse.json({ vehicles: [], isAdmin: false });
  }
}

const SWEDISH_PLATE = /^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/;

const schema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .transform((v) => v.toUpperCase().replace(/\s+/g, ""))
    .refine((v) => SWEDISH_PLATE.test(v), {
      message: "Ogiltigt registreringsnummer – ange ABC123 eller ABC12A",
    }),
  model: z.string().trim().max(100).optional(),
  fuelType: z.enum(["petrol", "diesel", "hybrid", "electric"]).default("petrol"),
  assignedToUserId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const m = await membership(session.user.id);
  if (!m || (m.role !== "owner" && m.role !== "admin")) {
    return NextResponse.json({ error: "Endast administratörer kan lägga till fordon." }, { status: 403 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ogiltiga fält" }, { status: 400 });
  }
  const d = parsed.data;
  const [vehicle] = await db
    .insert(companyVehicles)
    .values({
      companyId: m.companyId,
      registrationNumber: d.registrationNumber,
      model: d.model,
      fuelType: d.fuelType,
      isElectric: d.fuelType === "electric",
      assignedToUserId: d.assignedToUserId,
    })
    .returning();
  return NextResponse.json({ vehicle }, { status: 201 });
}
