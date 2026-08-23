import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { transportPasses, type TransportPass } from "@/db/schema";
import { authOptions } from "@/lib/auth";
import { assertExportAllowed } from "@/lib/billing/export-gating";

export const runtime = "nodejs";

function csvCell(v: string | number | null): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Optional ?from=&to= (YYYY-MM-DD). A pass counts if its validity period
 * overlaps the requested range at all — e.g. a March–April pass should
 * still show up in a March-only export, not just an April one. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Ej inloggad", { status: 401 });

  // Transport-pass CSV is a machine-readable record set → "csv", always
  // available (spec §C).
  await assertExportAllowed(session.user.id, "csv");

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const conds = [eq(transportPasses.userId, session.user.id)];
  // overlap test: pass.validFrom <= rangeEnd AND pass.validTo >= rangeStart
  if (to && !Number.isNaN(Date.parse(to))) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conds.push(lte(transportPasses.validFrom, end));
  }
  if (from && !Number.isNaN(Date.parse(from))) {
    conds.push(gte(transportPasses.validTo, new Date(from)));
  }

  const rows = await db
    .select()
    .from(transportPasses)
    .where(and(...conds))
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
