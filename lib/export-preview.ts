import "server-only";
import { and, count, gte, inArray, lte, sum, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { receipts, mileageEntries, transportPasses } from "@/db/schema";

export type ExportPreview = {
  receipts: { count: number; total: number };
  mileage: { count: number; total: number };
  transport: { count: number; total: number };
};

type Range = { from: Date | null; to: Date | null };

/**
 * Row counts + amount totals for the export period. Conditions mirror the
 * download routes so preview == file. `transportMode`: the user route counts a
 * pass if its validity overlaps the range; the accountant route by start date.
 */
export async function exportPreview(
  userIds: string[],
  { from, to }: Range,
  transportMode: "overlap" | "start" = "overlap",
): Promise<ExportPreview> {
  if (userIds.length === 0) {
    const z = { count: 0, total: 0 };
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
  const [[r], [m], [t]] = await Promise.all([
    db.select({ n: count(), s: sum(receipts.totalAmount) }).from(receipts).where(and(...rc)),
    db.select({ n: count(), s: sum(mileageEntries.amount) }).from(mileageEntries).where(and(...mc)),
    db.select({ n: count(), s: sum(transportPasses.amount) }).from(transportPasses).where(and(...tc)),
  ]);
  const pack = (x: { n: number; s: string | null }) => ({ count: Number(x.n), total: Number(x.s ?? 0) });
  return { receipts: pack(r), mileage: pack(m), transport: pack(t) };
}
