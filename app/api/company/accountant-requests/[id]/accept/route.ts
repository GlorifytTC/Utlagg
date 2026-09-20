import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountantConnectionRequests, accountantClients } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { getUserFirm } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * POST — the COMPANY (owner/admin) ACCEPTS an accountant's connection request.
 * Mirror of the accountant-side accept, but company-authorized: the request is
 * loaded by id AND the caller's own company (from the session — never a browser
 * companyId), so a company can only accept requests addressed to itself. Only a
 * pending request can be accepted. Accept activates the accountantClients
 * relationship (create or reactivate), respecting the unique constraint.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const membership = await getUserCompany(session.user.id);
  if (!membership) return NextResponse.json({ error: "Inget företag." }, { status: 404 });
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Endast ägare/admin." }, { status: 403 });
  }

  // Scoped to the caller's company — a request for another company → 404.
  const [reqRow] = await db
    .select()
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

  const [existingRel] = await db
    .select({ id: accountantClients.id, status: accountantClients.status })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.accountantId, reqRow.accountantId),
        eq(accountantClients.companyId, membership.companyId),
      ),
    )
    .limit(1);

  if (existingRel) {
    if (existingRel.status !== "active") {
      await db
        .update(accountantClients)
        .set({ status: "active", activatedAt: new Date(), revokedAt: null, revokedBy: null })
        .where(eq(accountantClients.id, existingRel.id));
    }
  } else {
    const firm = await getUserFirm(reqRow.accountantId);
    await db.insert(accountantClients).values({
      accountantId: reqRow.accountantId,
      firmId: firm?.firmId ?? null,
      companyId: membership.companyId,
      status: "active",
      activatedAt: new Date(),
    });
  }

  await db
    .update(accountantConnectionRequests)
    .set({ status: "active", respondedAt: new Date() })
    .where(eq(accountantConnectionRequests.id, reqRow.id));

  await logAudit({
    userId: session.user.id,
    action: "company.accountant_request.accept",
    details: `company ${membership.companyId} accepted accountant ${reqRow.accountantId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
