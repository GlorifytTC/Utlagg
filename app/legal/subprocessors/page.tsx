import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import type { Translations } from "@/lib/translations";

export const metadata = { title: "Underbiträden - Kvittino" };

const rows = (t: Translations): [string, string, string, string][] => [
  ["Railway", t.spPurposeHosting, "EU", "-"],
  ["Cloudflare R2", t.spPurposeStorage, "EU/Global", "SCC / DPF"],
  ["Stripe", t.spPurposePayments, "EU/US", "SCC / DPF"],
  ["Brevo", t.spPurposeEmail, "EU", "-"],
  ["Upstash", t.spPurposeRedis, "EU", "-"],
  ["Google (Gemini API)", t.spPurposeAi, "US", "SCC / DPF"],
  ["OpenAI, Mindee, OCR.space, Google Cloud Vision", t.spPurposeFallback, "US/EU", "SCC / DPF"],
];

export default function SubprocessorsPage() {
  const t = getT();
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="break-words font-display text-2xl font-semibold tracking-tight hyphens-auto sm:text-3xl">{t.spTitle}</h1>
      <p className="mt-4 text-ink/70">
        {t.spIntroPre}{" "}
        <Link className="underline underline-offset-2" href="/legal/dpa">
          {t.spIntroLink}
        </Link>
        .
      </p>
      <p className="mt-2 text-sm text-ink/65">{t.spUpdated}</p>

      <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[34rem] text-sm">
        <thead className="text-left text-ink/65">
          <tr>
            <th className="py-2 pr-4">{t.spColVendor}</th>
            <th className="pr-4">{t.spColPurpose}</th>
            <th className="pr-4">{t.spColRegion}</th>
            <th className="pr-4">{t.spColSafeguard}</th>
          </tr>
        </thead>
        <tbody>
          {rows(t).map(([n, p, r, s]) => (
            <tr key={n} className="border-t border-ink/10 align-top">
              <td className="py-2 pr-4 font-medium">{n}</td>
              <td className="pr-4">{p}</td>
              <td className="pr-4 text-ink/60">{r}</td>
              <td className="text-ink/60">{s}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <p className="mt-6 text-sm text-ink/70">
        {t.spNoticePre}{" "}
        <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
          legal@kvittino.se
        </a>
        .
      </p>
    </main>
  );
}
