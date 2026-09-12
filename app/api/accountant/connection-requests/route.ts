import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, companies, accountantConnectionRequests, accountantClients } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany, canManageCompany } from "@/lib/company";
import { requireAccountant } from "@/lib/accountant";
import { logAuditEvent, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const createSchema = z.object({ accountantId: z.string().uuid() });

/**
 * POST — a company (owner/admin) requests a connection with an accountant.
 *
 * AUTHORIZATION (server-side, never trusts a browser companyId):
 *   authenticated user → resolve their CURRENT company from the DB →
 *   verify owner/admin (canManageCompany) → verify target user exists AND is
 *   an accountant → create the request.
 *
 * Creating a request grants NO access. The unique (companyId, accountantId)
 * constraint means at most one request row per pair, so we upsert: a prior
 * declined (revoked) request is reset to pending; an existing pending one is
 * left as-is; and if an ACTIVE relationship already exists we return 409
 * (already connected) rather than creating a duplicate.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "accountant-conn-req-create");
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const { accountantId } = parsed.data;

  // Company is resolved from the DB by the caller's identity — never from input.
  const membership = await getUserCompany(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Du behöver ett företag först.", needsCompany: true }, { status: 409 });
  }
  if (!canManageCompany(membership.role)) {
    return NextResponse.json({ error: "Endast ägare/admin kan begära revisor." }, { status: 403 });
  }
  const companyId = membership.companyId;

  // Target must exist and actually be an accountant.
  const [target] = await db
    .select({ id: users.id, isAccountant: users.isAccountant })
    .from(users)
    .where(eq(users.id, accountantId))
    .limit(1);
  if (!target || !target.isAccountant) {
    return NextResponse.json({ error: "Revisorn hittades inte." }, { status: 404 });
  }

  // Already actively connected? Don't create a duplicate relationship/request.
  const [activeRel] = await db
    .select({ id: accountantClients.id })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.accountantId, accountantId),
        eq(accountantClients.companyId, companyId),
        eq(accountantClients.status, "active"),
      ),
    )
    .limit(1);
  if (activeRel) {
    return NextResponse.json({ error: "Redan kopplad till denna revisor.", alreadyConnected: true }, { status: 409 });
  }

  // Upsert the request row (unique on companyId+accountantId).
  const [existing] = await db
    .select({ id: accountantConnectionRequests.id, status: accountantConnectionRequests.status })
    .from(accountantConnectionRequests)
    .where(
      and(
        eq(accountantConnectionRequests.companyId, companyId),
        eq(accountantConnectionRequests.accountantId, accountantId),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.status === "pending") {
      return NextResponse.json({ ok: true, alreadyPending: true }, { status: 200 });
    }
    // A prior declined/revoked request → reopen as pending (accountant must
    // still accept; this does NOT reactivate any relationship).
    await db
      .update(accountantConnectionRequests)
      .set({ status: "pending", requestedBy: session.user.id, createdAt: new Date(), respondedAt: null })
      .where(eq(accountantConnectionRequests.id, existing.id));
  } else {
    await db.insert(accountantConnectionRequests).values({
      companyId,
      accountantId,
      requestedBy: session.user.id,
      status: "pending",
    });
  }

  await logAuditEvent({
    userId: session.user.id,
    action: "accountant.connection_request.create",
    entityType: "accountant_connection_request",
    entityId: `${companyId}:${accountantId}`,
    details: `company ${companyId} → accountant ${accountantId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}

/**
 * GET — the AUTHENTICATED ACCOUNTANT's incoming connection requests (§2).
 * Returns only requests where accountantId = this accountant; another
 * accountant's requests never appear. Exposes company id/name + request
 * status only — no members, billing, credentials, or private user data.
 */
export async function GET(req: NextRequest) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 25));
  const statusFilter = sp.get("status"); // optional: pending|active|revoked

  const conds = [eq(accountantConnectionRequests.accountantId, acct.userId)];
  if (statusFilter === "pending" || statusFilter === "active" || statusFilter === "revoked") {
    conds.push(eq(accountantConnectionRequests.status, statusFilter));
  }

  const rows = await db
    .select({
      id: accountantConnectionRequests.id,
      companyId: accountantConnectionRequests.companyId,
      companyName: companies.name,
      status: accountantConnectionRequests.status,
      createdAt: accountantConnectionRequests.createdAt,
      respondedAt: accountantConnectionRequests.respondedAt,
    })
    .from(accountantConnectionRequests)
    .innerJoin(companies, eq(companies.id, accountantConnectionRequests.companyId))
    .where(and(...conds))
    .orderBy(desc(accountantConnectionRequests.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return NextResponse.json({ requests: rows, page, pageSize });
}
