import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accountantClients } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";

export const runtime = "nodejs";

/**
 * GET — lists the accountants with ACTIVE access to the authenticated user's
 * CURRENT company, so the company settings UI can show and revoke them.
 *
 * AUTHORIZATION (never trusts a browser companyId):
 *   authenticated → resolve caller's CURRENT company via getUserCompany →
 *   require canManageCompany(owner/admin) → return only active
 *   accountantClients for THAT company.
 *
 * The company is always the caller's own; there is no companyId input, so
 * Company A can never receive Company B's accountants, and an ordinary member
 * (not owner/admin) is refused. Only safe display fields are exposed
 * (relationship id, accountant name/email, status, activatedAt).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag." }, { status: 404 });
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });
  }

  const rows = await db
    .select({
      relationshipId: accountantClients.id,
      accountantId: accountantClients.accountantId,
      name: users.name,
      email: users.email,
      status: accountantClients.status,
      connectedAt: accountantClients.activatedAt,
    })
    .from(accountantClients)
    .innerJoin(users, eq(users.id, accountantClients.accountantId))
    .where(
      and(
        eq(accountantClients.companyId, membership.companyId),
        eq(accountantClients.status, "active"),
      ),
    );

  return NextResponse.json({ accountants: rows });
}
