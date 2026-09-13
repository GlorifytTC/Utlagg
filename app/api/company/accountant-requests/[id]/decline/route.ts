import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountantConnectionRequests } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * POST — the COMPANY (owner/admin) DECLINES an accountant's connection request.
 * Company-scoped (request must belong to the caller's own company). Only
 * pending can be declined. Sets status=revoked, respondedAt. Creates NO
 * relationship and grants NO access.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag." }, { status: 404 });
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });
  }

  const [reqRow] = await db
    .select({ id: accountantConnectionRequests.id, status: accountantConnectionRequests.status })
    .from(accountantConnectionRequests)
    .where(
      and(
        eq(accountantConnectionRequests.id, params.id),
        eq(accountantConnectionRequests.companyId, membership.companyId),
      ),
    )
    .limit(1);
  if (!reqRow) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });
  if (reqRow.status !== "pending") {
    return NextResponse.json({ error: "Förfrågan är redan besvarad." }, { status: 409 });
  }

  await db
    .update(accountantConnectionRequests)
    .set({ status: "revoked", respondedAt: new Date() })
    .where(eq(accountantConnectionRequests.id, reqRow.id));

  await logAudit({
    userId: session.user.id,
    action: "company.accountant_request.decline",
    details: `company ${membership.companyId} declined request ${reqRow.id}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
