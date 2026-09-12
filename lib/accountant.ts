import "server-only";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, companies, companyMembers, accountantClients } from "@/db/schema";

/**
 * Accountant authorization layer (COMPANY-level).
 *
 * The accountant connects to a BUSINESS (company), not an individual. Access
 * to a company's receipts is resolved through the company's CURRENT
 * membership — NOT through receipts.companyId, which is a nullable snapshot
 * set at creation time and would silently miss receipts a member logged
 * before joining the company. receipts.userId is notNull and immutable, so
 * "receipts owned by any current member of the company" is the complete,
 * reliable scope.
 *
 * SECURITY MODEL: every accountant API must, server-side:
 *   1. authenticate the caller
 *   2. confirm they are an accountant (users.isAccountant, read fresh)
 *   3. confirm the target company exists
 *   4. confirm an ACTIVE accountant<->company relationship exists
 *   5. resolve the member userIds and scope every query to them
 *
 * The frontend is never trusted. A companyId in a URL means nothing until
 * requireCompanyAccess() has confirmed an active relationship. Callers MUST
 * treat a null return as 403/404 and never fall through to a query.
 */

export type AccountantSession = { userId: string; email: string | null };

/**
 * Returns the session if the caller is a signed-in accountant, else null.
 * "Accountant" is users.isAccountant — deliberately SEPARATE from
 * subscription tier and from the platform/company role, and read fresh from
 * the DB on every call (never cached in the JWT).
 */
export async function requireAccountant(): Promise<AccountantSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const [u] = await db
    .select({ isAccountant: users.isAccountant, email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!u?.isAccountant) return null;
  return { userId: session.user.id, email: u.email };
}

export type CompanyAccess = {
  companyId: string;
  companyName: string;
  /** userIds of the company's CURRENT members — the scope for every query. */
  memberIds: string[];
};

/**
 * Confirms the accountant has an ACTIVE relationship with companyId, and
 * returns the company plus its current member userIds. Returns null on any
 * failure (not an accountant's company, relationship pending/revoked, company
 * gone). Callers MUST treat null as 403/404 and never fall through to a query.
 *
 * The returned memberIds are what every downstream receipt query filters on
 * (WHERE receipts.userId IN memberIds), so a revoked or unrelated company can
 * never leak data. A relationship whose status is anything other than "active"
 * yields no access — revocation therefore takes effect immediately.
 */
export async function requireCompanyAccess(
  accountantId: string,
  companyId: string,
): Promise<CompanyAccess | null> {
  if (!accountantId || !companyId) return null;

  const [rel] = await db
    .select({ companyName: companies.name })
    .from(accountantClients)
    .innerJoin(companies, eq(companies.id, accountantClients.companyId))
    .where(
      and(
        eq(accountantClients.accountantId, accountantId),
        eq(accountantClients.companyId, companyId),
        eq(accountantClients.status, "active"),
      ),
    )
    .limit(1);
  if (!rel) return null;

  const members = await db
    .select({ userId: companyMembers.userId })
    .from(companyMembers)
    .where(eq(companyMembers.companyId, companyId));
  const memberIds = members.map((m: { userId: string }) => m.userId);

  return { companyId, companyName: rel.companyName, memberIds };
}
