import { NextResponse } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";

export const runtime = "nodejs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * GET /api/company/accountant-audit
 * Returns all accountant actions on this company's data, last 30 days.
 * Includes actor name/email so the UI can show who did what.
 * Requires company membership with manage rights (owner/admin).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const membership = await getUserCompany(session.user.id);
  if (!membership || !canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });
  }

  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      oldValues: auditLogs.oldValues,
      newValues: auditLogs.newValues,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(
      and(
        eq(auditLogs.targetCompanyId, membership.companyId),
        gte(auditLogs.createdAt, since),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(1000);

  return NextResponse.json({ logs: rows });
}
