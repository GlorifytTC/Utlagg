import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { accountantClients, chatMessages, chatReports, companyMembers } from "@/db/schema";

export const runtime = "nodejs";

async function resolveAccess(clientId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const [rel] = await db
    .select({ id: accountantClients.id, accountantId: accountantClients.accountantId, companyId: accountantClients.companyId, status: accountantClients.status })
    .from(accountantClients)
    .where(eq(accountantClients.id, clientId))
    .limit(1);

  if (!rel || rel.status !== "active") return null;
  if (rel.accountantId === userId) return { rel, userId };

  const [member] = await db
    .select({ id: companyMembers.id })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, rel.companyId), eq(companyMembers.userId, userId)))
    .limit(1);

  return member ? { rel, userId } : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { clientId: string } },
) {
  const access = await resolveAccess(params.clientId);
  if (!access) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const { reportedUserId, messageId, reason } = await req.json();

  if (!reportedUserId || !reason?.trim()) {
    return NextResponse.json({ error: "Saknar reportedUserId eller reason" }, { status: 400 });
  }

  // If a messageId is provided, verify it belongs to this channel.
  if (messageId) {
    const [msg] = await db
      .select({ id: chatMessages.id })
      .from(chatMessages)
      .where(and(eq(chatMessages.id, messageId), eq(chatMessages.clientId, params.clientId)))
      .limit(1);
    if (!msg) return NextResponse.json({ error: "Meddelandet hittades inte" }, { status: 404 });
  }

  const [report] = await db
    .insert(chatReports)
    .values({
      reporterId: access.userId,
      reportedUserId,
      messageId: messageId ?? null,
      reason: reason.trim().slice(0, 1000),
    })
    .returning({ id: chatReports.id });

  return NextResponse.json({ reportId: report.id });
}
