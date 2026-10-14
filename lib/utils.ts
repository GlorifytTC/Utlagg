/** Format an amount in SEK using Swedish locale. */
export function formatSek(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (n == null || Number.isNaN(n)) return "-";
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 2,
  }).format(n);
}

/** BCP-47 locale for the UI language. */
export function localeFor(lang?: string): string {
  return lang === "en" ? "en-GB" : "sv-SE";
}

export function formatDate(d: Date | string | null | undefined, lang?: string): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(localeFor(lang)).format(date);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Today (or `d`) as YYYY-MM-DD in the browser's LOCAL time zone (toISOString() is UTC and can be off by a day). */
export function localDateStr(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** onKeyDown for a role="tablist": Arrow/Home/End select + focus the neighbouring role="tab". */
export function tabListKeys(e: { key: string; currentTarget: HTMLElement; preventDefault(): void }, index: number, count: number, select: (i: number) => void) {
  const next = e.key === "ArrowRight" ? (index + 1) % count : e.key === "ArrowLeft" ? (index - 1 + count) % count : e.key === "Home" ? 0 : e.key === "End" ? count - 1 : -1;
  if (next < 0) return;
  e.preventDefault();
  select(next);
  e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
}
