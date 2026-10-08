import { NextResponse, type NextRequest } from "next/server";
import { and, asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { receiptTrainingData } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { logAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 300;

const t = receiptTrainingData;
const BATCH = 100;

/**
 * GET - admin downloads the receipt training dataset as JSON Lines, one
 * receipt per line, to train a dedicated receipt-reading model.
 *
 *   ?images=1   include the receipt image (base64 data URL). Large.
 *   ?all=1      include unlabeled rows too (default: labeled only).
 *
 * Each line: { id, createdAt, source, label{...}, gemini, own, ownConfidence,
 * wasCorrected, image? }. "label" is what the user confirmed: the target the
 * model should learn to produce. Streamed in keyset-paginated batches so a
 * large dataset with images never sits in memory at once. Admin-only and
 * audit-logged: it contains end users' receipt data.
 */
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const withImages = sp.get("images") === "1";
  const includeAll = sp.get("all") === "1";
  const labeledOnly = sql`(${t.confirmedTotal} IS NOT NULL OR ${t.confirmedVendor} IS NOT NULL)`;

  await logAudit({
    userId: session.user.id,
    action: "admin.training.export",
    details: `images=${withImages ? 1 : 0} all=${includeAll ? 1 : 0}`,
    ipAddress: clientIp(req),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let cursor: { createdAt: Date; id: string } | null = null;
      try {
        for (;;) {
          const conds = [];
          if (!includeAll) conds.push(labeledOnly);
          if (cursor) conds.push(sql`(${t.createdAt}, ${t.id}) > (${cursor.createdAt.toISOString()}::timestamptz, ${cursor.id}::uuid)`);
          const rows = await db
            .select({
              id: t.id,
              createdAt: t.createdAt,
              source: t.source,
              aiResult: t.aiResult,
              localResult: t.localResult,
              localConfidence: t.localConfidence,
              wasCorrected: t.wasCorrected,
              confirmedVendor: t.confirmedVendor,
              confirmedOrgNumber: t.confirmedOrgNumber,
              confirmedDate: t.confirmedDate,
              confirmedTotal: t.confirmedTotal,
              confirmedVat: t.confirmedVat,
              confirmedVatRate: t.confirmedVatRate,
              ...(withImages ? { imageData: t.imageData } : {}),
            })
            .from(t)
            .where(conds.length ? and(...conds) : undefined)
            .orderBy(asc(t.createdAt), asc(t.id))
            .limit(BATCH);

          for (const r of rows as Array<Record<string, unknown>>) {
            const line = {
              id: r.id,
              createdAt: new Date(r.createdAt as string).toISOString(),
              source: r.source,
              label: {
                vendorName: r.confirmedVendor ?? null,
                orgNumber: r.confirmedOrgNumber ?? null,
                date: r.confirmedDate ?? null,
                totalAmount: r.confirmedTotal != null ? Number(r.confirmedTotal) : null,
                vatAmount: r.confirmedVat != null ? Number(r.confirmedVat) : null,
                vatRate: r.confirmedVatRate ?? null,
              },
              gemini: r.aiResult ?? null,
              own: r.localResult ?? null,
              ownConfidence: r.localConfidence ?? null,
              wasCorrected: r.wasCorrected,
              ...(withImages ? { image: r.imageData ?? null } : {}),
            };
            controller.enqueue(encoder.encode(JSON.stringify(line) + "\n"));
          }
          if (rows.length < BATCH) break;
          const last = rows[rows.length - 1] as { createdAt: Date | string; id: string };
          cursor = { createdAt: new Date(last.createdAt), id: last.id };
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Content-Disposition": `attachment; filename="kvittino-training-${day}${withImages ? "-images" : ""}.jsonl"`,
      "Cache-Control": "no-store",
    },
  });
}
