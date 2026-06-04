import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq, lte, gte } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET /api/audit?from=ISO&to=ISO&format=json|csv
 * Returns the authenticated user's audit trail. Admins see their own account's
 * events. (For multi-seat companies, scope by company_id once that exists.)
 *
 * These rows are append-only and retained 7 years (Bokföringslagen).
 * This endpoint is read/export only — it never mutates or deletes.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const [me] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  
  if (me?.role !== "admin") {
    return NextResponse.json({ error: "Endast administratör" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const format = sp.get("format") ?? "json";

  const filters = [eq(auditLogs.userId, session.user.id)];
  if (from && !Number.isNaN(Date.parse(from))) {
    filters.push(gte(auditLogs.createdAt, new Date(from)));
  }
  if (to && !Number.isNaN(Date.parse(to))) {
    filters.push(lte(auditLogs.createdAt, new Date(to)));
  }

  const rows = await db
    .select()
    .from(auditLogs)
    .where(and(...filters))
    .orderBy(desc(auditLogs.createdAt))
    .limit(10000);

  if (format === "csv") {
    const header = [
      "Tidpunkt",
      "Åtgärd",
      "Objekttyp",
      "Objekt-ID",
      "IP",
      "Detaljer",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // FIXED: Added explicit type for 'row'
    const lines = rows.map((row: typeof auditLogs.$inferSelect) =>
      [
        row.createdAt?.toISOString() ?? "",
        row.action,
        row.entityType ?? "",
        row.entityId ?? "",
        row.ipAddress ?? "",
        row.details ?? "",
      ]
        .map(esc)
        .join(";"),
    );
    const csv = "\uFEFF" + [header.join(";"), ...lines].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ logs: rows });
}