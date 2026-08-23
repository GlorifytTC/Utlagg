import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, asc, eq, gte, lte, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { receipts, companies } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { getUserCompany } from "@/lib/company";
import { buildSie, SieBalanceError } from "@/lib/sie-export";
import { logAudit, clientIp } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { assertExportAllowed } from "@/lib/billing/export-gating";

export const runtime = "nodejs";

/**
 * GET /api/export/sie[?from=YYYY-MM-DD&to=YYYY-MM-DD][&credit=1930]
 *
 * SIE 4 export of the signed-in user's RECEIPTS (never invoices — those have a
 * separate export path). With `from`/`to` the range is inclusive; omitting the
 * range exports ALL receipts regardless of date. `credit` overrides the
 * payment/credit account (default 1930 — company bank; use 2440 for
 * on-account/unpaid). A missing or malformed organisationsnummer is logged as a
 * warning but does not block the export.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  // Export gating (spec §C): SIE4 is a premium format — blocked in read-only /
  // lapsed state, where CSV + original files remain available instead.
  const gate = await assertExportAllowed(session.user.id, "sie4");
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.message, code: gate.reason, fallback: gate.fallback },
      { status: 403 },
    );
  }

  const sp = req.nextUrl.searchParams;
  const fromStr = sp.get("from");
  const toStr = sp.get("to");
  const allTime = sp.get("all_time") === "1" || (!fromStr && !toStr);

  let from: Date | null = null;
  let to: Date | null = null;
  if (!allTime) {
    if (fromStr) {
      if (Number.isNaN(Date.parse(fromStr))) {
        return NextResponse.json({ error: "Ogiltigt startdatum (YYYY-MM-DD)." }, { status: 400 });
      }
      from = new Date(fromStr);
    }
    if (toStr) {
      if (Number.isNaN(Date.parse(toStr))) {
        return NextResponse.json({ error: "Ogiltigt slutdatum (YYYY-MM-DD)." }, { status: 400 });
      }
      to = new Date(toStr);
      to.setHours(23, 59, 59, 999); // include the whole end day
    }
    if (from && to && from > to) {
      return NextResponse.json({ error: "Startdatum är efter slutdatum." }, { status: 400 });
    }
  }

  // Receipts only — this endpoint must never touch customer_invoices.
  const conds: SQL[] = [eq(receipts.userId, session.user.id)];
  if (from) conds.push(gte(receipts.date, from));
  if (to) conds.push(lte(receipts.date, to));

  const rows = await db
    .select()
    .from(receipts)
    .where(and(...conds))
    .orderBy(asc(receipts.date));

  // Company metadata for #FNAMN/#ORGNR. Solo users fall back to their own name;
  // the generator warns (rather than fails) on missing/malformed orgnr.
  let companyName = session.user.name ?? "Kvittino";
  let orgNumber: string | null = null;
  const membership = await getUserCompany(session.user.id);
  if (membership) {
    const [c] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, membership.companyId))
      .limit(1);
    if (c) {
      companyName = c.name;
      orgNumber = c.orgNumber ?? null;
    }
  }

  const creditAccount = sp.get("credit")?.trim() || undefined;

  let result;
  try {
    result = buildSie({
      company: { name: companyName, orgNumber },
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
    details: `${rows.length} verifikationer${allTime ? ", all time" : ""}${creditAccount ? `, kredit ${creditAccount}` : ""}`,
    ipAddress: clientIp(req),
  });

  const rangeLabel = allTime ? "all" : `${fromStr ?? "start"}_${toStr ?? "nu"}`;
  const filename = `kvittino-${rangeLabel}.se`;
  // Return the raw CP437 bytes. Passing a typed array (not a string) prevents
  // Next/undici from re-encoding the body to UTF-8.
  return new NextResponse(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(result.bytes.length),
    },
  });
}
