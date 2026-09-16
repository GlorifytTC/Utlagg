import { NextResponse, type NextRequest } from "next/server";
import { alias } from "drizzle-orm/pg-core";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { chatReports, users } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const status = (req.nextUrl.searchParams.get("status") ?? "pending") as
    | "pending"
    | "resolved"
    | "dismissed";

  const reporter = alias(users, "reporter");
  const reported = alias(users, "reported");

  const rows = await db
    .select({
      id: chatReports.id,
      reason: chatReports.reason,
      status: chatReports.status,
      messageId: chatReports.messageId,
      moderatorNote: chatReports.moderatorNote,
      moderatedAt: chatReports.moderatedAt,
      createdAt: chatReports.createdAt,
      reporterEmail: reporter.email,
      reporterName: reporter.name,
      reportedEmail: reported.email,
      reportedName: reported.name,
    })
    .from(chatReports)
    .innerJoin(reporter, eq(reporter.id, chatReports.reporterId))
    .innerJoin(reported, eq(reported.id, chatReports.reportedUserId))
    .where(eq(chatReports.status, status))
    .orderBy(desc(chatReports.createdAt))
    .limit(200);

  return NextResponse.json({ reports: rows });
}
