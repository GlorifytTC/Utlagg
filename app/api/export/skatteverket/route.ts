import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";

/** Swedish number format: comma decimal, two places. */
function sv(n: unknown): string {
  if (n == null) return "";
  const num = typeof n === "string" ? Number(n) : (n as number);
  if (Number.isNaN(num)) return "";
  return num.toFixed(2).replace(".", ",");
}

function esc(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/export/skatteverket?from=YYYY-MM-DD&to=YYYY-MM-DD
 * The signed-in user's own receipts, Skatteverket-style: Swedish column names,
 * SEK comma decimals, semicolon delimiter, UTF-8 BOM (opens cleanly in svensk Excel).
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const conds = [eq(receipts.userId, session.user.id)];
  if (from && !Number.isNaN(Date.parse(from))) conds.push(gte(receipts.date, new Date(from)));
  if (to && !Number.isNaN(Date.parse(to))) {
    // include the whole "to" day
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conds.push(lte(receipts.date, end));
  }

  const rows = await db
    .select()
    .from(receipts)
    .where(and(...conds))
    .orderBy(desc(receipts.date));

  const header = [
    "Kvittodatum",
    "Leverantör",
    "Belopp (SEK)",
    "Moms (SEK)",
    "Momssats (%)",
    "BAS-konto",
    "Kategori",
    "Beskrivning",
    "Bildreferens",
  ];

  const lines = rows.map((r: Record<string, unknown>) =>
    [
      r.date ? new Date(r.date as string).toISOString().slice(0, 10) : "",
      r.vendorName ?? "",
      sv(r.totalAmount),
      sv(r.vatAmount),
      r.vatRate ?? "",
      r.basCode ?? "",
      r.category ?? "",
      // Beskrivning: trimmed first line of OCR text, or category as fallback
      (r.receiptText ? String(r.receiptText).split("\n")[0].slice(0, 120) : "") ||
        (r.category ?? ""),
      r.imageUrl ?? "", // R2 object key / image reference
    ].map(esc).join(";"),
  );

  const csv = "\uFEFF" + [header.join(";"), ...lines].join("\r\n");

  await logAudit({
    userId: session.user.id,
    action: "receipt.export.skatteverket",
    details: `${rows.length} rows${from || to ? ` (${from ?? "…"}–${to ?? "…"})` : ""}`,
    ipAddress: clientIp(req),
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="utlagg-skatteverket-${stamp}.csv"`,
    },
  });
}
