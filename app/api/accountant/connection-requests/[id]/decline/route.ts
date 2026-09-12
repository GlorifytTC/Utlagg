import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { accountantConnectionRequests } from "@/db/schema";
import { requireAccountant } from "@/lib/accountant";
import { logAuditEvent, clientIp } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST — the accountant DECLINES a pending connection request.
 *
 * requireAccountant() → load by id AND accountantId (another accountant's
 * request → 404). Only pending can be declined. Sets status to the terminal
 * "revoked" (the enum's terminal state) and stamps respondedAt. Creates NO
 * accountantClients relationship and grants NO access.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const limited = await enforceRateLimit(req, "accountant-conn-req-decline");
  if (limited) return limited;

  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const [reqRow] = await db
    .select({ id: accountantConnectionRequests.id, status: accountantConnectionRequests.status })
    .from(accountantConnectionRequests)
    .where(
      and(
        eq(accountantConnectionRequests.id, params.id),
        eq(accountantConnectionRequests.accountantId, acct.userId),
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

  await logAuditEvent({
    userId: acct.userId,
    action: "accountant.connection_request.decline",
    entityType: "accountant_connection_request",
    entityId: reqRow.id,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
