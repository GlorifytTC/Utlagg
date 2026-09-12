import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountantConnectionRequests, accountantClients } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";

export const runtime = "nodejs";

/**
 * GET /api/company/accountant-requests — the caller's OWN company's
 * accountant request + relationship state, so the "Find an accountant" UI can
 * label each accountant as pending / connected and avoid duplicate requests.
 *
 * Company is resolved from the session (never a browser companyId); owner/admin
 * only. Returns just { accountantId, status } pairs — no accountant-private
 * data. Company A can never see Company B's requests.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ requests: [], relationships: [] });
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });
  }

  const [requests, relationships] = await Promise.all([
    db
      .select({
        accountantId: accountantConnectionRequests.accountantId,
        status: accountantConnectionRequests.status,
      })
      .from(accountantConnectionRequests)
      .where(eq(accountantConnectionRequests.companyId, membership.companyId)),
    db
      .select({
        accountantId: accountantClients.accountantId,
        status: accountantClients.status,
      })
      .from(accountantClients)
      .where(eq(accountantClients.companyId, membership.companyId)),
  ]);

  // Merge into one accountantId→status view the UI can read: an active
  // relationship wins over a request row for the same accountant.
  const map = new Map<string, string>();
  for (const r of requests) map.set(r.accountantId, r.status);
  for (const rel of relationships) if (rel.status === "active") map.set(rel.accountantId, "active");

  return NextResponse.json({
    requests: Array.from(map.entries()).map(([accountantId, status]) => ({ accountantId, status })),
  });
}
