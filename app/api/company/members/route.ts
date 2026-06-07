import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companyMembers, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ members: [] });

  const members = await db
    .select({
      id: companyMembers.id,
      userId: companyMembers.userId,
      role: companyMembers.role,
      email: users.email,
      name: users.name,
    })
    .from(companyMembers)
    .leftJoin(users, eq(users.id, companyMembers.userId))
    .where(eq(companyMembers.companyId, membership.companyId));
  return NextResponse.json({ members, myRole: membership.role });
}

const patchSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["admin", "approver", "member"]),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership || !canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga fält" }, { status: 400 });
  await db
    .update(companyMembers)
    .set({ role: parsed.data.role })
    .where(and(eq(companyMembers.id, parsed.data.memberId), eq(companyMembers.companyId, membership.companyId)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership || !canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  }
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId saknas" }, { status: 400 });
  // Don't allow removing the owner.
  const [target] = await db
    .select({ role: companyMembers.role })
    .from(companyMembers)
    .where(and(eq(companyMembers.id, memberId), eq(companyMembers.companyId, membership.companyId)))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Hittas inte" }, { status: 404 });
  if (target.role === "owner") return NextResponse.json({ error: "Kan inte ta bort ägaren" }, { status: 409 });
  await db.delete(companyMembers).where(eq(companyMembers.id, memberId));
  return NextResponse.json({ ok: true });
}
