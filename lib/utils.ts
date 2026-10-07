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
