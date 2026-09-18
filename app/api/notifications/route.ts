import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { and, eq, gt, inArray, ne, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { accountantConnectionRequests, accountantClients, chatMessages, companies, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";

export const runtime = "nodejs";

/**
 * GET /api/notifications?since=<ISO> — social events for the caller newer than
 * `since`, so the client can toast them live without a page reload. First poll
 * omits `since` (defaults to now) so no backlog is toasted. The client passes
 * the returned `now` back as the next `since`; unread is tracked client-side,
 * so there is no read-state column. Returns safe fields only (type, actor
 * display name, timestamp, deep link).
 *
 * ponytail: 25s poll per active user; move to SSE on the Railway-only path if
 * sub-second latency is ever required. Queries hit existing indexes
 * (accountant_clients_acct_idx, accountant_conn_req_*_idx, chat_messages_client_idx).
 */
type Notif = { type: "connection_request" | "accepted" | "message"; actorName: string; at: Date; href: string };

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const me = session.user.id;

  const now = new Date();
  const raw = req.nextUrl.searchParams.get("since");
  const parsed = raw ? new Date(raw) : now;
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "Ogiltig since" }, { status: 400 });
  }
  // Never look into the future (clock skew / tampering) — clamp to now.
  const cutoff = parsed > now ? now : parsed;

  // isAccountant is read fresh from the DB (never cached in the JWT — see schema).
  const [u] = await db.select({ isAccountant: users.isAccountant }).from(users).where(eq(users.id, me)).limit(1);
  const membership = await getUserCompany(me);
  const isAccountant = !!u?.isAccountant;

  const events: Notif[] = [];

  if (isAccountant) {
    // A company sent me a connection request.
    const reqs = await db
      .select({ at: accountantConnectionRequests.createdAt, actorName: companies.name })
      .from(accountantConnectionRequests)
      .innerJoin(companies, eq(companies.id, accountantConnectionRequests.companyId))
      .where(
        and(
          eq(accountantConnectionRequests.accountantId, me),
          eq(accountantConnectionRequests.status, "pending"),
          gt(accountantConnectionRequests.createdAt, cutoff),
        ),
      );
    for (const r of reqs) events.push({ type: "connection_request", actorName: r.actorName, at: r.at, href: "/accountant/requests" });

    // A company accepted the request I sent them (relationship went active).
    const accepted = await db
      .select({ at: accountantClients.activatedAt, actorName: companies.name })
      .from(accountantClients)
      .innerJoin(companies, eq(companies.id, accountantClients.companyId))
      .where(and(eq(accountantClients.accountantId, me), eq(accountantClients.status, "active"), gt(accountantClients.activatedAt, cutoff)));
    for (const a of accepted) if (a.at) events.push({ type: "accepted", actorName: a.actorName, at: a.at, href: "/accountant" });
  }

  if (membership) {
    // An accountant accepted the request my company sent them.
    const accepted = await db
      .select({ at: accountantConnectionRequests.respondedAt, actorName: users.name })
      .from(accountantConnectionRequests)
      .innerJoin(users, eq(users.id, accountantConnectionRequests.accountantId))
      .where(
        and(
          eq(accountantConnectionRequests.companyId, membership.companyId),
          eq(accountantConnectionRequests.status, "active"),
          gt(accountantConnectionRequests.respondedAt, cutoff),
        ),
      );
    for (const a of accepted) if (a.at) events.push({ type: "accepted", actorName: a.actorName ?? "", at: a.at, href: "/dashboard/company" });
  }

  // Chat messages sent to me (either role), across every relationship I'm party to.
  const relConds: SQL[] = [];
  if (isAccountant) relConds.push(eq(accountantClients.accountantId, me));
  if (membership) relConds.push(eq(accountantClients.companyId, membership.companyId));
  if (relConds.length) {
    const rels = await db.select({ id: accountantClients.id }).from(accountantClients).where(or(...relConds));
    const clientIds = rels.map((r: { id: string }) => r.id);
    if (clientIds.length) {
      const msgs = await db
        .select({ at: chatMessages.createdAt, actorName: users.name })
        .from(chatMessages)
        .innerJoin(users, eq(users.id, chatMessages.senderId))
        .where(and(inArray(chatMessages.clientId, clientIds), ne(chatMessages.senderId, me), gt(chatMessages.createdAt, cutoff)));
      const msgHref = isAccountant ? "/accountant" : "/dashboard/company";
      for (const m of msgs) events.push({ type: "message", actorName: m.actorName ?? "", at: m.at, href: msgHref });
    }
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return NextResponse.json({ events: events.slice(-20), now: now.toISOString() });
}
