import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { transportPasses, companyMembers, TRANSPORT_VAT_RATE } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  try {
    const passes = await db
      .select()
      .from(transportPasses)
      .where(eq(transportPasses.userId, session.user.id))
      .orderBy(desc(transportPasses.validFrom));
    return NextResponse.json({ passes });
  } catch (e) {
    console.error("transport GET failed (run migrations?):", e);
    return NextResponse.json({ passes: [] });
  }
}

const schema = z.object({
  passType: z.enum(["monthly", "yearly", "single"]).default("monthly"),
  provider: z.enum(["SL", "Västtrafik", "Skånetrafiken", "Other"]).default("SL"),
  providerOther: z.string().trim().max(100).optional(),
  amount: z.number().nonnegative().max(1000000),
  validFrom: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Ogiltigt datum"),
  validTo: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Ogiltigt datum"),
  isRecurring: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ogiltiga fält" }, { status: 400 });
  }
  const d = parsed.data;
  // Public transport price includes 6% VAT: vat = gross * 6 / 106.
  const vatAmount = Math.round((d.amount * TRANSPORT_VAT_RATE) / (100 + TRANSPORT_VAT_RATE) * 100) / 100;
  const [m] = await db
    .select()
    .from(companyMembers)
    .where(eq(companyMembers.userId, session.user.id))
    .limit(1);

  const [pass] = await db
    .insert(transportPasses)
    .values({
      userId: session.user.id,
      companyId: m?.companyId ?? null,
      passType: d.passType,
      provider: d.provider,
      providerOther: d.provider === "Other" ? d.providerOther : null,
      amount: d.amount.toFixed(2),
      vatRate: TRANSPORT_VAT_RATE,
      vatAmount: vatAmount.toFixed(2),
      validFrom: new Date(d.validFrom),
      validTo: new Date(d.validTo),
      isRecurring: d.isRecurring,
    })
    .returning();
  return NextResponse.json({ pass }, { status: 201 });
}
