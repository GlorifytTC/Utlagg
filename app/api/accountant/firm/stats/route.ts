import { NextResponse } from "next/server";
import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountantClients, companies, companyMembers, receipts, workerAssignments } from "@/db/schema";
import { requireAccountant, getUserFirm } from "@/lib/accountant";
import { bucketForBasCode, type SpendBucket } from "@/lib/stats-categories";

export const runtime = "nodejs";

const EMPTY = {
  totalClients: 0,
  pendingCount: 0,
  monthAmount: 0,
  monthVat: 0,
  clientsWithPending: [] as { companyId: string; companyName: string; pendingCount: number }[],
  categories: [] as { bucket: SpendBucket; amount: number; count: number }[],
  throughput: [] as { bucket: string; count: number }[],
};

export async function GET() {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const firm = await getUserFirm(acct.userId);
  if (!firm) return NextResponse.json(EMPTY);

  // Workers see only assigned companies; owner/admin see all firm clients.
  let extraFilter;
  if (firm.role === "member") {
    const assigned = await db
      .select({ companyId: workerAssignments.companyId })
      .from(workerAssignments)
      .where(and(eq(workerAssignments.firmId, firm.firmId), eq(workerAssignments.workerId, acct.userId)));
    const ids: string[] = assigned.map((a: { companyId: string }) => a.companyId);
    if (ids.length === 0) return NextResponse.json(EMPTY);
    extraFilter = inArray(accountantClients.companyId, ids);
  }

  const clientRows = await db
    .select({ companyId: companies.id, companyName: companies.name })
    .from(accountantClients)
    .innerJoin(companies, eq(companies.id, accountantClients.companyId))
    .where(and(eq(accountantClients.firmId, firm.firmId), eq(accountantClients.status, "active"), extraFilter));

  if (clientRows.length === 0) return NextResponse.json({ ...EMPTY });

  const companyIds: string[] = clientRows.map((r: { companyId: string; companyName: string }) => r.companyId);

  const memberRows = await db
    .select({ companyId: companyMembers.companyId, userId: companyMembers.userId })
    .from(companyMembers)
    .where(inArray(companyMembers.companyId, companyIds));

  const membersByCompany = new Map<string, string[]>();
  for (const m of memberRows as { companyId: string; userId: string }[]) {
    const list = membersByCompany.get(m.companyId) ?? [];
    list.push(m.userId);
    membersByCompany.set(m.companyId, list);
  }

  const allMemberIds: string[] = [
    ...new Set((memberRows as { userId: string }[]).map((m) => m.userId)),
  ];
  if (allMemberIds.length === 0) {
    return NextResponse.json({ ...EMPTY, totalClients: clientRows.length });
  }

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  // Rolling 12-month window for throughput
  const yearStart = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth() + 1, 1));

  const periodDate = sql`coalesce(${receipts.date}, ${receipts.createdAt})`;
  const scopedToMembers = inArray(receipts.userId, allMemberIds);

  const inMonth = and(
    scopedToMembers,
    gte(periodDate, sql`${monthStart.toISOString()}::timestamptz`),
    lt(periodDate, sql`${monthEnd.toISOString()}::timestamptz`),
  );

  const [pendingRows, monthTotals, categoryRows, throughputRows] = await Promise.all([
    db
      .select({ userId: receipts.userId, cnt: count() })
      .from(receipts)
      .where(and(scopedToMembers, eq(receipts.status, "pending")))
      .groupBy(receipts.userId),

    db
      .select({
        monthAmount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        monthVat: sql<number>`coalesce(sum(${receipts.vatAmount}), 0)::float`,
      })
      .from(receipts)
      .where(inMonth),

    db
      .select({
        basCode: receipts.basCode,
        amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
        cnt: count(),
      })
      .from(receipts)
      .where(inMonth)
      .groupBy(receipts.basCode),

    db
      .select({
        bucket: sql<string>`to_char(date_trunc('month', ${periodDate}), 'YYYY-MM')`,
        cnt: count(),
      })
      .from(receipts)
      .where(
        and(
          scopedToMembers,
          eq(receipts.status, "approved"),
          gte(periodDate, sql`${yearStart.toISOString()}::timestamptz`),
        ),
      )
      .groupBy(sql`date_trunc('month', ${periodDate})`)
      .orderBy(sql`date_trunc('month', ${periodDate}) asc`),
  ]);

  const pendingByUser = new Map<string, number>();
  for (const r of pendingRows as { userId: string; cnt: number }[]) {
    pendingByUser.set(r.userId, Number(r.cnt));
  }

  const totalPending: number = allMemberIds.reduce(
    (sum: number, uid: string) => sum + (pendingByUser.get(uid) ?? 0),
    0,
  );

  const clientsWithPending = (
    clientRows as { companyId: string; companyName: string }[]
  )
    .map((c) => {
      const memberIds = membersByCompany.get(c.companyId) ?? [];
      const pendingCount: number = memberIds.reduce(
        (s: number, uid: string) => s + (pendingByUser.get(uid) ?? 0),
        0,
      );
      return { companyId: c.companyId, companyName: c.companyName, pendingCount };
    })
    .filter((c) => c.pendingCount > 0)
    .sort((a, b) => b.pendingCount - a.pendingCount)
    .slice(0, 8);

  const byBucket = new Map<SpendBucket, { amount: number; count: number }>();
  for (const r of categoryRows as { basCode: string | null; amount: number; cnt: number }[]) {
    const bucket = bucketForBasCode(r.basCode);
    const prev = byBucket.get(bucket) ?? { amount: 0, count: 0 };
    byBucket.set(bucket, { amount: prev.amount + Number(r.amount), count: prev.count + Number(r.cnt) });
  }
  const categories = Array.from(byBucket.entries())
    .map(([bucket, v]) => ({ bucket, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    totalClients: clientRows.length,
    pendingCount: totalPending,
    monthAmount: Number(monthTotals[0]?.monthAmount ?? 0),
    monthVat: Number(monthTotals[0]?.monthVat ?? 0),
    clientsWithPending,
    categories,
    throughput: (throughputRows as { bucket: string; cnt: number }[]).map((r) => ({
      bucket: r.bucket,
      count: Number(r.cnt),
    })),
  });
}
