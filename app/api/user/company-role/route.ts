import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { companyMembers } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }
  try {
    const membership = await getUserCompany(session.user.id);
    if (!membership) {
      // Solo user: no company, no approval needed.
      return NextResponse.json({ role: null, isEmployee: false, hasApprover: false });
    }
    // Is there anyone else in the company who can approve?
    const approvers = await db
      .select({ id: companyMembers.id })
      .from(companyMembers)
      .where(
        and(
          eq(companyMembers.companyId, membership.companyId),
          ne(companyMembers.userId, session.user.id),
          inArray(companyMembers.role, ["owner", "admin", "approver"]),
        ),
      );
    return NextResponse.json({
      role: membership.role,
      isEmployee: membership.role === "member",
      hasApprover: approvers.length > 0,
    });
  } catch (e) {
    console.error("company-role failed:", e);
    return NextResponse.json({ role: null, isEmployee: false, hasApprover: false });
  }
}
