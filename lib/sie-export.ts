/**
 * SIE 4 export — the de-facto standard interchange format for Swedish accounting
 * software (Fortnox, Visma, Bokio, …). Each receipt becomes one balanced
 * verification (`#VER`) whose transaction rows (`#TRANS`) sum to exactly 0.00:
 *
 *   1. cost account (receipt BAS code), net of VAT   — debit  (+)
 *   2. input VAT account 2640 (ingående moms)        — debit  (+)   [omitted if 0]
 *   3. payment / credit account                      — credit (−)
 *
 * The credit account depends on HOW the receipt was paid — company card/bank
 * (1930) vs. supplier invoice (2440). Our receipts model does NOT record the
 * payment method, so the credit account is a caller-supplied parameter that
 * defaults to 1930. Confirm this, plus the BAS cost mapping, with the company's
 * accountant.  TODO(accounting): capture payment method per receipt to remove
 * the assumption; employee out-of-pocket outlays would instead credit 2890.
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
}

export interface SieCompany {
  name: string;
  orgNumber: string; // organisationsnummer — required for a valid SIE file
}

export interface BuildSieOptions {
  company: SieCompany;
  receipts: SieReceiptInput[];
  /** Financial-year / export range boundaries (used for #RAR). */
  from: Date;
  to: Date;
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
  /** Encoding transliterations and other non-fatal notes. */
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

function toNumber(n: unknown): number {
  const v = typeof n === "string" ? Number(n) : (n as number);
  return Number.isFinite(v) ? v : 0;
}

function sieDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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
 * Build a SIE 4 file. Pure function: no HTTP/framework concerns, fully unit
 * testable. Throws SieBalanceError if any verification fails the zero-sum
 * invariant.
 */
export function buildSie(opts: BuildSieOptions): BuildSieResult {
  const creditAccount = opts.creditAccount || DEFAULT_CREDIT_ACCOUNT;
  const program = opts.program ?? { name: "Kvittino", version: "1.0" };
  const warnings: string[] = [];

  if (!opts.company.orgNumber) {
    throw new Error("Organisationsnummer saknas — kan inte skapa en giltig SIE-fil.");
  }

  // First pass: build verifications, validate balance, collect used accounts.
  const usedAccounts = new Set<string>();
  const verBlocks: string[] = [];

  opts.receipts.forEach((r, i) => {
    const rows = receiptToTrans(r, creditAccount);
    const sum = rows.reduce((a, t) => a + t.amount, 0);
    if (Math.abs(sum) >= 0.005) throw new SieBalanceError(r.id, sum);

    for (const t of rows) usedAccounts.add(t.account);

    const d = sieDate(r.date);
    const text = field(r.vendorName || "Kvitto");
    const block = [
      `#VER "${VERIFICATION_SERIES}" "${i + 1}" ${d} ${text}`,
      "{",
      ...rows.map((t) => `   #TRANS ${t.account} {} ${amount(t.amount)}`),
      "}",
    ];
    verBlocks.push(block.join("\r\n"));
  });

  // Header.
  const lines: string[] = [
    "#FLAGGA 0",
    `#PROGRAM ${field(program.name)} ${field(program.version)}`,
    "#FORMAT PC8",
    `#GEN ${sieDate(opts.generatedAt ?? new Date())}`,
    "#SIETYP 4",
    `#ORGNR ${opts.company.orgNumber}`,
    `#FNAMN ${field(opts.company.name)}`,
    `#RAR 0 ${sieDate(opts.from)} ${sieDate(opts.to)}`,
  ];

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
