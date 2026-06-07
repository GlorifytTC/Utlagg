import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companies, companyMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().trim().min(1).max(255),
  orgNumber: z.string().trim().max(12).optional(),
  vatNumber: z.string().trim().max(50).optional(),
});

const updateSchema = createSchema.partial().extend({
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});

/** GET current user's company (+ their role) or null. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ company: null, role: null });
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, membership.companyId))
    .limit(1);
  return NextResponse.json({ company, role: membership.role });
}

/** Create a company; the creator becomes owner. One company per user (MVP). */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (await getUserCompany(session.user.id)) {
    return NextResponse.json({ error: "Du tillhör redan ett företag" }, { status: 409 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga fält" }, { status: 400 });

  const [company] = await db.insert(companies).values(parsed.data).returning();
  await db.insert(companyMembers).values({
    companyId: company.id,
    userId: session.user.id,
    role: "owner",
  });
  await logAudit({ userId: session.user.id, action: "company.create", ipAddress: clientIp(req) });
  return NextResponse.json({ company }, { status: 201 });
}

/** Update company details (owner/admin only). */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership || !canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  }
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga fält" }, { status: 400 });
  await db.update(companies).set(parsed.data).where(eq(companies.id, membership.companyId));
  return NextResponse.json({ ok: true });
}
