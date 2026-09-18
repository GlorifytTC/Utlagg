import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, avg, count, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  users,
  companies,
  accountantClients,
  accountantConnectionRequests,
  accountantBoosts,
  accountantReviews,
} from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { requireAccountant } from "@/lib/accountant";

export const runtime = "nodejs";

const MAX_PAGE_SIZE = 50;

const patchSchema = z.object({
  accountantCity: z.string().max(100).nullable().optional(),
  accountantBio: z.string().max(2000).nullable().optional(),
  accountantSpecializations: z.array(z.string().max(80)).max(10).nullable().optional(),
});

type AccountantRow = {
  id: string;
  name: string | null;
  email: string;
  logoUrl: string | null;
  accountantCity: string | null;
  accountantBio: string | null;
  accountantSpecializations: string[] | null;
  createdAt: Date | null;
};

type RankedItem = AccountantRow & {
  activeClientCount: number;
  relevance: number;
  avgRating: number | null;
  reviewCount: number;
};

/**
 * GET /api/marketplace/accountants — unified accountant marketplace.
 *
 * Any signed-in user can browse. Accountants are ranked by relevance (industry
 * match vs viewer's company) + popularity (active client count), with boost as
 * a tie-breaker within equal relevance. Only safe display fields are returned.
 *
 * ponytail: in-memory rank after DB filter. Fine for ~hundreds of accountants;
 * add a DB rank column if the listing grows to thousands.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const city = sp.get("city")?.trim() ?? "";
  const specialization = sp.get("specialization")?.trim() ?? "";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || 20));

  const conds = [eq(users.isAccountant, true)];
  if (q) {
    const like = `%${q}%`;
    conds.push(or(
      ilike(users.name, like),
      ilike(users.email, like),
      sql`${users.accountantSpecializations}::text ilike ${like}`,
    )!);
  }
  if (city) conds.push(ilike(users.accountantCity, `%${city}%`));
  if (specialization) {
    const likeSpec = `%${specialization}%`;
    conds.push(sql`${users.accountantSpecializations}::text ilike ${likeSpec}`);
  }

  const rows = (await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      logoUrl: users.logoUrl,
      accountantCity: users.accountantCity,
      accountantBio: users.accountantBio,
      accountantSpecializations: users.accountantSpecializations,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conds))) as AccountantRow[];

  if (!rows.length) {
    return NextResponse.json({ accountants: [], page: 1, pageSize, hasMore: false, viewerCanRequest: false });
  }

  const ids = rows.map((r) => r.id);

  const [clientCounts, activeBoosts, reviewStats, viewerCompany] = await Promise.all([
    db
      .select({
        accountantId: accountantClients.accountantId,
        count: sql<number>`count(*)::int`,
      })
      .from(accountantClients)
      .where(eq(accountantClients.status, "active"))
      .groupBy(accountantClients.accountantId),
    db
      .select({ accountantId: accountantBoosts.accountantId })
      .from(accountantBoosts)
      .where(
        and(
          eq(accountantBoosts.status, "active"),
          sql`${accountantBoosts.expiresAt} > now()`,
        ),
      ),
    db
      .select({
        accountantId: accountantReviews.accountantId,
        avgRating: avg(accountantReviews.rating),
        reviewCount: count(),
      })
      .from(accountantReviews)
      .groupBy(accountantReviews.accountantId),
    getUserCompany(session.user.id),
  ]);

  const clientCountMap = new Map<string, number>(
    clientCounts
      .filter((r: { accountantId: string; count: number }) => ids.includes(r.accountantId))
      .map((r: { accountantId: string; count: number }) => [r.accountantId, r.count]),
  );
  const boostedIds = new Set<string>(
    activeBoosts
      .filter((r: { accountantId: string }) => ids.includes(r.accountantId))
      .map((r: { accountantId: string }) => r.accountantId),
  );
  const reviewStatsMap = new Map<string, { avgRating: number | null; reviewCount: number }>(
    reviewStats
      .filter((r: { accountantId: string }) => ids.includes(r.accountantId))
      .map((r: { accountantId: string; avgRating: string | null; reviewCount: number }) => [
        r.accountantId,
        { avgRating: r.avgRating ? Number(r.avgRating) : null, reviewCount: r.reviewCount },
      ]),
  );

  let viewerIndustry: string | null = null;
  let viewerCanRequest = false;
  const statusMap = new Map<string, string>();

  if (viewerCompany) {
    viewerCanRequest = canManageCompany(viewerCompany.role);

    const [co] = await db
      .select({ industry: companies.industry })
      .from(companies)
      .where(eq(companies.id, viewerCompany.companyId))
      .limit(1);
    viewerIndustry = co?.industry ?? null;

    const [reqs, rels] = await Promise.all([
      db
        .select({
          accountantId: accountantConnectionRequests.accountantId,
          status: accountantConnectionRequests.status,
        })
        .from(accountantConnectionRequests)
        .where(eq(accountantConnectionRequests.companyId, viewerCompany.companyId)),
      db
        .select({ accountantId: accountantClients.accountantId })
        .from(accountantClients)
        .where(
          and(
            eq(accountantClients.companyId, viewerCompany.companyId),
            eq(accountantClients.status, "active"),
          ),
        ),
    ]);
    for (const r of reqs as { accountantId: string; status: string }[]) {
      statusMap.set(r.accountantId, r.status);
    }
    for (const r of rels as { accountantId: string }[]) {
      statusMap.set(r.accountantId, "active");
    }
  }

  // Compute relevance scores.
  const items: RankedItem[] = rows.map((a) => {
    let relevance = 0;
    const clientCount = clientCountMap.get(a.id) ?? 0;
    // Popularity: 0-2 points (3 clients = 1pt, 6 = 2pt).
    relevance += Math.min(Math.floor(clientCount / 3), 2);
    // Industry match: +3 if accountant lists viewer's industry.
    if (viewerIndustry && Array.isArray(a.accountantSpecializations)) {
      const lower = viewerIndustry.toLowerCase();
      if (a.accountantSpecializations.some((s) => s.toLowerCase() === lower)) {
        relevance += 3;
      }
    }
    const stats = reviewStatsMap.get(a.id);
    // Average rating: 0-2 pts (>= 4.0 = 1pt, >= 4.5 = 2pt).
    if (stats?.avgRating) {
      relevance += stats.avgRating >= 4.5 ? 2 : stats.avgRating >= 4.0 ? 1 : 0;
    }
    // Review volume: +1 pt for 3+ reviews.
    if ((stats?.reviewCount ?? 0) >= 3) relevance += 1;
    return {
      ...a,
      activeClientCount: clientCount,
      relevance,
      avgRating: stats?.avgRating ?? null,
      reviewCount: stats?.reviewCount ?? 0,
    };
  });

  // ponytail: same logic as rankAccountants() in lib/accountant-boost.ts
  items.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    const ab = boostedIds.has(a.id) ? 1 : 0;
    const bb = boostedIds.has(b.id) ? 1 : 0;
    if (bb !== ab) return bb - ab;
    // Secondary tie-breaks on raw signals before stable id sort.
    if (b.activeClientCount !== a.activeClientCount) return b.activeClientCount - a.activeClientCount;
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
    return a.id.localeCompare(b.id);
  });

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  const hasMore = start + pageSize < items.length;

  return NextResponse.json({
    accountants: pageItems.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      logoUrl: a.logoUrl,
      city: a.accountantCity,
      bio: a.accountantBio,
      specializations: a.accountantSpecializations,
      activeClientCount: a.activeClientCount,
      isBoosted: boostedIds.has(a.id),
      avgRating: a.avgRating,
      reviewCount: a.reviewCount,
      myStatus: statusMap.get(a.id) ?? null,
      joinedYear: a.createdAt ? new Date(a.createdAt).getFullYear() : null,
    })),
    page,
    pageSize,
    hasMore,
    viewerCanRequest,
  });
}

/**
 * PATCH /api/marketplace/accountants — accountant updates their own marketplace profile.
 */
export async function PATCH(req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const parsed = patchSchema.strict().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if ("accountantCity" in parsed.data) updates.accountantCity = parsed.data.accountantCity ?? null;
  if ("accountantBio" in parsed.data) updates.accountantBio = parsed.data.accountantBio ?? null;
  if ("accountantSpecializations" in parsed.data) {
    updates.accountantSpecializations = parsed.data.accountantSpecializations ?? null;
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true });

  await db.update(users).set(updates).where(eq(users.id, acct.userId));
  return NextResponse.json({ ok: true });
}
