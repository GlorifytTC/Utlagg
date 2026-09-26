import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import type { Translations } from "@/lib/translations";

export const metadata = { title: "Underbiträden — Kvittino" };

const rows = (t: Translations): [string, string, string, string][] => [
  ["Railway", t.spPurposeHosting, "EU", "—"],
  ["Cloudflare R2", t.spPurposeStorage, "EU", "—"],
  ["Stripe", t.spPurposePayments, "EU/US", "SCC / DPF"],
  ["Resend", t.spPurposeEmail, "US", "SCC / DPF"],
  ["Upstash", t.spPurposeRedis, "EU", "—"],
  ["Google Cloud Vision", t.spPurposeOcr, "EU", t.spEuRegion],
];

export default function SubprocessorsPage() {
  const t = getT();
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink dark:text-gray-100">
      <h1 className="font-display text-3xl">{t.spTitle}</h1>
      <p className="mt-4 text-ink/70 dark:text-gray-300">
        {t.spIntroPre}{" "}
        <Link className="underline underline-offset-2" href="/legal/dpa">
          {t.spIntroLink}
        </Link>
        .
      </p>
      <p className="mt-2 text-sm text-ink/50 dark:text-gray-500">{t.spUpdated}</p>

      <table className="mt-8 w-full text-sm">
        <thead className="text-left text-ink/50 dark:text-gray-500">
          <tr>
            <th className="py-2">{t.spColVendor}</th>
            <th>{t.spColPurpose}</th>
            <th>{t.spColRegion}</th>
            <th>{t.spColSafeguard}</th>
          </tr>
        </thead>
        <tbody>
          {rows(t).map(([n, p, r, s]) => (
            <tr key={n} className="border-t border-ink/10 dark:border-white/10 align-top">
              <td className="py-2 font-medium">{n}</td>
              <td>{p}</td>
              <td className="text-ink/60 dark:text-gray-400">{r}</td>
              <td className="text-ink/60 dark:text-gray-400">{s}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-sm text-ink/70 dark:text-gray-300">
        {t.spNoticePre}{" "}
        <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
          legal@kvittino.se
        </a>
        .
      </p>
    </main>
  );
}
