import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { receipts, companies } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";
import { buildSie } from "@/lib/sie-export";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/** GET /api/export/sie?from=YYYY-MM-DD&to=YYYY-MM-DD — SIE 4 for the user's receipts. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const conds = [eq(receipts.userId, session.user.id)];
  if (from && !Number.isNaN(Date.parse(from))) conds.push(gte(receipts.date, new Date(from)));
  if (to && !Number.isNaN(Date.parse(to))) {
    const end = new Date(to); end.setHours(23, 59, 59, 999);
    conds.push(lte(receipts.date, end));
  }

  const rows = await db.select().from(receipts).where(and(...conds)).orderBy(desc(receipts.date));

  // Company name for the #FNAMN header, if any.
  let companyName = session.user.name ?? "Kvittino";
  let orgNumber: string | null = null;
  const membership = await getUserCompany(session.user.id);
  if (membership) {
    const [c] = await db.select().from(companies).where(eq(companies.id, membership.companyId)).limit(1);
    if (c) { companyName = c.name; orgNumber = c.orgNumber ?? null; }
  }

  const fromYear = from ? new Date(from).getFullYear() : new Date().getFullYear();
  const sie = buildSie({ companyName, orgNumber, receipts: rows, fromYear });

  await logAudit({
    userId: session.user.id,
    action: "receipt.export.sie",
    details: `${rows.length} verifikationer`,
    ipAddress: clientIp(req),
  });

  return new NextResponse(sie, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="kvittino-${fromYear}.se"`,
    },
  });
}
