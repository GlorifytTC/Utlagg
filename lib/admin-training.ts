import "server-only";
import { desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { receiptTrainingData, vendorCorrections, ocrSamples } from "@/db/schema";

/**
 * Read-only statistics for the admin "Modellträning" page.
 *
 * Two engines read receipts:
 *  - Gemini (paid/quota API)     -> receipt_training_data.ai_result
 *  - Own model (free, local)     -> receipt_training_data.local_result
 *    Tesseract + parseReceiptText + crowd-learned vendor names. It runs on
 *    every scan: as a background "shadow" read when Gemini answered, or as the
 *    only reader when Gemini was unavailable (source = 'local').
 *
 * Both are scored with IDENTICAL rules against the label - the values the user
 * confirmed when saving. A row is labeled once confirmed vendor or total is
 * set. The fair comparison is HEAD-TO-HEAD: labeled rows that both engines
 * read. That, plus the hybrid projection (use the own model when its
 * confidence is high, Gemini otherwise), is what decides whether Gemini can be
 * switched off.
 */

const t = receiptTrainingData;
type Col = typeof t.aiResult | typeof t.localResult;

export type Field = "vendor" | "orgNumber" | "date" | "total" | "vat" | "vatRate";
export const FIELDS: Field[] = ["vendor", "orgNumber", "date", "total", "vat", "vatRate"];

export interface FieldAccuracy {
  field: Field;
  checked: number;
  correct: number;
}

export interface EngineStats {
  /** Labeled rows this engine read (denominator for full-receipt accuracy). */
  n: number;
  /** Rows where EVERY confirmed field matched. */
  fullCorrect: number;
  fields: FieldAccuracy[];
}

export interface HybridRow {
  /** Own model is used when its confidence >= threshold, Gemini otherwise. */
  threshold: number;
  /** Head-to-head receipts the own model would have handled alone. */
  ownUsed: number;
  /** ...of which the own model got fully right. */
  ownCorrect: number;
  /** Fully-correct receipts under the hybrid policy (own above, Gemini below). */
  blendedCorrect: number;
}

export type Readiness =
  | { state: "collecting"; n: number; needed: number }
  | { state: "replace" }
  | { state: "hybrid"; threshold: number; skipShare: number; blendedAccuracy: number }
  | { state: "not_ready" };

export interface TrainingStats {
  /** True when the training tables/columns don't exist yet (migrations 0029/0030 not applied). */
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
  /** Gemini per-field accuracy over all labeled rows it read (kept for back-compat). */
  fields: FieldAccuracy[];
  engines: { gemini: EngineStats; own: EngineStats };
  headToHead: { n: number; gemini: EngineStats; own: EngineStats };
  hybrid: HybridRow[];
  readiness: Readiness;
  /** Share of labeled receipts that also have an own-model read. */
  ownCoverage: { withOwn: number; labeled: number };
  /** Own-model-only scans (Gemini unavailable). */
  ownOnly: number;
  geminiCalls30d: number;
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

/* ------------------------------------------------------------------ */
/* Readiness policy - deliberately conservative, change here only.     */
/* ------------------------------------------------------------------ */
/** Minimum head-to-head labeled receipts before any verdict is given. */
export const MIN_HEAD_TO_HEAD = 200;
/** Allowed drop in full-receipt accuracy vs Gemini (0.01 = 1 percentage point). */
export const ACCURACY_TOLERANCE = 0.01;
export const HYBRID_THRESHOLDS = [50, 60, 70, 80, 90];

/* ------------------------------------------------------------------ */
/* SQL builders: same matching rules for both engines                  */
/* ------------------------------------------------------------------ */
const val = (c: Col, key: string) => sql`(${c} ->> ${key})`;
const num = (c: Col, key: string) =>
  sql`(CASE WHEN ${val(c, key)} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN ${val(c, key)}::numeric END)`;

const CONFIRMED: Record<Field, SQL> = {
  vendor: sql`${t.confirmedVendor}`,
  orgNumber: sql`${t.confirmedOrgNumber}`,
  date: sql`${t.confirmedDate}`,
  total: sql`${t.confirmedTotal}`,
  vat: sql`${t.confirmedVat}`,
  vatRate: sql`${t.confirmedVatRate}`,
};

const MATCH: Record<Field, (c: Col) => SQL> = {
  vendor: (c) => sql`coalesce(lower(trim(${val(c, "vendorName")})) = lower(trim(${t.confirmedVendor})), false)`,
  orgNumber: (c) =>
    sql`coalesce(regexp_replace(${val(c, "orgNumber")}, '[^0-9]', '', 'g') = regexp_replace(${t.confirmedOrgNumber}, '[^0-9]', '', 'g'), false)`,
  date: (c) => sql`coalesce(${val(c, "date")} = ${t.confirmedDate}, false)`,
  total: (c) => sql`coalesce(abs(${num(c, "totalAmount")} - ${t.confirmedTotal}) < 0.01, false)`,
  vat: (c) => sql`coalesce(abs(${num(c, "vatAmount")} - ${t.confirmedVat}) < 0.01, false)`,
  vatRate: (c) => sql`coalesce(${num(c, "vatRate")} = ${t.confirmedVatRate}, false)`,
};

/** Every confirmed field matched (unconfirmed fields don't count against it). */
const fullMatch = (c: Col) =>
  sql.join(
    FIELDS.map((f) => sql`(${CONFIRMED[f]} IS NULL OR ${MATCH[f](c)})`),
    sql` AND `,
  );

const labeled = sql`(${t.confirmedTotal} IS NOT NULL OR ${t.confirmedVendor} IS NOT NULL)`;
const headToHeadRows = sql`(${labeled} AND ${t.aiResult} IS NOT NULL AND ${t.localResult} IS NOT NULL)`;

async function engineStats(c: Col, rowFilter: SQL): Promise<EngineStats> {
  const sel: Record<string, SQL> = {
    n: sql`count(*) FILTER (WHERE ${rowFilter})::int`,
    full: sql`count(*) FILTER (WHERE ${rowFilter} AND ${fullMatch(c)})::int`,
  };
  for (const f of FIELDS) {
    sel[`${f}_checked`] = sql`count(*) FILTER (WHERE ${rowFilter} AND ${CONFIRMED[f]} IS NOT NULL)::int`;
    sel[`${f}_correct`] = sql`count(*) FILTER (WHERE ${rowFilter} AND ${CONFIRMED[f]} IS NOT NULL AND ${MATCH[f](c)})::int`;
  }
  const [r] = (await db.select(sel).from(t)) as Record<string, unknown>[];
  return {
    n: n(r?.n),
    fullCorrect: n(r?.full),
    fields: FIELDS.map((f) => ({ field: f, checked: n(r?.[`${f}_checked`]), correct: n(r?.[`${f}_correct`]) })),
  };
}

async function hybridRows(): Promise<HybridRow[]> {
  const conf = sql`coalesce(${t.localConfidence}, 0)`;
  const sel: Record<string, SQL> = {};
  for (const x of HYBRID_THRESHOLDS) {
    sel[`u${x}`] = sql`count(*) FILTER (WHERE ${headToHeadRows} AND ${conf} >= ${x})::int`;
    sel[`c${x}`] = sql`count(*) FILTER (WHERE ${headToHeadRows} AND ${conf} >= ${x} AND ${fullMatch(t.localResult)})::int`;
    sel[`b${x}`] = sql`count(*) FILTER (WHERE ${headToHeadRows} AND (
      (${conf} >= ${x} AND ${fullMatch(t.localResult)}) OR (${conf} < ${x} AND ${fullMatch(t.aiResult)})))::int`;
  }
  const [r] = (await db.select(sel).from(t)) as Record<string, unknown>[];
  return HYBRID_THRESHOLDS.map((x) => ({
    threshold: x,
    ownUsed: n(r?.[`u${x}`]),
    ownCorrect: n(r?.[`c${x}`]),
    blendedCorrect: n(r?.[`b${x}`]),
  }));
}

/** Pure verdict from head-to-head numbers. Exported for tests. */
export function computeReadiness(h2h: { n: number; gemini: EngineStats; own: EngineStats }, hybrid: HybridRow[]): Readiness {
  if (h2h.n < MIN_HEAD_TO_HEAD) return { state: "collecting", n: h2h.n, needed: MIN_HEAD_TO_HEAD };
  const gemAcc = h2h.gemini.fullCorrect / h2h.n;
  const ownAcc = h2h.own.fullCorrect / h2h.n;
  if (ownAcc >= gemAcc - ACCURACY_TOLERANCE) return { state: "replace" };
  const ok = hybrid
    .filter((h) => h.ownUsed > 0 && h.blendedCorrect / h2h.n >= gemAcc - ACCURACY_TOLERANCE)
    .sort((a, b) => b.ownUsed - a.ownUsed)[0];
  if (ok) {
    return {
      state: "hybrid",
      threshold: ok.threshold,
      skipShare: ok.ownUsed / h2h.n,
      blendedAccuracy: ok.blendedCorrect / h2h.n,
    };
  }
  return { state: "not_ready" };
}

/* ------------------------------------------------------------------ */

const n = (v: unknown) => Number(v ?? 0) || 0;

const emptyEngine = (): EngineStats => ({
  n: 0,
  fullCorrect: 0,
  fields: FIELDS.map((field) => ({ field, checked: 0, correct: 0 })),
});

const EMPTY: TrainingStats = {
  notMigrated: false,
  total: 0, labeled: 0, unlabeled: 0, corrected: 0, withImage: 0, last7Days: 0, last30Days: 0,
  firstAt: null, lastAt: null,
  fields: emptyEngine().fields,
  engines: { gemini: emptyEngine(), own: emptyEngine() },
  headToHead: { n: 0, gemini: emptyEngine(), own: emptyEngine() },
  hybrid: HYBRID_THRESHOLDS.map((threshold) => ({ threshold, ownUsed: 0, ownCorrect: 0, blendedCorrect: 0 })),
  readiness: { state: "collecting", n: 0, needed: MIN_HEAD_TO_HEAD },
  ownCoverage: { withOwn: 0, labeled: 0 },
  ownOnly: 0,
  geminiCalls30d: 0,
  sources: [], daily: [],
  vendorCorrections: { total: 0, top: [] },
  ocrSamples: { total: 0, byField: [] },
  recentMistakes: [],
};

/** Postgres undefined_table (42P01) / undefined_column (42703), possibly wrapped. */
function isMissingSchema(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string }; message?: string } | null;
  const code = e?.code ?? e?.cause?.code;
  return code === "42P01" || code === "42703" || /does not exist/.test(e?.message ?? "");
}

export async function getTrainingStats(): Promise<TrainingStats> {
  try {
    return await computeTrainingStats();
  } catch (err) {
    // Deploys don't run migrations; the page must explain instead of 500ing.
    if (isMissingSchema(err)) return { ...EMPTY, notMigrated: true };
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
      withOwn: sql<number>`count(*) FILTER (WHERE ${labeled} AND ${t.localResult} IS NOT NULL)::int`,
      ownOnly: sql<number>`count(*) FILTER (WHERE ${t.aiResult} IS NULL AND ${t.localResult} IS NOT NULL)::int`,
      gem30: sql<number>`count(*) FILTER (WHERE ${t.aiResult} IS NOT NULL AND ${t.createdAt} > now() - interval '30 days')::int`,
    })
    .from(t)) as Record<string, unknown>[];

  const [gemini, own, h2hGem, h2hOwn, hybrid] = await Promise.all([
    engineStats(t.aiResult, sql`(${labeled} AND ${t.aiResult} IS NOT NULL)`),
    engineStats(t.localResult, sql`(${labeled} AND ${t.localResult} IS NOT NULL)`),
    engineStats(t.aiResult, headToHeadRows),
    engineStats(t.localResult, headToHeadRows),
    hybridRows(),
  ]);
  const headToHead = { n: h2hGem.n, gemini: h2hGem, own: h2hOwn };

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

  const [vcAgg] = (await db.select({ total: sql<number>`count(*)::int` }).from(vendorCorrections)) as { total: number }[];
  const vcTop = (await db
    .select({
      vendor: vendorCorrections.correctVendor,
      orgNumber: vendorCorrections.orgNumber,
      times: vendorCorrections.timesConfirmed,
    })
    .from(vendorCorrections)
    .orderBy(desc(vendorCorrections.timesConfirmed), desc(vendorCorrections.updatedAt))
    .limit(10)) as { vendor: string; orgNumber: string | null; times: number }[];

  const [osAgg] = (await db.select({ total: sql<number>`count(*)::int` }).from(ocrSamples)) as { total: number }[];
  const osByField = (await db
    .select({ field: ocrSamples.field, count: sql<number>`count(*)::int` })
    .from(ocrSamples)
    .groupBy(ocrSamples.field)
    .orderBy(desc(sql`count(*)`))) as { field: string; count: number }[];

  const mistakes = (await db
    .select({
      id: t.id,
      createdAt: t.createdAt,
      aiVendor: sql<string | null>`${val(t.aiResult, "vendorName")}`,
      vendor: t.confirmedVendor,
      aiTotal: sql<string | null>`${val(t.aiResult, "totalAmount")}`,
      total: t.confirmedTotal,
      aiDate: sql<string | null>`${val(t.aiResult, "date")}`,
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
    fields: gemini.fields,
    engines: { gemini, own },
    headToHead,
    hybrid,
    readiness: computeReadiness(headToHead, hybrid),
    ownCoverage: { withOwn: n(agg?.withOwn), labeled: lab },
    ownOnly: n(agg?.ownOnly),
    geminiCalls30d: n(agg?.gem30),
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
