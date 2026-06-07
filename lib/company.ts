import "server-only";
import { eq } from "drizzle-orm";
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

export function roleAtLeast(role: CompanyRole, min: CompanyRole): boolean {
  return RANK[role] >= RANK[min];
}

/** Can this role manage members / company settings? (owner or admin) */
export function canManageCompany(role: CompanyRole): boolean {
  return roleAtLeast(role, "admin");
}
