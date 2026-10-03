/** Neutralize spreadsheet formula injection in a free-text CSV cell. Do NOT use on numeric fields. */
export function csvText(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}
