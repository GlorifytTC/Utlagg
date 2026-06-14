import { getServerSession } from "next-auth";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { transportPasses, type TransportPass } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

function csvCell(v: string | number | null): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Ej inloggad", { status: 401 });
  const rows = await db
    .select()
    .from(transportPasses)
    .where(eq(transportPasses.userId, session.user.id))
    .orderBy(desc(transportPasses.validFrom));

  const header = ["Giltig från", "Giltig till", "Typ", "Trafikhuvudman", "Belopp (SEK)", "Moms %", "Moms (SEK)", "Återkommande"];
  const lines = rows.map((p: TransportPass) =>
    [
      new Date(p.validFrom).toISOString().slice(0, 10),
      new Date(p.validTo).toISOString().slice(0, 10),
      p.passType,
      p.provider === "Other" ? p.providerOther ?? "Annat" : p.provider,
      p.amount,
      p.vatRate,
      p.vatAmount ?? "",
      p.isRecurring ? "Ja" : "Nej",
    ].map(csvCell).join(";"),
  );
  const csv = "\uFEFF" + [header.join(";"), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="periodbiljetter-${new Date().getFullYear()}.csv"`,
    },
  });
}
