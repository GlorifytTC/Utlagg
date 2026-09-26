import { NextResponse, type NextRequest } from "next/server";
import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { accountantClients, companies, companyMembers, receipts, workerAssignments } from "@/db/schema";
import { requireAccountant, getUserFirm } from "@/lib/accountant";

export const runtime = "nodejs";

type Range = "day" | "week" | "month" | "3m" | "6m" | "year";
const VALID_RANGES: Range[] = ["day", "week", "month", "3m", "6m", "year"];

function rangeWindow(range: Range): [Date, Date] {
  const now = new Date();
  const u = Date.UTC;
  switch (range) {
    case "day":   return [new Date(now.getTime() - 86_400_000), now];
    case "week":  return [new Date(now.getTime() - 7 * 86_400_000), now];
    case "month": return [new Date(u(now.getUTCFullYear(), now.getUTCMonth(), 1)), new Date(u(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))];
    case "3m":    return [new Date(u(now.getUTCFullYear(), now.getUTCMonth() - 2, 1)), now];
    case "6m":    return [new Date(u(now.getUTCFullYear(), now.getUTCMonth() - 5, 1)), now];
    case "year":  return [new Date(u(now.getUTCFullYear() - 1, now.getUTCMonth() + 1, 1)), now];
  }
}

export async function GET(req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const firm = await getUserFirm(acct.userId);
  if (!firm) return NextResponse.json({ clients: [] });

  const rawRange = req.nextUrl.searchParams.get("range") ?? "month";
  const range: Range = VALID_RANGES.includes(rawRange as Range) ? (rawRange as Range) : "month";

  let extraFilter;
  if (firm.role === "member") {
    const assigned = await db
      .select({ companyId: workerAssignments.companyId })
      .from(workerAssignments)
      .where(and(eq(workerAssignments.firmId, firm.firmId), eq(workerAssignments.workerId, acct.userId)));
    const ids = assigned.map((a: { companyId: string }) => a.companyId);
    if (ids.length === 0) return NextResponse.json({ clients: [] });
    extraFilter = inArray(accountantClients.companyId, ids);
  }

  const clientRows = await db
    .select({ companyId: companies.id, companyName: companies.name })
    .from(accountantClients)
    .innerJoin(companies, eq(companies.id, accountantClients.companyId))
    .where(and(eq(accountantClients.firmId, firm.firmId), eq(accountantClients.status, "active"), extraFilter));

  if (clientRows.length === 0) return NextResponse.json({ clients: [] });

  const companyIds = clientRows.map((r: { companyId: string }) => r.companyId);
  const [start, end] = rangeWindow(range);
  const periodDate = sql`coalesce(${receipts.date}, ${receipts.createdAt})`;

  // Join receipts → companyMembers so the IN list is bounded by company count (not member count)
  const statRows = await db
    .select({
      companyId: companyMembers.companyId,
      amount: sql<number>`coalesce(sum(${receipts.totalAmount}), 0)::float`,
      cnt: count(),
    })
    .from(receipts)
    .innerJoin(companyMembers, eq(companyMembers.userId, receipts.userId))
    .where(
      and(
        inArray(companyMembers.companyId, companyIds),
        gte(periodDate, sql`${start.toISOString()}::timestamptz`),
        lt(periodDate, sql`${end.toISOString()}::timestamptz`),
      ),
    )
    .groupBy(companyMembers.companyId);

  const statsByCompany = new Map(
    (statRows as { companyId: string; amount: number; cnt: number }[]).map((r) => [
      r.companyId,
      { amount: Number(r.amount), count: Number(r.cnt) },
    ]),
  );

  const clients = clientRows
    .map((c: { companyId: string; companyName: string }) => ({
      companyId: c.companyId,
      companyName: c.companyName,
      amount: statsByCompany.get(c.companyId)?.amount ?? 0,
      count: statsByCompany.get(c.companyId)?.count ?? 0,
    }))
    .filter((c: { count: number; amount: number }) => c.count > 0 || c.amount > 0)
    .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);

  return NextResponse.json({ clients });
}
