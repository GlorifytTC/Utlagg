import { NextResponse, type NextRequest } from "next/server";
import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { accountantClients, chatMessages, chatReports, companyMembers, users } from "@/db/schema";

export const runtime = "nodejs";

// Channel between two users: one is the accountant, the other a member of the company.
async function findChannel(a: string, b: string) {
  const companiesOf = (userId: string) =>
    db.select({ id: companyMembers.companyId }).from(companyMembers).where(eq(companyMembers.userId, userId));

  // ponytail: picks the newest channel if the pair shares several; list them all if that ever matters.
  const [rel] = await db
    .select({ id: accountantClients.id })
    .from(accountantClients)
    .where(
      or(
        and(eq(accountantClients.accountantId, a), inArray(accountantClients.companyId, companiesOf(b))),
        and(eq(accountantClients.accountantId, b), inArray(accountantClients.companyId, companiesOf(a))),
      ),
    )
    .orderBy(desc(accountantClients.createdAt))
    .limit(1);
  return rel?.id ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const reporter = alias(users, "reporter");
  const reported = alias(users, "reported");

  const [report] = await db
    .select({
      id: chatReports.id,
      reason: chatReports.reason,
      status: chatReports.status,
      messageId: chatReports.messageId,
      moderatorNote: chatReports.moderatorNote,
      moderatedAt: chatReports.moderatedAt,
      createdAt: chatReports.createdAt,
      reporterId: chatReports.reporterId,
      reporterEmail: reporter.email,
      reporterName: reporter.name,
      reportedUserId: chatReports.reportedUserId,
      reportedEmail: reported.email,
      reportedName: reported.name,
      clientId: chatMessages.clientId,
    })
    .from(chatReports)
    .innerJoin(reporter, eq(reporter.id, chatReports.reporterId))
    .innerJoin(reported, eq(reported.id, chatReports.reportedUserId))
    .leftJoin(chatMessages, eq(chatMessages.id, chatReports.messageId))
    .where(eq(chatReports.id, params.id))
    .limit(1);

  if (!report) return NextResponse.json({ error: "Rapporten hittades inte" }, { status: 404 });

  const clientId = report.clientId ?? (await findChannel(report.reporterId, report.reportedUserId));

  const messages = clientId
    ? await db
        .select({
          id: chatMessages.id,
          senderId: chatMessages.senderId,
          body: chatMessages.body,
          createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(eq(chatMessages.clientId, clientId))
        .orderBy(asc(chatMessages.createdAt))
    : [];

  return NextResponse.json({ report, messages });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const { status, moderatorNote } = await req.json();
  if (status !== "resolved" && status !== "dismissed") {
    return NextResponse.json({ error: "Ogiltigt status" }, { status: 400 });
  }

  await db
    .update(chatReports)
    .set({
      status,
      moderatorId: admin.user.id,
      moderatorNote: moderatorNote ?? null,
      moderatedAt: new Date(),
    })
    .where(eq(chatReports.id, params.id));

  return NextResponse.json({ ok: true });
}
