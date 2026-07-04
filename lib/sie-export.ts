/**
 * SIE 4 export — the de-facto standard import/export format for Swedish
 * accounting software (Fortnox, Visma, Bokio, etc.). We emit a #VER per receipt
 * with two #TRANS rows (cost account debit + VAT debit) balanced against an
 * outlay/credit account. This is a pragmatic supplier-invoice style voucher;
 * the exact BAS accounts should be confirmed with the company's accountant.
 *
 * Spec: https://sie.se/  — SIE files are historically CP437-encoded; we emit
 * UTF-8 which modern programs accept. Amounts use a dot decimal per the format.
 */
import type { Receipt } from "@/db/schema";

const VAT_ACCOUNT: Record<string, string> = {
  "25": "2641", // Ingående moms
  "12": "2641",
  "6": "2641",
};
const DEFAULT_COST_ACCOUNT = "6991"; // Övriga externa kostnader (fallback)
const OUTLAY_ACCOUNT = "2890"; // Övriga kortfristiga skulder (utlägg)

function amt(n: unknown): number {
  const v = typeof n === "string" ? Number(n) : (n as number);
  return Number.isFinite(v) ? v : 0;
}
function sieDate(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
function esc(s: string): string {
  return `"${(s ?? "").replace(/"/g, "'")}"`;
}

export function buildSie(opts: {
  companyName: string;
  orgNumber?: string | null;
  receipts: Receipt[];
  fromYear: number;
}): string {
  const lines: string[] = [];
  lines.push("#FLAGGA 0");
  lines.push('#PROGRAM "Kvittino" 1.0');
  lines.push("#FORMAT PC8");
  lines.push(`#GEN ${sieDate(new Date())}`);
  lines.push("#SIETYP 4");
  lines.push(`#FNAMN ${esc(opts.companyName)}`);
  if (opts.orgNumber) lines.push(`#ORGNR ${opts.orgNumber}`);
  lines.push(`#RAR 0 ${opts.fromYear}0101 ${opts.fromYear}1231`);

  // Account names used.
  lines.push(`#KONTO ${DEFAULT_COST_ACCOUNT} ${esc("Övriga externa kostnader")}`);
  lines.push(`#KONTO 2641 ${esc("Ingående moms")}`);
  lines.push(`#KONTO ${OUTLAY_ACCOUNT} ${esc("Utlägg anställda")}`);

  let ver = 1;
  for (const r of opts.receipts) {
    const gross = amt(r.totalAmount);
    const vat = amt(r.vatAmount);
    const net = Math.round((gross - vat) * 100) / 100;
    const cost = r.basCode || DEFAULT_COST_ACCOUNT;
    const vatAcct = VAT_ACCOUNT[String(r.vatRate ?? "")] ?? "2641";
    const d = sieDate(r.date);
    const text = esc(r.vendorName ?? "Kvitto");

    lines.push(`#VER "U" "${ver}" ${d} ${text}`);
    lines.push("{");
    lines.push(`   #TRANS ${cost} {} ${net.toFixed(2)} ${d} ${text}`);
    if (vat > 0) lines.push(`   #TRANS ${vatAcct} {} ${vat.toFixed(2)} ${d} ${esc("Moms")}`);
    lines.push(`   #TRANS ${OUTLAY_ACCOUNT} {} ${(-gross).toFixed(2)} ${d} ${text}`);
    lines.push("}");
    ver++;
  }

  return lines.join("\r\n") + "\r\n";
}
