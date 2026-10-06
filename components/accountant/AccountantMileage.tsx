"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { buttonClass } from "@/components/ui/button";
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

const nf = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const kr = (n: unknown) => `${nf.format(Number(n) || 0)} kr`;
const km = (n: unknown) => `${nf.format(Number(n) || 0)} km`;

/** Read-only list of a client's mileage entries (Milersättning), with CSV export. */
export function AccountantMileage({ companyId }: { companyId: string }) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
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
  if (status === "error") return <p className="text-sm text-red-600">{t.mlLoadError}</p>;
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
            <button onClick={downloadCsv} disabled={downloading} className={buttonClass("outline")}>
              <Download className="h-4 w-4" strokeWidth={1.75} />
              {t.exCsv}
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl panel">
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
                <td className={td}>{r.date ? new Date(r.date).toLocaleDateString("sv-SE") : ""}</td>
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
