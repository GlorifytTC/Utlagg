import { NextResponse } from "next/server";
import { and, desc, eq, inArray, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { accountantClients, chatMessages, companies, companyMembers, users } from "@/db/schema";

export const runtime = "nodejs";

/**
 * GET /api/chat — the caller's conversations for the inbox list, newest
 * activity first, each with the last message as a preview.
 *
 * Mirrors resolveAccess in ./[clientId]/route.ts: an active relationship is
 * visible to its accountant (role "accountant") and to any member of its
 * company (role "company"). Only display fields are returned.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  const me = session.user.id;

  const memberships = await db
    .select({ companyId: companyMembers.companyId })
    .from(companyMembers)
    .where(eq(companyMembers.userId, me));
  const myCompanyIds = memberships.map((m: { companyId: string }) => m.companyId);

  const relConds: SQL[] = [eq(accountantClients.accountantId, me)];
  if (myCompanyIds.length) relConds.push(inArray(accountantClients.companyId, myCompanyIds));

  const accountant = alias(users, "accountant");
  const rels = await db
    .select({
      clientId: accountantClients.id,
      companyId: accountantClients.companyId,
      accountantId: accountantClients.accountantId,
      activatedAt: accountantClients.activatedAt,
      companyName: companies.name,
      companyLogo: companies.logoUrl,
      accountantName: accountant.name,
      accountantEmail: accountant.email,
      accountantLogo: accountant.logoUrl,
    })
    .from(accountantClients)
    .innerJoin(companies, eq(companies.id, accountantClients.companyId))
    .innerJoin(accountant, eq(accountant.id, accountantClients.accountantId))
    .where(and(eq(accountantClients.status, "active"), or(...relConds)));

  if (rels.length === 0) return NextResponse.json({ conversations: [] });

  // One row per relationship: its newest message (uses chat_messages_client_idx).
  const last = await db
    .selectDistinctOn([chatMessages.clientId], {
      clientId: chatMessages.clientId,
      senderId: chatMessages.senderId,
      body: chatMessages.body,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(inArray(chatMessages.clientId, rels.map((r: { clientId: string }) => r.clientId)))
    .orderBy(chatMessages.clientId, desc(chatMessages.createdAt));
  type Last = { clientId: string; senderId: string; body: string; createdAt: Date };
  const lastById = new Map<string, Last>(last.map((m: Last) => [m.clientId, m]));

  const conversations = rels.map((r: (typeof rels)[number]) => {
    // A user can be both the accountant and a company member of the same
    // relationship; the accountant side wins, matching resolveAccess.
    const role = r.accountantId === me ? ("accountant" as const) : ("company" as const);
    const m = lastById.get(r.clientId);
    return {
      clientId: r.clientId,
      companyId: r.companyId,
      role,
      name: role === "accountant" ? r.companyName : r.accountantName ?? r.accountantEmail,
      logoUrl: role === "accountant" ? r.companyLogo : r.accountantLogo,
      lastMessage: m ? { body: m.body, createdAt: m.createdAt, mine: m.senderId === me } : null,
      activityAt: m?.createdAt ?? r.activatedAt,
    };
  });
  conversations.sort(
    (a: { activityAt: Date | null }, b: { activityAt: Date | null }) =>
      (b.activityAt?.getTime() ?? 0) - (a.activityAt?.getTime() ?? 0),
  );

  return NextResponse.json({ conversations });
}
