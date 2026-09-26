import { NextResponse, type NextRequest } from "next/server";
import { and, count, desc, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { logAuditEvent, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

// Same list columns and conventions as GET /api/receipts — heavy fields
// (imageUrl, receiptText) deliberately excluded from the list payload.
const listColumns = {
  id: receipts.id,
  vendorName: receipts.vendorName,
  date: receipts.date,
  totalAmount: receipts.totalAmount,
  vatAmount: receipts.vatAmount,
  vatRate: receipts.vatRate,
  basCode: receipts.basCode,
  category: receipts.category,
  status: receipts.status,
  createdAt: receipts.createdAt,
  hasImage: sql<boolean>`${receipts.imageUrl} is not null`,
} as const;

const SORT_COLUMNS = {
  date: receipts.date,
  vendor: receipts.vendorName,
  bas: receipts.basCode,
  vat: receipts.vatAmount,
  amount: receipts.totalAmount,
  status: receipts.status,
} as const;

const MAX_PAGE_SIZE = 100;

/**
 * Receipts for one client company, for the accountant.
 *
 * AUTHORIZATION — relationship-first, member-scoped, in this exact order:
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

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || 25));
  const q = sp.get("q")?.trim() ?? "";
  const from = sp.get("from");
  const to = sp.get("to");
  const sortKey = (sp.get("sort") ?? "date") as keyof typeof SORT_COLUMNS;
  const sortCol = SORT_COLUMNS[sortKey] ?? receipts.date;
  const dir = sp.get("dir") === "asc" ? sql`asc` : sql`desc`;

  // A company with no current members has no authorized receipts — return an
  // empty page rather than an unscoped query.
  if (memberIds.length === 0) {
    return NextResponse.json({ receipts: [], total: 0, page, pageSize });
  }

  // THE security boundary: scope to current members, never receipts.companyId.
  const conditions = [inArray(receipts.userId, memberIds)];
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(receipts.vendorName, like),
        ilike(receipts.basCode, like),
        ilike(sql`${receipts.totalAmount}::text`, like),
      )!,
    );
  }
  if (from) conditions.push(gte(receipts.date, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(receipts.date, end));
  }
  const where = and(...conditions);

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
