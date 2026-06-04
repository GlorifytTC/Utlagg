import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  // Escape quotes and wrap if the cell contains a delimiter/newline.
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(receipts)
    .where(eq(receipts.userId, session.user.id))
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
    details: `Exported ${rows.length} receipts`,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kvitton-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
