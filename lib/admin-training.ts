import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { receiptTrainingData, vendorCorrections, ocrSamples } from "@/db/schema";

/**
 * Read-only statistics about the receipt-reading training dataset, for the
 * admin "Modellträning" page.
 *
 * Sources:
 *  - receipt_training_data: every AI (Gemini) read of a scanned receipt, plus
 *    the values the user finally confirmed. A row is LABELED once the user has
 *    saved it (confirmed vendor or total present). wasCorrected marks rows
 *    where the user changed what the AI proposed - the AI's real mistakes.
 *  - vendor_corrections: vendor names learned from user corrections, shared
 *    across all users by org number.
 *  - ocr_samples: manual field annotations (bounding boxes) from the scanner.
 *
 * Per-field accuracy compares the AI's raw output (ai_result JSON) with the
 * confirmed value, only over rows where that confirmed field is present.
 */

const t = receiptTrainingData;
const ai = (key: string) => sql`(${t.aiResult} ->> ${key})`;
const num = (key: string) =>
  sql`(CASE WHEN ${ai(key)} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN ${ai(key)}::numeric END)`;
const labeled = sql`(${t.confirmedTotal} IS NOT NULL OR ${t.confirmedVendor} IS NOT NULL)`;

export interface FieldAccuracy {
  field: "vendor" | "orgNumber" | "date" | "total" | "vat" | "vatRate";
  checked: number;
  correct: number;
}

export interface TrainingStats {
  /** True when the training tables don't exist yet (migration 0029 not applied). */
  notMigrated: boolean;
  total: number;
  labeled: number;
  unlabeled: number;
  corrected: number;
  withImage: number;
  last7Days: number;
  last30Days: number;
  firstAt: string | null;
  lastAt: string | null;
  fields: FieldAccuracy[];
  sources: { source: string; count: number }[];
  daily: { day: string; scans: number; corrected: number }[];
  vendorCorrections: { total: number; top: { vendor: string; orgNumber: string | null; times: number }[] };
  ocrSamples: { total: number; byField: { field: string; count: number }[] };
  recentMistakes: {
    id: string;
    createdAt: string;
    aiVendor: string | null;
    vendor: string | null;
    aiTotal: string | null;
    total: string | null;
    aiDate: string | null;
    date: string | null;
  }[];
}

const n = (v: unknown) => Number(v ?? 0) || 0;

const EMPTY: TrainingStats = {
  notMigrated: false,
  total: 0, labeled: 0, unlabeled: 0, corrected: 0, withImage: 0, last7Days: 0, last30Days: 0,
  firstAt: null, lastAt: null,
  fields: (["vendor", "orgNumber", "date", "total", "vat", "vatRate"] as const).map((field) => ({ field, checked: 0, correct: 0 })),
  sources: [], daily: [],
  vendorCorrections: { total: 0, top: [] },
  ocrSamples: { total: 0, byField: [] },
  recentMistakes: [],
};

/** Postgres "undefined_table" (42P01), possibly wrapped by the driver/ORM. */
function isMissingTable(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string }; message?: string } | null;
  return e?.code === "42P01" || e?.cause?.code === "42P01" || /does not exist/.test(e?.message ?? "");
}

export async function getTrainingStats(): Promise<TrainingStats> {
  try {
    return await computeTrainingStats();
  } catch (err) {
    // The deploy pipeline does not run migrations, so the page must not 500
    // before 0029_training_tables is applied; it tells the admin instead.
    if (isMissingTable(err)) return { ...EMPTY, notMigrated: true };
    throw err;
  }
}

async function computeTrainingStats(): Promise<TrainingStats> {
  const [agg] = (await db
    .select({
      total: sql<number>`count(*)::int`,
      labeled: sql<number>`count(*) FILTER (WHERE ${labeled})::int`,
      corrected: sql<number>`count(*) FILTER (WHERE ${labeled} AND ${t.wasCorrected})::int`,
      withImage: sql<number>`count(*) FILTER (WHERE ${t.imageData} IS NOT NULL)::int`,
      last7: sql<number>`count(*) FILTER (WHERE ${t.createdAt} > now() - interval '7 days')::int`,
      last30: sql<number>`count(*) FILTER (WHERE ${t.createdAt} > now() - interval '30 days')::int`,
      firstAt: sql<string | null>`min(${t.createdAt})`,
      lastAt: sql<string | null>`max(${t.createdAt})`,

      vendorChecked: sql<number>`count(*) FILTER (WHERE ${t.confirmedVendor} IS NOT NULL)::int`,
      vendorCorrect: sql<number>`count(*) FILTER (WHERE ${t.confirmedVendor} IS NOT NULL
        AND lower(trim(${ai("vendorName")})) = lower(trim(${t.confirmedVendor})))::int`,
      orgChecked: sql<number>`count(*) FILTER (WHERE ${t.confirmedOrgNumber} IS NOT NULL)::int`,
      orgCorrect: sql<number>`count(*) FILTER (WHERE ${t.confirmedOrgNumber} IS NOT NULL
        AND regexp_replace(${ai("orgNumber")}, '[^0-9]', '', 'g') = regexp_replace(${t.confirmedOrgNumber}, '[^0-9]', '', 'g'))::int`,
      dateChecked: sql<number>`count(*) FILTER (WHERE ${t.confirmedDate} IS NOT NULL)::int`,
      dateCorrect: sql<number>`count(*) FILTER (WHERE ${t.confirmedDate} IS NOT NULL
        AND ${ai("date")} = ${t.confirmedDate})::int`,
      totalChecked: sql<number>`count(*) FILTER (WHERE ${t.confirmedTotal} IS NOT NULL)::int`,
      totalCorrect: sql<number>`count(*) FILTER (WHERE ${t.confirmedTotal} IS NOT NULL
        AND abs(${num("totalAmount")} - ${t.confirmedTotal}) < 0.01)::int`,
      vatChecked: sql<number>`count(*) FILTER (WHERE ${t.confirmedVat} IS NOT NULL)::int`,
      vatCorrect: sql<number>`count(*) FILTER (WHERE ${t.confirmedVat} IS NOT NULL
        AND abs(${num("vatAmount")} - ${t.confirmedVat}) < 0.01)::int`,
      rateChecked: sql<number>`count(*) FILTER (WHERE ${t.confirmedVatRate} IS NOT NULL)::int`,
      rateCorrect: sql<number>`count(*) FILTER (WHERE ${t.confirmedVatRate} IS NOT NULL
        AND ${num("vatRate")} = ${t.confirmedVatRate})::int`,
    })
    .from(t)) as Record<string, unknown>[];

  const sources = (await db
    .select({ source: t.source, count: sql<number>`count(*)::int` })
    .from(t)
    .groupBy(t.source)
    .orderBy(desc(sql`count(*)`))) as { source: string; count: number }[];

  const daily = (await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${t.createdAt}), 'YYYY-MM-DD')`,
      scans: sql<number>`count(*)::int`,
      corrected: sql<number>`count(*) FILTER (WHERE ${labeled} AND ${t.wasCorrected})::int`,
    })
    .from(t)
    .where(sql`${t.createdAt} > now() - interval '14 days'`)
    .groupBy(sql`date_trunc('day', ${t.createdAt})`)
    .orderBy(sql`date_trunc('day', ${t.createdAt}) asc`)) as { day: string; scans: number; corrected: number }[];

  const [vcAgg] = (await db
    .select({ total: sql<number>`count(*)::int` })
    .from(vendorCorrections)) as { total: number }[];
  const vcTop = (await db
    .select({
      vendor: vendorCorrections.correctVendor,
      orgNumber: vendorCorrections.orgNumber,
      times: vendorCorrections.timesConfirmed,
    })
    .from(vendorCorrections)
    .orderBy(desc(vendorCorrections.timesConfirmed), desc(vendorCorrections.updatedAt))
    .limit(10)) as { vendor: string; orgNumber: string | null; times: number }[];

  const [osAgg] = (await db
    .select({ total: sql<number>`count(*)::int` })
    .from(ocrSamples)) as { total: number }[];
  const osByField = (await db
    .select({ field: ocrSamples.field, count: sql<number>`count(*)::int` })
    .from(ocrSamples)
    .groupBy(ocrSamples.field)
    .orderBy(desc(sql`count(*)`))) as { field: string; count: number }[];

  const mistakes = (await db
    .select({
      id: t.id,
      createdAt: t.createdAt,
      aiVendor: sql<string | null>`${ai("vendorName")}`,
      vendor: t.confirmedVendor,
      aiTotal: sql<string | null>`${ai("totalAmount")}`,
      total: t.confirmedTotal,
      aiDate: sql<string | null>`${ai("date")}`,
      date: t.confirmedDate,
    })
    .from(t)
    .where(eq(t.wasCorrected, true))
    .orderBy(desc(t.createdAt))
    .limit(15)) as Array<{
    id: string;
    createdAt: Date | string;
    aiVendor: string | null;
    vendor: string | null;
    aiTotal: string | null;
    total: string | null;
    aiDate: string | null;
    date: string | null;
  }>;

  const total = n(agg?.total);
  const lab = n(agg?.labeled);
  const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

  return {
    notMigrated: false,
    total,
    labeled: lab,
    unlabeled: total - lab,
    corrected: n(agg?.corrected),
    withImage: n(agg?.withImage),
    last7Days: n(agg?.last7),
    last30Days: n(agg?.last30),
    firstAt: iso(agg?.firstAt),
    lastAt: iso(agg?.lastAt),
    fields: [
      { field: "vendor", checked: n(agg?.vendorChecked), correct: n(agg?.vendorCorrect) },
      { field: "orgNumber", checked: n(agg?.orgChecked), correct: n(agg?.orgCorrect) },
      { field: "date", checked: n(agg?.dateChecked), correct: n(agg?.dateCorrect) },
      { field: "total", checked: n(agg?.totalChecked), correct: n(agg?.totalCorrect) },
      { field: "vat", checked: n(agg?.vatChecked), correct: n(agg?.vatCorrect) },
      { field: "vatRate", checked: n(agg?.rateChecked), correct: n(agg?.rateCorrect) },
    ],
    sources: sources.map((s) => ({ source: s.source, count: n(s.count) })),
    daily: daily.map((d) => ({ day: d.day, scans: n(d.scans), corrected: n(d.corrected) })),
    vendorCorrections: {
      total: n(vcAgg?.total),
      top: vcTop.map((v) => ({ vendor: v.vendor, orgNumber: v.orgNumber, times: n(v.times) })),
    },
    ocrSamples: {
      total: n(osAgg?.total),
      byField: osByField.map((f) => ({ field: f.field, count: n(f.count) })),
    },
    recentMistakes: mistakes.map((m) => ({
      id: m.id,
      createdAt: new Date(m.createdAt).toISOString(),
      aiVendor: m.aiVendor,
      vendor: m.vendor,
      aiTotal: m.aiTotal,
      total: m.total,
      aiDate: m.aiDate,
      date: m.date,
    })),
  };
}
