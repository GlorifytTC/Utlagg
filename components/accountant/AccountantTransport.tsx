"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate, formatSek } from "@/lib/utils";
import { StatGrid } from "@/components/ui/stat";

interface PassRow {
  id: string;
  passType: string;
  provider: string;
  providerOther: string | null;
  amount: string;
  vatRate: number;
  vatAmount: string | null;
  validFrom: string;
  validTo: string;
}
interface Summary {
  count: number;
  totalAmount: number;
  totalVat: number;
}

const kr = (n: unknown) => formatSek(Number(n) || 0);

/** Read-only list of a client's public-transport passes, with CSV export. */
export function AccountantTransport({ companyId }: { companyId: string }) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const d = (s: string | null) => (s ? formatDate(s, lang) : "");
  const [rows, setRows] = useState<PassRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/accountant/clients/${companyId}/transport`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setRows(data.passes ?? []);
        setSummary(data.summary ?? null);
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
        body: JSON.stringify({ dataset: "transport", format: "csv" }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kollektivtrafik.csv";
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
  if (status === "error") return <ErrorState>{t.trLoadError}</ErrorState>;
  if (rows.length === 0) {
    return <div className="rounded-2xl panel p-10 text-center text-sm text-gray-500 dark:text-gray-400">{t.trEmpty}</div>;
  }

  const th = "px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400";
  const td = "px-5 py-3 text-sm text-gray-600 dark:text-gray-300";

  return (
    <div className="space-y-4">
      {summary && (
        <div className="space-y-3">
          <StatGrid
            items={[
              { label: t.trTotalAmount, value: kr(summary.totalAmount) },
              { label: t.trTotalVat, value: kr(summary.totalVat) },
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
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {d(r.validFrom)} - {d(r.validTo)}
              </span>
              <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-white">{kr(r.amount)}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {r.passType} · {r.provider === "other" && r.providerOther ? r.providerOther : r.provider}
            </p>
            {r.vatAmount != null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.trColVat}: {kr(r.vatAmount)}
              </p>
            )}
          </li>
        ))}
      </ul>
      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-2xl panel md:block">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-gray-900/[0.06] text-left dark:border-white/[0.06]">
            <tr>
              <th className={th}>{t.trColPeriod}</th>
              <th className={th}>{t.trColType}</th>
              <th className={th}>{t.trColProvider}</th>
              <th className={th}>{t.trColVat}</th>
              <th className={`${th} text-right`}>{t.trColAmount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-900/[0.05] dark:divide-white/[0.05]">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className={td}>{d(r.validFrom)} - {d(r.validTo)}</td>
                <td className={td}>{r.passType}</td>
                <td className={td}>{r.provider === "other" && r.providerOther ? r.providerOther : r.provider}</td>
                <td className={td}>{r.vatAmount != null ? kr(r.vatAmount) : ""}</td>
                <td className={`${td} text-right`}>{kr(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
