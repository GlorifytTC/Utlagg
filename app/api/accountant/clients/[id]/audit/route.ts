import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";

export const runtime = "nodejs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * GET /api/accountant/clients/[id]/audit
 * Returns the accountant's own action log for a client, last 30 days.
 * Accessible by the accountant; the client sees the same data via
 * GET /api/company/accountant-audit.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const logs = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.userId, acct.userId),
        eq(auditLogs.targetCompanyId, access.companyId),
        gte(auditLogs.createdAt, since),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(1000);

  return NextResponse.json({ logs });
}
