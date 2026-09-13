import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { companies, accountantClients, accountantConnectionRequests } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";
import { logAudit, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ companyId: z.string().uuid() });

/**
 * POST /api/accountant/connection-requests/company — the ACCOUNTANT initiates a
 * connection request to a discoverable company (reverse of the company-side
 * request). Reuses the SAME accountantConnectionRequests table + lifecycle; no
 * second relationship system.
 *
 * AUTHORIZATION: requireAccountant() → the target company must currently be
 * accountant_discoverable = true (else 404 — no probing non-discoverable
 * companies). Creating a request grants NO access; only company acceptance
 * flips accountantClients to active. Duplicate pending is not stacked; an
 * existing active relationship returns 409; a prior declined/revoked request
 * reopens to pending. Rate-limited and audited.
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, "accountant-company-request");
  if (limited) return limited;

  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const { companyId } = parsed.data;

  // The company must currently be discoverable — otherwise it's as if it
  // doesn't exist to an accountant (no existence probing).
  const [company] = await db
    .select({ id: companies.id, discoverable: companies.accountantDiscoverable })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company || !company.discoverable) {
    return NextResponse.json({ error: "Företaget hittades inte." }, { status: 404 });
  }

  // Already actively connected? No duplicate.
  const [activeRel] = await db
    .select({ id: accountantClients.id })
    .from(accountantClients)
    .where(
      and(
        eq(accountantClients.accountantId, acct.userId),
        eq(accountantClients.companyId, companyId),
        eq(accountantClients.status, "active"),
      ),
    )
    .limit(1);
  if (activeRel) {
    return NextResponse.json({ error: "Redan kopplad.", alreadyConnected: true }, { status: 409 });
  }

  // Upsert the request row (unique on companyId + accountantId).
  const [existing] = await db
    .select({ id: accountantConnectionRequests.id, status: accountantConnectionRequests.status })
    .from(accountantConnectionRequests)
    .where(
      and(
        eq(accountantConnectionRequests.companyId, companyId),
        eq(accountantConnectionRequests.accountantId, acct.userId),
      ),
    )
    .limit(1);

  if (existing) {
    if (existing.status === "pending") {
      return NextResponse.json({ ok: true, alreadyPending: true }, { status: 200 });
    }
    await db
      .update(accountantConnectionRequests)
      .set({ status: "pending", requestedBy: acct.userId, createdAt: new Date(), respondedAt: null })
      .where(eq(accountantConnectionRequests.id, existing.id));
  } else {
    await db.insert(accountantConnectionRequests).values({
      companyId,
      accountantId: acct.userId,
      requestedBy: acct.userId, // accountant-initiated
      status: "pending",
    });
  }

  await logAudit({
    userId: acct.userId,
    action: "accountant.company_request.create",
    details: `accountant ${acct.userId} → company ${companyId}`,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
