import { NextResponse, type NextRequest } from "next/server";
import { and, count, desc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { getClientScope, requireAccountant } from "@/lib/accountant";
import { LOW_CONFIDENCE, listColumns, parseListParams } from "@/lib/accountant-receipts";

export const runtime = "nodejs";

/**
 * Work-queue lists across ALL of the accountant's active clients - the
 * drill-down behind the dashboard tiles (counts in /api/accountant/attention).
 *   filter=review    → reviewed_at IS NULL
 *   filter=uncertain → reviewed_at IS NULL AND ai_confidence < 0.6
 *   filter=missing   → vat_amount / bas_code / category NULL
 *   filter=pending   → status = 'pending'
 *   filter=month    → dated this UTC month (same window as firm/stats)
 *   filter=reviewed → reviewed_by = me, within range=week|month (7/30 days)
 * Same scope (getClientScope → current members) as the counts, so numbers match.
 * Each row carries the client it is shown under; the editor re-checks access
 * per company via requireCompanyAccess.
 */
export async function GET(req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const filter = sp.get("filter");
  if (!["review", "uncertain", "missing", "pending", "month", "reviewed"].includes(filter ?? "")) {
    return NextResponse.json({ error: "Ogiltigt filter" }, { status: 400 });
  }
  const { conditions, page, pageSize, sortCol, dir } = parseListParams(sp);

  const { clients, membersByCompany } = await getClientScope(acct.userId);
  const memberIds = Array.from(new Set(Array.from(membersByCompany.values()).flat()));
  if (memberIds.length === 0) return NextResponse.json({ receipts: [], total: 0, page, pageSize });

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const periodDate = sql`coalesce(${receipts.date}, ${receipts.createdAt})`;
  const days = sp.get("range") === "week" ? 7 : 30;

  // Each filter mirrors the dashboard tile count it drills down from.
  const byFilter = {
    // "missing": any receipt (reviewed or not) lacking VAT/BAS/category
    missing: or(isNull(receipts.vatAmount), isNull(receipts.basCode), isNull(receipts.category)),
    pending: eq(receipts.status, "pending"),
    month: and(
      gte(periodDate, sql`${monthStart.toISOString()}::timestamptz`),
      lt(periodDate, sql`${monthEnd.toISOString()}::timestamptz`),
    ),
    reviewed: and(
      eq(receipts.reviewedBy, acct.userId),
      gte(receipts.reviewedAt, sql`now() - ${`${days} days`}::interval`),
    ),
  }[filter as string] ?? isNull(receipts.reviewedAt);

  const where = and(
    inArray(receipts.userId, memberIds), // THE security boundary
    byFilter,
    filter === "uncertain" ? lt(receipts.aiConfidence, LOW_CONFIDENCE) : undefined,
    ...conditions,
  );

  const [rows, totals] = await Promise.all([
    db
      .select({ ...listColumns, ownerId: receipts.userId })
      .from(receipts)
      .where(where)
      .orderBy(sql`${sortCol} ${dir} nulls last`, desc(receipts.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(receipts).where(where),
  ]);

  // Show each row under the first client its owner belongs to.
  const clientOf = (userId: string) =>
    clients.find((c) => membersByCompany.get(c.companyId)?.includes(userId));

  return NextResponse.json({
    receipts: rows.map(({ ownerId, ...r }: (typeof rows)[number]) => {
      const c = clientOf(ownerId);
      return { ...r, companyId: c?.companyId, companyName: c?.companyName };
    }),
    total: totals[0]?.total ?? 0,
    page,
    pageSize,
  });
}
