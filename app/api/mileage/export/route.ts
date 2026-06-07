import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mileageEntries } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const sv = (n: unknown) => {
  const num = typeof n === "string" ? Number(n) : (n as number);
  return Number.isNaN(num) ? "" : num.toFixed(2).replace(".", ",");
};
const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Körjournal / mileage CSV in Swedish format. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const rows = await db
    .select()
    .from(mileageEntries)
    .where(eq(mileageEntries.userId, session.user.id))
    .orderBy(desc(mileageEntries.date));

  const header = ["Datum", "Från", "Till", "Sträcka (km)", "Sats (kr/km)", "Belopp (SEK)", "Syfte", "Notering"];
  const lines = rows.map((r: Record<string, unknown>) =>
    [
      r.date ? new Date(r.date as string).toISOString().slice(0, 10) : "",
      r.startAddress, r.endAddress, sv(r.distanceKm), sv(r.ratePerKm), sv(r.amount),
      r.purpose === "business" ? "Tjänst" : "Privat", r.note,
    ].map(esc).join(";"),
  );
  const csv = "\uFEFF" + [header.join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="korjournal.csv"',
    },
  });
}
