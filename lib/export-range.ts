export type PresetKey =
  | "thisMonth"
  | "lastMonth"
  | "thisQuarter"
  | "lastQuarter"
  | "thisYear"
  | "allTime"
  | "custom";

/** Local-calendar YYYY-MM-DD (toISOString shifts a day in zones ahead of UTC). */
export function toIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Swedish VAT quarters: Q1 Jan-Mar ... Q4 Oct-Dec. */
function quarterRange(year: number, quarter: number): { from: Date; to: Date } {
  const startMonth = (quarter - 1) * 3;
  return { from: new Date(year, startMonth, 1), to: new Date(year, startMonth + 3, 0) };
}

export function computeRange(preset: PresetKey, now = new Date()): { from: string; to: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const q = Math.floor(m / 3) + 1;
  let r: { from: Date; to: Date };
  switch (preset) {
    case "thisMonth":
      r = { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) };
      break;
    case "lastMonth":
      r = { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
      break;
    case "thisQuarter":
      r = quarterRange(y, q);
      break;
    case "lastQuarter":
      r = q === 1 ? quarterRange(y - 1, 4) : quarterRange(y, q - 1);
      break;
    case "thisYear":
      r = { from: new Date(y, 0, 1), to: new Date(y, 11, 31) };
      break;
    case "allTime":
      r = { from: new Date(2000, 0, 1), to: new Date(y, 11, 31) };
      break;
    default:
      r = { from: new Date(y, m, 1), to: now };
  }
  return { from: toIso(r.from), to: toIso(r.to) };
}

/** ?from=&to= (YYYY-MM-DD, inclusive). Invalid values are ignored. */
export function parseRange(sp: URLSearchParams): { from: Date | null; to: Date | null } {
  const f = sp.get("from");
  const t = sp.get("to");
  const from = f && !Number.isNaN(Date.parse(f)) ? new Date(f) : null;
  const to = t && !Number.isNaN(Date.parse(t)) ? new Date(t) : null;
  if (to) to.setHours(23, 59, 59, 999);
  return { from, to };
}
