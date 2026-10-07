"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate, formatSek, localeFor } from "@/lib/utils";
import { StatGrid } from "@/components/ui/stat";

interface MileageRow {
  id: string;
  startAddress: string;
  endAddress: string;
  distanceKm: string;
  ratePerKm: string;
  amount: string;
  date: string;
  purpose: string;
  note: string | null;
}
interface Summary {
  count: number;
  totalKm: number;
  totalAmount: number;
}

/** Read-only list of a client's mileage entries (Milersättning), with CSV export. */
export function AccountantMileage({ companyId }: { companyId: string }) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const nf = new Intl.NumberFormat(localeFor(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const kr = (n: unknown) => formatSek(Number(n) || 0);
  const km = (n: unknown) => `${nf.format(Number(n) || 0)} km`;
  const [rows, setRows] = useState<MileageRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/accountant/clients/${companyId}/mileage`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setRows(d.entries ?? []);
        setSummary(d.summary ?? null);
        setStatus("ok");
      })
      .catch(() => setStatus("error"));
  }, [companyId]);

  async function downloadCsv() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset: "mileage", format: "csv" }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "milersattning.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    );
  }
  if (status === "error") return <ErrorState>{t.mlLoadError}</ErrorState>;
  if (rows.length === 0) {
    return <div className="rounded-2xl panel p-10 text-center text-sm text-gray-500 dark:text-gray-400">{t.mlEmpty}</div>;
  }

  const th = "px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400";
  const td = "px-5 py-3 text-sm text-gray-600 dark:text-gray-300";

  return (
    <div className="space-y-4">
      {summary && (
        <div className="space-y-3">
          <StatGrid
            items={[
              { label: t.mlTotalKm, value: km(summary.totalKm) },
              { label: t.mlTotalAmount, value: kr(summary.totalAmount) },
            ]}
          />
          <div className="flex justify-end">
            <Button variant="outline" onClick={downloadCsv} disabled={downloading}>
              <Download className="h-4 w-4" strokeWidth={1.75} />
              {t.exCsv}
            </Button>
          </div>
        </div>
      )}
      {/* Mobile: card list */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="panel space-y-1 rounded-2xl p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(r.date, lang)}</span>
              <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">{kr(r.amount)}</span>
            </div>
            <p className="break-words text-sm text-gray-600 dark:text-gray-300">
              {r.startAddress} → {r.endAddress}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {km(r.distanceKm)} · {r.purpose}
            </p>
          </li>
        ))}
      </ul>
      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-2xl panel md:block">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-gray-900/[0.06] text-left dark:border-white/[0.06]">
            <tr>
              <th className={th}>{t.mlColDate}</th>
              <th className={th}>{t.mlColFrom}</th>
              <th className={th}>{t.mlColTo}</th>
              <th className={th}>{t.mlColKm}</th>
              <th className={th}>{t.mlColPurpose}</th>
              <th className={`${th} text-right`}>{t.mlColAmount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900/[0.05] dark:divide-white/[0.05]">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={td}>{r.date ? formatDate(r.date, lang) : ""}</td>
                <td className={td}>{r.startAddress}</td>
                <td className={td}>{r.endAddress}</td>
                <td className={td}>{km(r.distanceKm)}</td>
                <td className={td}>{r.purpose}</td>
                <td className={`${td} text-right`}>{kr(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
