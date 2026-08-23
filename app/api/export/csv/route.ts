import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { assertExportAllowed } from "@/lib/billing/export-gating";

export const runtime = "nodejs";

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  // Escape quotes and wrap if the cell contains a delimiter/newline.
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  // Routed through the single export gate for consistency. CSV is in
  // ALWAYS_AVAILABLE_EXPORTS, so this ALWAYS resolves to allowed — even in
  // read-only state — which is the legal guardrail (spec §C). Never gate CSV.
  await assertExportAllowed(session.user.id, "csv");

  // Optional date range: ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive).
  const sp = req.nextUrl.searchParams;
  const fromStr = sp.get("from");
  const toStr = sp.get("to");
  const from = fromStr && !Number.isNaN(Date.parse(fromStr)) ? new Date(fromStr) : null;
  const to = toStr && !Number.isNaN(Date.parse(toStr)) ? new Date(toStr) : null;
  if (to) to.setHours(23, 59, 59, 999); // include the whole end day

  const conditions = [eq(receipts.userId, session.user.id)];
  if (from) conditions.push(gte(receipts.date, from));
  if (to) conditions.push(lte(receipts.date, to));

  const rows = await db
    .select()
    .from(receipts)
    .where(and(...conditions))
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

  // Use semicolon — the delimiter Excel expects in Swedish locale.
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

  // Prepend BOM so Excel reads UTF-8 (å ä ö) correctly.
  const csv = "\uFEFF" + lines.join("\r\n");

  await logAudit({
    userId: session.user.id,
    action: "export.csv",
    details: `Exported ${rows.length} receipts${from || to ? ` (${fromStr ?? "…"}–${toStr ?? "…"})` : ""}`,
  });

  const rangeSuffix = from || to ? `-${fromStr ?? "start"}_${toStr ?? "nu"}` : "";
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kvitton${rangeSuffix || "-" + new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
