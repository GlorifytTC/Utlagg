import "server-only";
import { and, count, desc, gte, inArray, lte, sum, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { receipts, mileageEntries, transportPasses } from "@/db/schema";

/** One row of the "what will be exported" list. `amount` is a numeric string. */
export type PreviewItem = {
  id: string;
  title: string;
  date: string | null;
  /** Secondary detail, e.g. distance or validity end. */
  meta: string | null;
  amount: string | null;
};

type Section = { count: number; total: number; items: PreviewItem[] };

export type ExportPreview = {
  receipts: Section;
  mileage: Section;
  transport: Section;
};

type Range = { from: Date | null; to: Date | null };

/** Rows listed per category; count/total always cover everything. */
export const PREVIEW_ITEM_LIMIT = 500;

const iso = (d: Date | null) => (d ? d.toISOString() : null);

/**
 * Counts, totals and the rows themselves for the export period. Conditions
 * mirror the download routes so preview == file. `transportMode`: the user
 * route counts a pass if its validity overlaps the range; the accountant route
 * by start date.
 */
export async function exportPreview(
  userIds: string[],
  { from, to }: Range,
  transportMode: "overlap" | "start" = "overlap",
): Promise<ExportPreview> {
  if (userIds.length === 0) {
    const z = { count: 0, total: 0, items: [] };
    return { receipts: z, mileage: z, transport: z };
  }
  const rc: SQL[] = [inArray(receipts.userId, userIds)];
  const mc: SQL[] = [inArray(mileageEntries.userId, userIds)];
  const tc: SQL[] = [inArray(transportPasses.userId, userIds)];
  if (from) {
    rc.push(gte(receipts.date, from));
    mc.push(gte(mileageEntries.date, from));
    tc.push(gte(transportMode === "overlap" ? transportPasses.validTo : transportPasses.validFrom, from));
  }
  if (to) {
    rc.push(lte(receipts.date, to));
    mc.push(lte(mileageEntries.date, to));
    tc.push(lte(transportPasses.validFrom, to));
  }
  const [[rn], [mn], [tn], rr, mr, tr] = await Promise.all([
    db.select({ n: count(), s: sum(receipts.totalAmount) }).from(receipts).where(and(...rc)),
    db.select({ n: count(), s: sum(mileageEntries.amount) }).from(mileageEntries).where(and(...mc)),
    db.select({ n: count(), s: sum(transportPasses.amount) }).from(transportPasses).where(and(...tc)),
    db
      .select({ id: receipts.id, vendor: receipts.vendorName, date: receipts.date, amount: receipts.totalAmount })
      .from(receipts)
      .where(and(...rc))
      .orderBy(desc(receipts.date))
      .limit(PREVIEW_ITEM_LIMIT),
    db
      .select({
        id: mileageEntries.id,
        a: mileageEntries.startAddress,
        b: mileageEntries.endAddress,
        km: mileageEntries.distanceKm,
        date: mileageEntries.date,
        amount: mileageEntries.amount,
      })
      .from(mileageEntries)
      .where(and(...mc))
      .orderBy(desc(mileageEntries.date))
      .limit(PREVIEW_ITEM_LIMIT),
    db
      .select({
        id: transportPasses.id,
        provider: transportPasses.provider,
        other: transportPasses.providerOther,
        type: transportPasses.passType,
        from: transportPasses.validFrom,
        to: transportPasses.validTo,
        amount: transportPasses.amount,
      })
      .from(transportPasses)
      .where(and(...tc))
      .orderBy(desc(transportPasses.validFrom))
      .limit(PREVIEW_ITEM_LIMIT),
  ]);
  const pack = (x: { n: number; s: string | null }, items: PreviewItem[]): Section => ({
    count: Number(x.n),
    total: Number(x.s ?? 0),
    items,
  });
  return {
    receipts: pack(
      rn,
      rr.map((r: { id: string; vendor: string | null; date: Date | null; amount: string | null }) => ({ id: r.id, title: r.vendor ?? "", date: iso(r.date), meta: null, amount: r.amount })),
    ),
    mileage: pack(
      mn,
      mr.map((r: { id: string; a: string; b: string; km: string; date: Date; amount: string }) => ({ id: r.id, title: `${r.a} → ${r.b}`, date: iso(r.date), meta: `${Number(r.km)} km`, amount: r.amount })),
    ),
    transport: pack(
      tn,
      tr.map((r: { id: string; provider: string; other: string | null; type: string; from: Date; to: Date; amount: string }) => ({
        id: r.id,
        title: `${r.provider === "Other" && r.other ? r.other : r.provider} · ${r.type}`,
        date: iso(r.from),
        meta: `– ${r.to.toISOString().slice(0, 10)}`,
        amount: r.amount,
      })),
    ),
  };
}
