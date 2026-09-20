import { NextResponse, type NextRequest } from "next/server";
import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { bucketForBasCode, type SpendBucket } from "@/lib/stats-categories";

export const runtime = "nodejs";

/**
 * Per-client analytics for the accountant. Mirrors /api/stats/overview
 * response shape but scoped to the company's CURRENT member userIds via
 * requireCompanyAccess (never receipts.companyId). Adds pendingCount to kpi
 * and recentReceipts (mode=month only).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  const memberIds = access.memberIds;
  if (memberIds.length === 0) {
    return NextResponse.json({
      range: "month",
      period: "",
      trend: [],
      categories: [],
      kpi: { totalAmount: 0, totalVat: 0, count: 0, pendingCount: 0, avgPerReceipt: 0, topCategory: null },
      recentReceipts: [],
    });
  }

  const sp = req.nextUrl.searchParams;
  const monthParam = sp.get("month");
  const yearParam = sp.get("year");
  const now = new Date();

  let mode: "month" | "year";
  let periodStart: Date;
  let periodEnd: Date;
  let periodLabel: string;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    mode = "month";
    periodStart = new Date(Date.UTC(y, m - 1, 1));
    periodEnd = new Date(Date.UTC(y, m, 1));
    periodLabel = monthParam;
  } else if (yearParam && /^\d{4}$/.test(yearParam)) {
    const y = Number(yearParam);
    mode = "year";
    periodStart = new Date(Date.UTC(y, 0, 1));
    periodEnd = new Date(Date.UTC(y + 1, 0, 1));
    periodLabel = yearParam;
  } else {
    mode = "month";
    periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    periodLabel = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const periodDate = sql`coalesce(${receipts.date}, ${receipts.createdAt})`;
  const scopedToMembers = inArray(receipts.userId, memberIds);
  const inPeriod = and(
    scopedToMembers,
    gte(periodDate, sql`${periodStart.toISOString()}::timestamptz`),
    lt(periodDate, sql`${periodEnd.toISOString()}::timestamptz`),
  );

  const trunc = mode === "year" ? "month" : "day";
  const trendFmt = mode === "year" ? "'YYYY-MM'" : "'YYYY-MM-DD'";

  const [trendRows, categoryRows, totals, pendingResult, recentRows] = await Promise.all([
    db
      .select({
        bucket: sql<string>`to_char(date_trunc(${sql.raw(`'${trunc}'`)}, ${periodDate}), ${sql.raw(trendFmt)})`,
        amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(receipts)
      .where(inPeriod)
      .groupBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${periodDate})`)
      .orderBy(sql`date_trunc(${sql.raw(`'${trunc}'`)}, ${periodDate}) asc`),

    db
      .select({
        basCode: receipts.basCode,
        amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        cnt: count(),
      })
      .from(receipts)
      .where(inPeriod)
      .groupBy(receipts.basCode),

    db
      .select({
        totalAmount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        totalVat: sql<number>`coalesce(sum(${receipts.vatAmount}), 0)::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(receipts)
      .where(inPeriod),

    db
      .select({ cnt: count() })
      .from(receipts)
      .where(and(scopedToMembers, eq(receipts.status, "pending"))),

    // Recent receipts only included in month mode (most actionable)
    mode === "month"
      ? db
          .select({
            id: receipts.id,
            vendorName: receipts.vendorName,
            date: receipts.date,
            totalAmount: receipts.totalAmount,
            status: receipts.status,
            createdAt: receipts.createdAt,
          })
          .from(receipts)
          .where(scopedToMembers)
          .orderBy(desc(sql`coalesce(${receipts.date}, ${receipts.createdAt})`))
          .limit(5)
      : Promise.resolve([]),
  ]);

  const byBucket = new Map<SpendBucket, { amount: number; count: number }>();
  for (const r of categoryRows) {
    const bucket = bucketForBasCode(r.basCode);
    const prev = byBucket.get(bucket) ?? { amount: 0, count: 0 };
    byBucket.set(bucket, { amount: prev.amount + Number(r.amount), count: prev.count + Number(r.cnt) });
  }
  const categories = Array.from(byBucket.entries())
    .map(([bucket, v]) => ({ bucket, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount);

  const totalAmount = Number(totals[0]?.totalAmount ?? 0);
  const receiptCount = Number(totals[0]?.count ?? 0);

  return NextResponse.json({
    range: mode,
    period: periodLabel,
    trend: (trendRows as { bucket: string; amount: number; count: number }[]).map((r) => ({
      bucket: r.bucket,
      amount: Number(r.amount),
      count: Number(r.count),
    })),
    categories,
    kpi: {
      totalAmount,
      totalVat: Number(totals[0]?.totalVat ?? 0),
      count: receiptCount,
      pendingCount: Number(pendingResult[0]?.cnt ?? 0),
      avgPerReceipt: receiptCount > 0 ? totalAmount / receiptCount : 0,
      topCategory: categories[0] ? { bucket: categories[0].bucket, amount: categories[0].amount } : null,
    },
    recentReceipts: recentRows,
  });
}
