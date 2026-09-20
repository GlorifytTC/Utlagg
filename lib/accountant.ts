import "server-only";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  companies,
  companyMembers,
  accountantClients,
  firmMembers,
  workerAssignments,
} from "@/db/schema";

/**
 * Accountant authorization layer — FIRM-scoped, role-aware, with per-worker
 * customer assignments.
 *
 * Firm roles: owner > admin > member (worker).
 *   - owner  : full firm control; the ONLY role that may remove a
 *              firm<->customer relationship.
 *   - admin  : sees ALL firm customers; manages people (not the owner) and
 *              worker assignments; adds customers. Cannot remove a
 *              firm<->customer relationship.
 *   - member : a WORKER. Sees ONLY customers explicitly assigned to them via
 *              worker_assignments. No management.
 *
 * ACCESS RULE (requireCompanyAccess), enforced server-side on every request:
 *   1. authenticate + confirm isAccountant (fresh from DB)
 *   2. resolve the caller's firm + role (firmMembers)
 *   3. confirm the FIRM has an ACTIVE relationship with the customer company
 *   4. owner/admin -> allowed. member/worker -> allowed ONLY if a
 *      worker_assignments row connects them to that company.
 *   5. resolve the company's CURRENT member userIds -> the query scope.
 *
 * The browser is never trusted: a companyId means nothing until this returns
 * non-null. Callers MUST treat null as 403/404 and never fall through.
 */

export type AccountantSession = { userId: string; email: string | null };

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

export type FirmRole = "owner" | "admin" | "member";
export type FirmMembership = { firmId: string; role: FirmRole };

/**
 * Resolve a user's firm membership from the DB at request time (never cached).
 * A user belongs to at most one firm (app rule + backfill); if several rows
 * somehow exist, the earliest is chosen deterministically. Null if in no firm.
 */
export async function getUserFirm(userId: string): Promise<FirmMembership | null> {
  if (!userId) return null;
  const [m] = await db
    .select({ firmId: firmMembers.firmId, role: firmMembers.role })
    .from(firmMembers)
    .where(eq(firmMembers.userId, userId))
    .orderBy(firmMembers.createdAt)
    .limit(1);
  return m ? { firmId: m.firmId, role: m.role as FirmRole } : null;
}

const ROLE_RANK: Record<FirmRole, number> = { member: 0, admin: 1, owner: 2 };

/** True if `role` is at least `min` in the firm hierarchy. */
export function firmRoleAtLeast(role: FirmRole, min: FirmRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Owner or admin — the roles that manage people, assignments, and customers. */
export function canManageFirm(role: FirmRole): boolean {
  return firmRoleAtLeast(role, "admin");
}

/** Requires the caller to be an accountant AND a firm member. */
export async function requireFirmMembership(): Promise<
  { userId: string; email: string | null; firmId: string; role: FirmRole } | null
> {
  const acct = await requireAccountant();
  if (!acct) return null;
  const firm = await getUserFirm(acct.userId);
  if (!firm) return null;
  return { userId: acct.userId, email: acct.email, firmId: firm.firmId, role: firm.role };
}

/** Requires firm membership with at least role `min`. */
export async function requireFirmRole(
  min: FirmRole,
): Promise<{ userId: string; email: string | null; firmId: string; role: FirmRole } | null> {
  const m = await requireFirmMembership();
  if (!m) return null;
  return firmRoleAtLeast(m.role, min) ? m : null;
}

export type CompanyAccess = {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  firmId: string;
  role: FirmRole;
  /** userIds of the company's CURRENT members — the scope for every query. */
  memberIds: string[];
};

/**
 * The access gate. `accountantId` is the authenticated caller's user id (kept
 * for signature compatibility). Returns access ONLY when:
 *   - caller is in a firm, AND
 *   - the firm has an ACTIVE relationship with companyId, AND
 *   - caller is owner/admin (see all) OR a worker assigned to this company.
 * Otherwise null (403/404). Revocation, wrong firm, or an unassigned worker all
 * yield null immediately.
 */
export async function requireCompanyAccess(
  accountantId: string,
  companyId: string,
): Promise<CompanyAccess | null> {
  if (!accountantId || !companyId) return null;

  const firm = await getUserFirm(accountantId);
  if (!firm) return null;

  // The firm must actively work with this customer.
  const [rel] = await db
    .select({ companyName: companies.name, logoUrl: companies.logoUrl })
    .from(accountantClients)
    .innerJoin(companies, eq(companies.id, accountantClients.companyId))
    .where(
      and(
        eq(accountantClients.firmId, firm.firmId),
        eq(accountantClients.companyId, companyId),
        eq(accountantClients.status, "active"),
      ),
    )
    .limit(1);
  if (!rel) return null;

  // Workers (members) need an explicit assignment; owner/admin see all.
  if (firm.role === "member") {
    const [assigned] = await db
      .select({ id: workerAssignments.id })
      .from(workerAssignments)
      .where(
        and(
          eq(workerAssignments.firmId, firm.firmId),
          eq(workerAssignments.workerId, accountantId),
          eq(workerAssignments.companyId, companyId),
        ),
      )
      .limit(1);
    if (!assigned) return null;
  }

  const members = await db
    .select({ userId: companyMembers.userId })
    .from(companyMembers)
    .where(eq(companyMembers.companyId, companyId));
  const memberIds = members.map((m: { userId: string }) => m.userId);

  return { companyId, companyName: rel.companyName, logoUrl: rel.logoUrl ?? null, firmId: firm.firmId, role: firm.role, memberIds };
}
