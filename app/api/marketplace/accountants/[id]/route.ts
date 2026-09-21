import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, avg, count, eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  companies,
  accountantClients,
  accountantConnectionRequests,
  accountantBoosts,
  accountantReviews,
  firmMembers,
  accountingFirms,
} from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";

export const runtime = "nodejs";

/**
 * GET /api/marketplace/accountants/[id] — full accountant profile.
 *
 * Returns safe display fields, reviews (company name + rating + comment),
 * viewer's request/relationship state, and whether the viewer may request
 * or leave a review. No passwords, billing, or subscription data returned.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await params;

  const [acct] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      logoUrl: users.logoUrl,
      accountantCity: users.accountantCity,
      accountantBio: users.accountantBio,
      accountantSpecializations: users.accountantSpecializations,
      isAccountant: users.isAccountant,
    })
    .from(users)
    .where(and(eq(users.id, id), eq(users.isAccountant, true)))
    .limit(1);

  if (!acct) return NextResponse.json({ error: "Revisorn hittades inte." }, { status: 404 });

  const [clientCountRow, boostRow, reviewStats, reviewRows, membershipRows] = await Promise.all([
    db
      .select({ count: count() })
      .from(accountantClients)
      .where(and(eq(accountantClients.accountantId, id), eq(accountantClients.status, "active"))),
    db
      .select({ accountantId: accountantBoosts.accountantId })
      .from(accountantBoosts)
      .where(
        and(
          eq(accountantBoosts.accountantId, id),
          eq(accountantBoosts.status, "active"),
          sql`${accountantBoosts.expiresAt} > now()`,
        ),
      )
      .limit(1),
    db
      .select({
        avgRating: avg(accountantReviews.rating),
        reviewCount: count(),
      })
      .from(accountantReviews)
      .where(eq(accountantReviews.accountantId, id)),
    db
      .select({
        id: accountantReviews.id,
        companyName: companies.name,
        rating: accountantReviews.rating,
        comment: accountantReviews.comment,
        createdAt: accountantReviews.createdAt,
      })
      .from(accountantReviews)
      .innerJoin(companies, eq(companies.id, accountantReviews.companyId))
      .where(eq(accountantReviews.accountantId, id))
      .orderBy(desc(accountantReviews.createdAt)),
    db
      .select({
        firmId: firmMembers.firmId,
        firmName: accountingFirms.name,
        firmLogoUrl: accountingFirms.logoUrl,
      })
      .from(firmMembers)
      .innerJoin(accountingFirms, eq(accountingFirms.id, firmMembers.firmId))
      .where(eq(firmMembers.userId, id))
      .limit(1),
  ]);

  let firm: { id: string; name: string; logoUrl: string | null; members: { id: string; name: string | null; email: string; logoUrl: string | null; role: string }[] } | null = null;
  if (membershipRows[0]) {
    const { firmId, firmName, firmLogoUrl } = membershipRows[0];
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        logoUrl: users.logoUrl,
        role: firmMembers.role,
      })
      .from(firmMembers)
      .innerJoin(users, eq(users.id, firmMembers.userId))
      .where(eq(firmMembers.firmId, firmId));
    firm = { id: firmId, name: firmName, logoUrl: firmLogoUrl, members };
  }

  // Viewer state
  const viewerCompany = await getUserCompany(session.user.id);
  let myStatus: string | null = null;
  let clientId: string | null = null;
  let viewerCanRequest = false;
  let viewerCanReview = false;
  let viewerExistingReview: { rating: number; comment: string | null } | null = null;

  if (viewerCompany) {
    viewerCanRequest = canManageCompany(viewerCompany.role);

    const [req] = await db
      .select({ status: accountantConnectionRequests.status })
      .from(accountantConnectionRequests)
      .where(
        and(
          eq(accountantConnectionRequests.companyId, viewerCompany.companyId),
          eq(accountantConnectionRequests.accountantId, id),
        ),
      )
      .limit(1);

    const [rel] = await db
      .select({ status: accountantClients.status, id: accountantClients.id })
      .from(accountantClients)
      .where(
        and(
          eq(accountantClients.companyId, viewerCompany.companyId),
          eq(accountantClients.accountantId, id),
          eq(accountantClients.status, "active"),
        ),
      )
      .limit(1);

    if (rel) {
      myStatus = "active";
      viewerCanReview = canManageCompany(viewerCompany.role);
    } else if (req) {
      myStatus = req.status;
    }
    clientId = rel?.id ?? null;

    if (viewerCanReview) {
      const [existing] = await db
        .select({ rating: accountantReviews.rating, comment: accountantReviews.comment })
        .from(accountantReviews)
        .where(
          and(
            eq(accountantReviews.accountantId, id),
            eq(accountantReviews.companyId, viewerCompany.companyId),
          ),
        )
        .limit(1);
      viewerExistingReview = existing ?? null;
    }
  }

  const avgRating = reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating) : null;

  return NextResponse.json({
    accountant: {
      id: acct.id,
      name: acct.name,
      email: acct.email,
      logoUrl: acct.logoUrl,
      city: acct.accountantCity,
      bio: acct.accountantBio,
      specializations: acct.accountantSpecializations,
      activeClientCount: clientCountRow[0]?.count ?? 0,
      isBoosted: boostRow.length > 0,
      avgRating,
      reviewCount: reviewStats[0]?.reviewCount ?? 0,
    },
    reviews: reviewRows,
    myStatus,
    clientId: clientId ?? null,
    viewerCanRequest,
    viewerCanReview,
    viewerExistingReview,
    firm,
  });
}
