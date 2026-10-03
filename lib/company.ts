import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { companyMembers } from "@/db/schema";

export type CompanyRole = "owner" | "admin" | "approver" | "member";

const RANK: Record<CompanyRole, number> = {
  member: 0,
  approver: 1,
  admin: 2,
  owner: 3,
};

/** The user's company membership, or null if they aren't in a company. */
export async function getUserCompany(
  userId: string,
): Promise<{ companyId: string; role: CompanyRole } | null> {
  const [m] = await db
    .select({ companyId: companyMembers.companyId, role: companyMembers.role })
    .from(companyMembers)
    .where(eq(companyMembers.userId, userId))
    .limit(1);
  return m ? { companyId: m.companyId, role: m.role as CompanyRole } : null;
}

/** The company's owner - the account that pays for the whole team. */
export async function getCompanyOwnerId(companyId: string): Promise<string | null> {
  const [o] = await db
    .select({ userId: companyMembers.userId })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.role, "owner")))
    .limit(1);
  return o?.userId ?? null;
}

/**
 * The user whose plan/subscription applies to `userId`: the company owner for
 * company members (owner-pays model), otherwise the user themself.
 */
export async function getPayerUserId(userId: string): Promise<string> {
  const company = await getUserCompany(userId);
  if (!company) return userId;
  return (await getCompanyOwnerId(company.companyId)) ?? userId;
}

export function roleAtLeast(role: CompanyRole, min: CompanyRole): boolean {
  return RANK[role] >= RANK[min];
}

/** Can this role manage members / company settings? (owner or admin) */
export function canManageCompany(role: CompanyRole): boolean {
  return roleAtLeast(role, "admin");
}
