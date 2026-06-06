import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const tier = sp.get("tier")?.trim();
  const format = sp.get("format");
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const pageSize = 50;

  const conds = [];
  if (q) conds.push(ilike(users.email, `%${q}%`));
  if (tier && tier !== "all") conds.push(eq(users.subscriptionTier, tier as never));
  const where = conds.length ? and(...conds) : undefined;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      tier: users.subscriptionTier,
      status: users.subscriptionStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(format === "csv" ? 10000 : pageSize)
    .offset(format === "csv" ? 0 : (page - 1) * pageSize);

  if (format === "csv") {
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Email", "Namn", "Plan", "Status", "Skapad"];
    const lines = rows.map((r: Record<string, unknown>) =>
      [r.email, r.name, r.tier, r.status, (r.createdAt as Date)?.toISOString()]
        .map(esc)
        .join(";"),
    );
    const csv = "\uFEFF" + [header.join(";"), ...lines].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="users.csv"',
      },
    });
  }

  const [{ total }] = (await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(where)) as { total: number }[];

  return NextResponse.json({ users: rows, total: Number(total), page, pageSize });
}
