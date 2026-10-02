import { NextResponse, type NextRequest } from "next/server";
import { and, count, desc, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { listColumns, parseListParams } from "@/lib/accountant-receipts";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Receipts for one client company, for the accountant.
 *
 * AUTHORIZATION - relationship-first, member-scoped, in this exact order:
 *   1. requireAccountant()
 *   2. requireCompanyAccess(accountantId, companyId) → active relationship +
 *      the company's CURRENT member userIds (null ⇒ 404, no data queried)
 *   3. scope EVERY receipt query with inArray(receipts.userId, memberIds)
 *
 * receipts.companyId is NEVER used as the authorization boundary. A receipt
 * only appears if its owner is a current member of the authorized company, so
 * manipulating companyId / receiptId / userId / query params cannot cross the
 * boundary. Reuses the pagination/search/date/sort conventions and response
 * shape of GET /api/receipts.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  const memberIds = access.memberIds;
  const { conditions, page, pageSize, sortCol, dir } = parseListParams(req.nextUrl.searchParams);

  // A company with no current members has no authorized receipts - return an
  // empty page rather than an unscoped query.
  if (memberIds.length === 0) {
    return NextResponse.json({ receipts: [], total: 0, page, pageSize });
  }

  // THE security boundary: scope to current members, never receipts.companyId.
  const where = and(inArray(receipts.userId, memberIds), ...conditions);

  const [rows, totals] = await Promise.all([
    db
      .select(listColumns)
      .from(receipts)
      .where(where)
      .orderBy(sql`${sortCol} ${dir} nulls last`, desc(receipts.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(receipts).where(where),
  ]);

  void logAuditEvent({
    userId: acct.userId,
    action: "accountant.receipt.list",
    entityType: "company",
    entityId: access.companyId,
    targetCompanyId: access.companyId,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({
    receipts: rows,
    total: totals[0]?.total ?? 0,
    page,
    pageSize,
  });
}
