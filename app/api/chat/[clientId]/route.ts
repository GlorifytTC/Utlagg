import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  accountantClients,
  chatMessages,
  companyMembers,
  users,
} from "@/db/schema";
import { sendChatMessageNotification } from "@/lib/email";

export const runtime = "nodejs";

/** Returns the relationship row and whether the caller is 'accountant' or 'company'. */
async function resolveAccess(clientId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [rel] = await db
    .select({
      id: accountantClients.id,
      accountantId: accountantClients.accountantId,
      companyId: accountantClients.companyId,
      status: accountantClients.status,
    })
    .from(accountantClients)
    .where(eq(accountantClients.id, clientId))
    .limit(1);

  if (!rel || rel.status !== "active") return null;

  if (rel.accountantId === userId) return { rel, role: "accountant" as const, userId };

  const [member] = await db
    .select({ id: companyMembers.id })
    .from(companyMembers)
    .where(
      and(
        eq(companyMembers.companyId, rel.companyId),
        eq(companyMembers.userId, userId),
      ),
    )
    .limit(1);

  if (member) return { rel, role: "company" as const, userId };
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  const access = await resolveAccess(params.clientId);
  if (!access) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const messages = await db
    .select({
      id: chatMessages.id,
      senderId: chatMessages.senderId,
      senderRole: chatMessages.senderRole,
      body: chatMessages.body,
      createdAt: chatMessages.createdAt,
      senderName: users.name,
    })
    .from(chatMessages)
    .innerJoin(users, eq(users.id, chatMessages.senderId))
    .where(eq(chatMessages.clientId, params.clientId))
    .orderBy(asc(chatMessages.createdAt))
    .limit(200);

  return NextResponse.json({ messages, role: access.role });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  const access = await resolveAccess(params.clientId);
  if (!access) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const { body } = await req.json();
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Tomt meddelande" }, { status: 400 });
  }
  const trimmed = body.trim().slice(0, 2000);

  const [msg] = await db
    .insert(chatMessages)
    .values({
      clientId: params.clientId,
      senderId: access.userId,
      senderRole: access.role,
      body: trimmed,
    })
    .returning();

  // Notify the other party via email (fire-and-forget).
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const [sender] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, access.userId))
    .limit(1);

  if (access.role === "accountant") {
    // Notify company members (owners + admins) — just grab the first owner/admin.
    const [recipient] = await db
      .select({ email: users.email })
      .from(companyMembers)
      .innerJoin(users, eq(users.id, companyMembers.userId))
      .where(
        and(
          eq(companyMembers.companyId, access.rel.companyId),
          eq(companyMembers.role, "owner"),
        ),
      )
      .limit(1);
    if (recipient?.email) {
      sendChatMessageNotification(recipient.email, {
        senderName: sender?.name ?? "Revisor",
        preview: trimmed,
        chatUrl: `${appUrl}/dashboard/company#accountants`,
      }).catch(() => {/* fire-and-forget */});
    }
  } else {
    // Notify the accountant.
    const [recipient] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, access.rel.accountantId))
      .limit(1);
    if (recipient?.email) {
      sendChatMessageNotification(recipient.email, {
        senderName: sender?.name ?? "Klient",
        preview: trimmed,
        chatUrl: `${appUrl}/accountant/clients/${access.rel.companyId}`,
      }).catch(() => {/* fire-and-forget */});
    }
  }

  return NextResponse.json({ message: msg });
}
