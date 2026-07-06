import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { receipts, companies } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";
import { buildSie, SieBalanceError } from "@/lib/sie-export";
import { logAudit, clientIp } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/export/sie?from=YYYY-MM-DD&to=YYYY-MM-DD[&credit=1930]
 *
 * SIE 4 export of the signed-in user's receipts in the given (inclusive) date
 * range. `credit` overrides the payment/credit account (default 1930 — company
 * bank). A valid file requires the owning company's organisationsnummer.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const fromStr = sp.get("from");
  const toStr = sp.get("to");

  if (!fromStr || Number.isNaN(Date.parse(fromStr)) || !toStr || Number.isNaN(Date.parse(toStr))) {
    return NextResponse.json({ error: "Ogiltigt datumintervall (from/to krävs, YYYY-MM-DD)." }, { status: 400 });
  }
  const from = new Date(fromStr);
  const to = new Date(toStr);
  to.setHours(23, 59, 59, 999); // include the whole end day
  if (from > to) {
    return NextResponse.json({ error: "Startdatum är efter slutdatum." }, { status: 400 });
  }

  // A valid SIE file needs the company's organisationsnummer. Solo users with no
  // company (or a company missing its orgnr) cannot produce a valid export.
  const membership = await getUserCompany(session.user.id);
  if (!membership) {
    return NextResponse.json(
      { error: "SIE-export kräver ett företag med organisationsnummer." },
      { status: 422 },
    );
  }
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, membership.companyId))
    .limit(1);
  if (!company?.orgNumber) {
    return NextResponse.json(
      { error: "Företaget saknar organisationsnummer — fyll i det innan export." },
      { status: 422 },
    );
  }

  const rows = await db
    .select()
    .from(receipts)
    .where(and(eq(receipts.userId, session.user.id), gte(receipts.date, from), lte(receipts.date, to)))
    .orderBy(desc(receipts.date));

  const creditAccount = sp.get("credit")?.trim() || undefined;

  let result;
  try {
    result = buildSie({
      company: { name: company.name, orgNumber: company.orgNumber },
      receipts: rows,
      from,
      to,
      creditAccount,
    });
  } catch (err) {
    if (err instanceof SieBalanceError) {
      logger.error({ receiptId: err.receiptId, sum: err.sum }, "SIE balance error");
      return NextResponse.json(
        { error: "En verifikation balanserar inte.", receiptId: err.receiptId },
        { status: 422 },
      );
    }
    logger.error({ error: err instanceof Error ? err.message : String(err) }, "SIE export failed");
    return NextResponse.json({ error: "Kunde inte skapa SIE-filen." }, { status: 500 });
  }

  if (result.warnings.length > 0) {
    logger.warn({ warnings: result.warnings, userId: session.user.id }, "SIE export warnings");
  }

  await logAudit({
    userId: session.user.id,
    action: "receipt.export.sie",
    details: `${rows.length} verifikationer${creditAccount ? `, kredit ${creditAccount}` : ""}`,
    ipAddress: clientIp(req),
  });

  const filename = `kvittino-${fromStr}_${toStr}.se`;
  // Return the raw CP437 bytes. Passing a Buffer (not a string) prevents Next/
  // undici from re-encoding the body to UTF-8.
  return new NextResponse(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(result.bytes.length),
    },
  });
}
