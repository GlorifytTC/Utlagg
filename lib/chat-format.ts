import type { Lang } from "@/lib/translations";

const locale = (lang: Lang) => (lang === "sv" ? "sv-SE" : "en-GB");

function daysAgo(d: Date, now: Date) {
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function formatTime(d: Date, lang: Lang) {
  return d.toLocaleTimeString(locale(lang), { hour: "2-digit", minute: "2-digit" });
}

/** Inbox row stamp: time today, "Yesterday", weekday this week, else a short date. */
export function formatListDate(d: Date, lang: Lang, yesterday: string, now = new Date()) {
  const n = daysAgo(d, now);
  if (n <= 0) return formatTime(d, lang);
  if (n === 1) return yesterday;
  if (n < 7) return d.toLocaleDateString(locale(lang), { weekday: "short" });
  return d.toLocaleDateString(locale(lang), {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}

/** Day divider inside a thread: "Today", "Yesterday", else a full date. */
export function formatDayLabel(d: Date, lang: Lang, today: string, yesterday: string, now = new Date()) {
  const n = daysAgo(d, now);
  if (n <= 0) return today;
  if (n === 1) return yesterday;
  return d.toLocaleDateString(locale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(d.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}
