/**
 * SIE 4 export — the de-facto standard interchange format for Swedish accounting
 * software (Fortnox, Visma, Bokio, …). RECEIPTS ONLY: customer invoices have a
 * separate export path and are never fed through this module. Each receipt
 * becomes one balanced verification (`#VER`) whose transaction rows (`#TRANS`)
 * sum to exactly 0.00:
 *
 *   1. cost account (receipt BAS code), net of VAT   — debit  (+)
 *   2. input VAT account 2640 (ingående moms)        — debit  (+)   [omitted if 0]
 *   3. payment / credit account                      — credit (−)
 *
 * The credit account depends on HOW the receipt was paid — company card/bank
 * (1930) vs. on account / unpaid (2440). Our receipts model does NOT record the
 * payment method, so the credit account is a caller-supplied parameter that
 * defaults to 1930. Confirm this, plus the BAS cost mapping, with the company's
 * accountant.  TODO(accounting): capture payment method per receipt to remove
 * the assumption; employee out-of-pocket outlays would instead credit 2890.
 *
 * #RAR: strict importers reject #VER dates outside a declared financial year,
 * so we emit one #RAR 0 spanning the full range of exported verification dates
 * (merged with any requested date range). This keeps all-time exports loadable.
 *
 * Spec: SIE file format v4B, https://sie.se/ . Output is CP437 ("PC8") encoded
 * bytes — see lib/cp437.ts for why UTF-8 is not acceptable.
 */
import { encodeCp437, type Cp437Warning } from "@/lib/cp437";
import { getBasAccount } from "@/lib/bas";

export const VAT_INPUT_ACCOUNT = "2640"; // Ingående moms
export const DEFAULT_CREDIT_ACCOUNT = "1930"; // Företagskonto (bank)
export const VERIFICATION_SERIES = "F"; // single series per spec example

/** Human-readable names for the non-cost accounts we may emit. */
const KNOWN_ACCOUNT_NAMES: Record<string, string> = {
  "1930": "Företagskonto",
  "2440": "Leverantörsskulder",
  "2640": "Ingående moms",
  "2890": "Övriga kortfristiga skulder",
  "6991": "Övriga externa kostnader, avdragsgilla",
};
const DEFAULT_COST_ACCOUNT = "6991"; // misc deductible — matches lib/fortnox.ts

/** The subset of receipt fields the generator needs (framework-agnostic). */
export interface SieReceiptInput {
  id: string;
  vendorName: string | null;
  date: Date | string | null;
  totalAmount: string | number | null;
  vatAmount: string | number | null;
  vatRate: number | null;
  basCode: string | null;
  /** Fallback verification date when `date` is missing. */
  createdAt?: Date | string | null;
}

export interface SieCompany {
  name: string;
  /** Organisationsnummer. Malformed/missing values warn but do not block. */
  orgNumber?: string | null;
}

export interface BuildSieOptions {
  company: SieCompany;
  receipts: SieReceiptInput[];
  /**
   * Optional requested date range. When omitted the export is "all time" and
   * #RAR is derived purely from the exported verification dates.
   */
  from?: Date | null;
  to?: Date | null;
  /** Credit account for row 3. Defaults to 1930 (company bank). */
  creditAccount?: string;
  program?: { name: string; version: string };
  /** Override "now" for deterministic #GEN in tests. */
  generatedAt?: Date;
}

export interface BuildSieResult {
  /** CP437-encoded file bytes, ready to write/stream. */
  bytes: Buffer;
  /** The pre-encoding text (useful for debugging / assertions). */
  text: string;
  /** Non-fatal issues: orgnr problems, date fallbacks, encoding substitutions… */
  warnings: string[];
}

/** Thrown when a verification's #TRANS rows do not sum to 0.00. */
export class SieBalanceError extends Error {
  constructor(
    public receiptId: string,
    public sum: number,
  ) {
    super(`Verifikation för kvitto ${receiptId} balanserar inte (summa ${sum.toFixed(2)})`);
    this.name = "SieBalanceError";
  }
}

/**
 * Validate/normalise a Swedish organisationsnummer. Valid = exactly 10 digits
 * (ignoring separators), emitted as NNNNNN-NNNN. Malformed values are returned
 * as-is with `valid: false` so the caller can warn instead of failing —
 * important for test data like "02468-4360" (9 digits).
 */
export function normalizeOrgNumber(raw: string): { value: string; valid: boolean } {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return { value: `${digits.slice(0, 6)}-${digits.slice(6)}`, valid: true };
  }
  return { value: raw, valid: false };
}

function toNumber(n: unknown): number {
  const v = typeof n === "string" ? Number(n) : (n as number);
  return Number.isFinite(v) ? v : 0;
}

function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(date.getTime()) ? null : date;
}

function sieDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Format a signed amount with a dot decimal separator, avoiding "-0.00". */
function amount(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const safe = Object.is(rounded, -0) || rounded === 0 ? 0 : rounded;
  return safe.toFixed(2);
}

/** Quote a SIE text field, escaping backslashes and double quotes per spec. */
function field(s: string | null | undefined): string {
  const cleaned = (s ?? "").replace(/[\r\n\t]+/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${cleaned}"`;
}

function accountName(code: string): string {
  return KNOWN_ACCOUNT_NAMES[code] ?? getBasAccount(code)?.name ?? `Konto ${code}`;
}

interface Trans {
  account: string;
  amount: number;
}

/** Expand a single receipt into its balanced set of transaction rows. */
function receiptToTrans(r: SieReceiptInput, creditAccount: string): Trans[] {
  const gross = toNumber(r.totalAmount);
  const vat = toNumber(r.vatAmount);
  // Compute net from the stored total (not re-derived from the rate) so the
  // three rows always reconcile to gross with no öre drift.
  const net = Math.round((gross - vat) * 100) / 100;
  const cost = r.basCode || DEFAULT_COST_ACCOUNT;

  const rows: Trans[] = [{ account: cost, amount: net }];
  if (vat > 0) rows.push({ account: VAT_INPUT_ACCOUNT, amount: vat });
  rows.push({ account: creditAccount, amount: -gross });
  return rows;
}

/**
 * Build a SIE 4 file from receipts. Pure function: no HTTP/framework concerns,
 * fully unit testable. Every receipt yields exactly one #VER; throws
 * SieBalanceError if any verification fails the zero-sum invariant.
 */
export function buildSie(opts: BuildSieOptions): BuildSieResult {
  const creditAccount = opts.creditAccount || DEFAULT_CREDIT_ACCOUNT;
  const program = opts.program ?? { name: "Kvittino", version: "1.0" };
  const generatedAt = opts.generatedAt ?? new Date();
  const warnings: string[] = [];

  // First pass: build verifications, validate balance, collect used accounts
  // and the span of verification dates (drives #RAR).
  const usedAccounts = new Set<string>();
  const verBlocks: string[] = [];
  let minVerDate: Date | null = null;
  let maxVerDate: Date | null = null;

  opts.receipts.forEach((r, i) => {
    const rows = receiptToTrans(r, creditAccount);
    const sum = rows.reduce((a, t) => a + t.amount, 0);
    if (Math.abs(sum) >= 0.005) throw new SieBalanceError(r.id, sum);

    for (const t of rows) usedAccounts.add(t.account);

    // A verification needs a date; fall back to the upload timestamp.
    let verDate = toDate(r.date);
    if (!verDate) {
      verDate = toDate(r.createdAt) ?? generatedAt;
      warnings.push(`Kvitto ${r.id} saknar datum — använder ${sieDate(verDate)} istället.`);
    }
    if (!minVerDate || verDate < minVerDate) minVerDate = verDate;
    if (!maxVerDate || verDate > maxVerDate) maxVerDate = verDate;

    if (toNumber(r.totalAmount) === 0) {
      warnings.push(`Kvitto ${r.id} har 0 kr i totalbelopp — verifikationen blir tom.`);
    }

    const text = field(r.vendorName || "Kvitto");
    const block = [
      `#VER "${VERIFICATION_SERIES}" "${i + 1}" ${sieDate(verDate)} ${text}`,
      "{",
      ...rows.map((t) => `   #TRANS ${t.account} {} ${amount(t.amount)}`),
      "}",
    ];
    verBlocks.push(block.join("\r\n"));
  });

  // #RAR must cover every #VER date. Merge the requested range (if any) with
  // the actual verification-date span; default to the generation year.
  const from = toDate(opts.from);
  const to = toDate(opts.to);
  let rarStart = minVerDate ?? from ?? new Date(generatedAt.getFullYear(), 0, 1);
  let rarEnd = maxVerDate ?? to ?? new Date(generatedAt.getFullYear(), 11, 31);
  if (from && from < rarStart) rarStart = from;
  if (to && to > rarEnd) rarEnd = to;

  // Header.
  const lines: string[] = [
    "#FLAGGA 0",
    `#PROGRAM ${field(program.name)} ${field(program.version)}`,
    "#FORMAT PC8",
    `#GEN ${sieDate(generatedAt)}`,
    "#SIETYP 4",
  ];

  if (opts.company.orgNumber) {
    const org = normalizeOrgNumber(opts.company.orgNumber);
    if (!org.valid) {
      warnings.push(
        `Ogiltigt organisationsnummer "${opts.company.orgNumber}" (måste vara 10 siffror, NNNNNN-NNNN) — exporterar ändå.`,
      );
    }
    lines.push(`#ORGNR ${org.value}`);
  } else {
    warnings.push("Organisationsnummer saknas — filen exporteras utan #ORGNR.");
  }

  lines.push(`#FNAMN ${field(opts.company.name)}`);
  lines.push(`#RAR 0 ${sieDate(rarStart)} ${sieDate(rarEnd)}`);

  // One #KONTO per distinct account used, in ascending numeric order so a given
  // receipt set always yields byte-identical output (golden-file friendly).
  const sortedAccounts = [...usedAccounts].sort((a, b) => Number(a) - Number(b));
  for (const acc of sortedAccounts) {
    lines.push(`#KONTO ${acc} ${field(accountName(acc))}`);
  }

  const text = [...lines, ...verBlocks].join("\r\n") + "\r\n";

  // Transcode to CP437; surface any lossy substitutions as warnings.
  const { bytes, warnings: encWarnings } = encodeCp437(text);
  summariseEncodingWarnings(encWarnings, warnings);

  return { bytes, text, warnings };
}

function summariseEncodingWarnings(enc: Cp437Warning[], out: string[]): void {
  if (enc.length === 0) return;
  const seen = new Map<string, string>();
  for (const w of enc) seen.set(w.char, w.replacement);
  const parts = [...seen.entries()].map(([c, r]) => `'${c}' → '${r}'`);
  out.push(`CP437 kunde inte koda ${seen.size} tecken; ersatte: ${parts.join(", ")}`);
}
