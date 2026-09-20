import { NextResponse, type NextRequest } from "next/server";
import { and, asc, desc, gte, inArray, lte, type SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { receipts, companies, accountantExports } from "@/db/schema";
import { requireAccountant, requireCompanyAccess } from "@/lib/accountant";
import { buildSie, SieBalanceError } from "@/lib/sie-export";
import { logAuditEvent, clientIp } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const bodySchema = z.object({
  format: z.enum(["csv", "sie"]).default("csv"),
  from: z.string().optional(),
  to: z.string().optional(),
  creditAccount: z.string().max(10).optional(),
});

// Same CSV cell escaping as /api/export/csv (semicolon-delimited, Excel-sv).
function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * POST — accountant exports a client's receipts (CSV or SIE) for a period.
 *
 * AUTHORIZATION (relationship-first, member-scoped, in order):
 *   1. requireAccountant()                → 403
 *   2. requireCompanyAccess(acct, [id])   → 404 if no ACTIVE relationship
 *   3. CURRENT companyMembers resolved
 *   4. receipts scoped by inArray(userId, memberIds) — NEVER receipts.companyId
 *
 * Export authorization is by RELATIONSHIP + client ownership, deliberately NOT
 * by the accountant's own subscription plan (assertExportAllowed is for the
 * data owner, not an accountant acting on a client). Pending/revoked
 * relationships get no access. Every successful export is recorded in
 * accountantExports. Reuses the existing CSV format and the buildSie() builder.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltiga uppgifter" }, { status: 400 });
  const { format } = parsed.data;

  // Parse optional inclusive date range.
  const fromStr = parsed.data.from ?? null;
  const toStr = parsed.data.to ?? null;
  let from: Date | null = null;
  let to: Date | null = null;
  if (fromStr) {
    if (Number.isNaN(Date.parse(fromStr)))
      return NextResponse.json({ error: "Ogiltigt startdatum (YYYY-MM-DD)." }, { status: 400 });
    from = new Date(fromStr);
  }
  if (toStr) {
    if (Number.isNaN(Date.parse(toStr)))
      return NextResponse.json({ error: "Ogiltigt slutdatum (YYYY-MM-DD)." }, { status: 400 });
    to = new Date(toStr);
    to.setHours(23, 59, 59, 999);
  }
  if (from && to && from > to)
    return NextResponse.json({ error: "Startdatum är efter slutdatum." }, { status: 400 });

  // No current members ⇒ nothing to export (never an unscoped query).
  if (access.memberIds.length === 0) {
    return NextResponse.json({ error: "Inga kvitton att exportera." }, { status: 404 });
  }

  // THE boundary: current members only. companyId is never used here.
  const conds: SQL[] = [inArray(receipts.userId, access.memberIds)];
  if (from) conds.push(gte(receipts.date, from));
  if (to) conds.push(lte(receipts.date, to));

  async function recordHistory(count: number) {
    await db.insert(accountantExports).values({
      accountantId: acct!.userId,
      companyId: access!.companyId,
      fromDate: fromStr ? fromStr.slice(0, 10) : null,
      toDate: toStr ? toStr.slice(0, 10) : null,
      format,
      receiptCount: count,
    });
  }

  if (format === "csv") {
    const rows = await db
      .select()
      .from(receipts)
      .where(and(...conds))
      .orderBy(desc(receipts.date));

    const header = [
      "Datum",
      "Leverantör",
      "BAS-konto",
      "Kategori",
      "Belopp (SEK)",
      "Moms (SEK)",
      "Momssats (%)",
      "Status",
      "Kvitto-ID",
    ];
    const lines = [header.join(";")];
    for (const r of rows) {
      lines.push(
        [
          r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
          r.vendorName,
          r.basCode,
          r.category,
          r.totalAmount,
          r.vatAmount,
          r.vatRate,
          r.status,
          r.id,
        ]
          .map(csvCell)
          .join(";"),
      );
    }
    const csv = "\uFEFF" + lines.join("\r\n");

    await recordHistory(rows.length);
    await logAuditEvent({
      userId: acct.userId,
      action: "accountant.export.csv",
      entityType: "company",
      entityId: access.companyId,
      targetCompanyId: access.companyId,
      details: `${rows.length} kvitton`,
      ipAddress: clientIp(req),
    });

    const rangeSuffix = fromStr || toStr ? `-${fromStr ?? "start"}_${toStr ?? "nu"}` : `-${new Date().toISOString().slice(0, 10)}`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kvitton${rangeSuffix}.csv"`,
      },
    });
  }

  // SIE — reuse the existing buildSie() builder with the CLIENT company's meta.
  const rows = await db
    .select()
    .from(receipts)
    .where(and(...conds))
    .orderBy(asc(receipts.date));

  let companyName = access.companyName;
  let orgNumber: string | null = null;
  const [client] = await db
    .select({ name: companies.name, orgNumber: companies.orgNumber })
    .from(companies)
    .where(eq(companies.id, access.companyId))
    .limit(1);
  if (client) {
    companyName = client.name;
    orgNumber = client.orgNumber ?? null;
  }

  let result;
  try {
    result = buildSie({
      company: { name: companyName, orgNumber },
      receipts: rows,
      from,
      to,
      creditAccount: parsed.data.creditAccount?.trim() || undefined,
    });
  } catch (err) {
    if (err instanceof SieBalanceError) {
      logger.error({ receiptId: err.receiptId, sum: err.sum }, "SIE balance error (accountant)");
      return NextResponse.json(
        { error: "En verifikation balanserar inte.", receiptId: err.receiptId },
        { status: 422 },
      );
    }
    logger.error({ error: err instanceof Error ? err.message : String(err) }, "accountant SIE export failed");
    return NextResponse.json({ error: "Kunde inte skapa SIE-filen." }, { status: 500 });
  }

  await recordHistory(rows.length);
  await logAuditEvent({
    userId: acct.userId,
    action: "accountant.export.sie",
    entityType: "company",
    entityId: access.companyId,
    targetCompanyId: access.companyId,
    details: `${rows.length} verifikationer`,
    ipAddress: clientIp(req),
  });

  const rangeLabel = fromStr || toStr ? `${fromStr ?? "start"}_${toStr ?? "nu"}` : "all";
  return new NextResponse(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="kvittino-${rangeLabel}.se"`,
      "Content-Length": String(result.bytes.length),
    },
  });
}

/**
 * GET — export history for this client. Same relationship-first authorization;
 * paginated like the other accountant list endpoints.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const acct = await requireAccountant();
  if (!acct) return NextResponse.json({ error: "Saknar behörighet" }, { status: 403 });

  const access = await requireCompanyAccess(acct.userId, params.id);
  if (!access) return NextResponse.json({ error: "Hittades inte" }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 25));

  const rows = await db
    .select({
      id: accountantExports.id,
      fromDate: accountantExports.fromDate,
      toDate: accountantExports.toDate,
      format: accountantExports.format,
      receiptCount: accountantExports.receiptCount,
      createdAt: accountantExports.createdAt,
    })
    .from(accountantExports)
    .where(
      and(
        eq(accountantExports.accountantId, acct.userId),
        eq(accountantExports.companyId, access.companyId),
      ),
    )
    .orderBy(desc(accountantExports.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return NextResponse.json({ exports: rows, page, pageSize });
}
