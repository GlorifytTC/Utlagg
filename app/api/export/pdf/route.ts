import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/db";
import { receipts } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

/** WinAnsi (Helvetica) can't encode every Unicode char; keep it safe. */
function safe(text: string): string {
  return text
    .replace(/[\u202F\u00A0\u2009]/g, " ") // narrow/no-break spaces -> space
    .replace(/[^\u0000-\u00FF]/g, "?"); // drop anything outside Latin-1
}

function kr(amount: string | number | null): string {
  if (amount == null) return "-";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "-";
  return n.toFixed(2).replace(".", ",") + " kr";
}

/** Optional ?from=&to= (YYYY-MM-DD, inclusive) to match the other exports. */
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
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conds.push(lte(receipts.date, end));
  }

  const rows = await db
    .select()
    .from(receipts)
    .where(and(...conds))
    .orderBy(desc(receipts.date));

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.09, 0.1, 0.11);
  const muted = rgb(0.4, 0.42, 0.45);

  if (rows.length === 0) {
    const page = pdf.addPage([595, 842]); // A4
    page.drawText(safe("Inga kvitton att exportera."), {
      x: 50,
      y: 780,
      size: 14,
      font,
      color: ink,
    });
  }

  for (const r of rows) {
    const page = pdf.addPage([595, 842]); // A4 portrait
    const { height } = page.getSize();
    let y = height - 60;

    page.drawText(safe("Kvitto"), { x: 50, y, size: 22, font: bold, color: ink });
    y -= 10;
    page.drawText(safe(`ID: ${r.id}`), {
      x: 50,
      y: y - 6,
      size: 8,
      font,
      color: muted,
    });
    y -= 40;

    const field = (label: string, value: string) => {
      page.drawText(safe(label), { x: 50, y, size: 10, font: bold, color: muted });
      page.drawText(safe(value), { x: 200, y, size: 12, font, color: ink });
      y -= 26;
    };

    field("Leverantör", r.vendorName ?? "-");
    field("Datum", r.date ? new Date(r.date).toISOString().slice(0, 10) : "-");
    field("Belopp (inkl. moms)", kr(r.totalAmount));
    field("Moms", kr(r.vatAmount));
    field("Momssats", r.vatRate != null ? `${r.vatRate} %` : "-");
    field("BAS-konto", r.basCode ?? "-");
    field("Kategori", r.category ?? "-");
    field("Status", r.status);

    page.drawText(
      safe("Genererad av Kvitto för bokföring enligt Bokföringslagen."),
      { x: 50, y: 50, size: 8, font, color: muted },
    );
  }

  const bytes = await pdf.save();

  await logAudit({
    userId: session.user.id,
    action: "receipt.export.pdf",
    details: `Exported ${rows.length} receipts to PDF`,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kvitton.pdf"`,
    },
  });
}
