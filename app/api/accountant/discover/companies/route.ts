import { NextResponse, type NextRequest } from "next/server";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { companies, accountantClients, accountantConnectionRequests } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";

export const runtime = "nodejs";

const MAX_PAGE_SIZE = 50;

/**
 * GET /api/accountant/discover/companies — accountant marketplace discovery.
 *
 * Accountant-only (requireAccountant → 403). Returns ONLY companies that have
 * explicitly opted in (accountant_discoverable = true) and only safe public
 * fields (id, name, city, industry, description). Never exposes receipts,
 * financials, members, billing, org/vat, or anything private. Discovery grants
 * NO access — it only lets the accountant find a company to request.
 *
 * Ranking is deterministic and server-controlled (no browser score): companies
 * the accountant already has a pending/active link with are de-prioritised, and
 * the rest are ordered by newest opt-in then name. This is where a future
 * server-side Boost would slot into the ORDER BY — it never affects visibility,
 * only ordering.
 */
export async function GET(req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const city = sp.get("city")?.trim() ?? "";
  const industry = sp.get("industry")?.trim() ?? "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || 20));

  const conds = [eq(companies.accountantDiscoverable, true)];
  if (q) {
    const like = `%${q}%`;
    conds.push(or(ilike(companies.name, like), ilike(companies.discoveryDescription, like))!);
  }
  if (city) conds.push(ilike(companies.city, `%${city}%`));
  if (industry) conds.push(ilike(companies.industry, `%${industry}%`));

  const rows = await db
    .select({
      id: companies.id,
      name: companies.name,
      city: companies.city,
      industry: companies.industry,
      description: companies.discoveryDescription,
      createdAt: companies.createdAt,
    })
    .from(companies)
    .where(and(...conds))
    // Deterministic ranking (Boost would extend this ORDER BY later).
    .orderBy(desc(companies.createdAt), asc(companies.name))
    .limit(pageSize + 1)
    .offset((page - 1) * pageSize);

  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;

  // Annotate each with THIS accountant's own link state (pending/active) so the
  // UI can show the right CTA. Scoped to the accountant — never leaks others'.
  const ids = pageRows.map((r: { id: string }) => r.id);
  const myState = new Map<string, string>();
  if (ids.length) {
    const [reqs, rels] = await Promise.all([
      db
        .select({ companyId: accountantConnectionRequests.companyId, status: accountantConnectionRequests.status })
        .from(accountantConnectionRequests)
        .where(eq(accountantConnectionRequests.accountantId, acct.userId)),
      db
        .select({ companyId: accountantClients.companyId, status: accountantClients.status })
        .from(accountantClients)
        .where(eq(accountantClients.accountantId, acct.userId)),
    ]);
    for (const r of reqs) if (ids.includes(r.companyId)) myState.set(r.companyId, r.status);
    for (const r of rels) if (r.status === "active" && ids.includes(r.companyId)) myState.set(r.companyId, "active");
  }

  return NextResponse.json({
    companies: pageRows.map((r: { id: string }) => ({ ...r, myStatus: myState.get(r.id) ?? null })),
    page,
    pageSize,
    hasMore,
  });
}
