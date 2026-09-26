import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companyMembers, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";

export const runtime = "nodejs";

/**
 * GET — the company's members. Only owner/admin may see the list (a plain
 * member cannot). Returns myRole + myUserId so the UI can hide self-actions.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ members: [] });
  // Members (non-managers) cannot see the roster.
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  }

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
  return NextResponse.json({ members, myRole: membership.role, myUserId: session.user.id });
}

const patchSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(["admin", "approver", "member"]),
});

/**
 * PATCH — change a member's role. OWNER ONLY (admins can invite and remove, but
 * cannot change positions). Never on the owner, and never on oneself.
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  // Only the owner may change roles.
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Endast ägaren kan ändra roller." }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga fält" }, { status: 400 });

  const [target] = await db
    .select({ userId: companyMembers.userId, role: companyMembers.role })
    .from(companyMembers)
    .where(and(eq(companyMembers.id, parsed.data.memberId), eq(companyMembers.companyId, membership.companyId)))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Hittas inte" }, { status: 404 });
  // Never change one's own role, and never the owner's.
  if (target.userId === session.user.id) {
    return NextResponse.json({ error: "Du kan inte ändra din egen roll." }, { status: 403 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Ägarens roll kan inte ändras." }, { status: 409 });
  }

  await db
    .update(companyMembers)
    .set({ role: parsed.data.role })
    .where(and(eq(companyMembers.id, parsed.data.memberId), eq(companyMembers.companyId, membership.companyId)));
  return NextResponse.json({ ok: true });
}

/**
 * DELETE — remove a member. Owner/admin may remove others, but never the owner
 * and never themselves. Removing a person keeps their user + receipts (only the
 * membership row is deleted), so their bills stay in the company dashboard.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const membership = await getUserCompany(session.user.id);
  if (!membership || !canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  }
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId saknas" }, { status: 400 });

  const [target] = await db
    .select({ userId: companyMembers.userId, role: companyMembers.role })
    .from(companyMembers)
    .where(and(eq(companyMembers.id, memberId), eq(companyMembers.companyId, membership.companyId)))
    .limit(1);
  if (!target) return NextResponse.json({ error: "Hittas inte" }, { status: 404 });
  // Never remove oneself, and never the owner.
  if (target.userId === session.user.id) {
    return NextResponse.json({ error: "Du kan inte ta bort dig själv." }, { status: 403 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Kan inte ta bort ägaren" }, { status: 409 });
  }

  await db.delete(companyMembers).where(eq(companyMembers.id, memberId));
  return NextResponse.json({ ok: true });
}
