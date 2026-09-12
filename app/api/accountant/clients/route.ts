import { NextResponse, type NextRequest } from "next/server";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { accountantClients, companies, companyMembers, receipts } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";

export const runtime = "nodejs";

const MAX_PAGE_SIZE = 100;

/**
 * Lists the companies this accountant has an ACTIVE relationship with.
 * Pending and revoked relationships are never returned. Only minimal,
 * non-sensitive company fields are exposed (name/city/country + a receipt
 * count) — no member, billing, subscription, credential, or private data.
 *
 * AUTHORIZATION: requireAccountant() first; every row is filtered by
 * accountantId = this accountant AND status = 'active'. A browser cannot ask
 * for another accountant's clients — the accountantId comes from the session,
 * never from input.
 */
export async function GET(req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || 25));

  const where = and(
    eq(accountantClients.accountantId, acct.userId),
    eq(accountantClients.status, "active"),
  );

  const [rows, totals] = await Promise.all([
    db
      .select({
        companyId: companies.id,
        companyName: companies.name,
        city: companies.city,
        country: companies.country,
        connectedAt: accountantClients.activatedAt,
      })
      .from(accountantClients)
      .innerJoin(companies, eq(companies.id, accountantClients.companyId))
      .where(where)
      .orderBy(desc(accountantClients.activatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(accountantClients).where(where),
  ]);

  // Receipt counts per listed company, scoped to each company's CURRENT
  // members (never receipts.companyId). Bounded to the page's companies.
  const companyIds = rows.map((r: { companyId: string }) => r.companyId);
  const countsByCompany = new Map<string, number>();
  if (companyIds.length > 0) {
    const memberRows = await db
      .select({ companyId: companyMembers.companyId, userId: companyMembers.userId })
      .from(companyMembers)
      .where(inArray(companyMembers.companyId, companyIds));
    const membersByCompany = new Map<string, string[]>();
    for (const m of memberRows) {
      const list = membersByCompany.get(m.companyId) ?? [];
      list.push(m.userId);
      membersByCompany.set(m.companyId, list);
    }
    for (const cid of companyIds) {
      const memberIds = membersByCompany.get(cid) ?? [];
      if (memberIds.length === 0) {
        countsByCompany.set(cid, 0);
        continue;
      }
      const [c] = await db
        .select({ total: count() })
        .from(receipts)
        .where(inArray(receipts.userId, memberIds));
      countsByCompany.set(cid, Number(c?.total ?? 0));
    }
  }

  return NextResponse.json({
    clients: rows.map((r: { companyId: string }) => ({
      ...r,
      receiptCount: countsByCompany.get(r.companyId) ?? 0,
    })),
    total: totals[0]?.total ?? 0,
    page,
    pageSize,
  });
}
