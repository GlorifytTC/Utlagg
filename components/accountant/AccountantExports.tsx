"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { fieldClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ExportRow {
  id: string;
  fromDate: string | null;
  toDate: string | null;
  format: string;
  receiptCount: number;
  createdAt: string;
}

export function AccountantExports({ companyId }: { companyId: string }) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<"csv" | "sie" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [history, setHistory] = useState<ExportRow[]>([]);
  const [histStatus, setHistStatus] = useState<"loading" | "ok" | "error">("loading");

  const loadHistory = useCallback(async () => {
    setHistStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}/exports`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHistory(data.exports ?? []);
      setHistStatus("ok");
    } catch {
      setHistStatus("error");
    }
  }, [companyId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function doExport(format: "csv" | "sie") {
    setBusy(format);
    setErr(null);
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, from: from || undefined, to: to || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error ?? t.exFailed);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "csv" ? "kvitton.csv" : "kvittino.se";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      loadHistory();
    } catch {
      setErr(t.exFailed);
    } finally {
      setBusy(null);
    }
  }

  const inputCls = `${fieldClass} h-11 py-2 sm:h-10 sm:!w-auto`;

  return (
    <div className="space-y-6">
      {/* Export controls */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl panel p-6"
      >
        <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
          <div>
            <label htmlFor="ex-from" className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t.rcFrom}
            </label>
            <input id="ex-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ex-to" className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              {t.rcTo}
            </label>
            <input id="ex-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2 sm:flex">
            <Button onClick={() => doExport("csv")} disabled={busy !== null} className="h-11 sm:h-10">
              {busy === "csv" ? t.exExporting : t.exCsv}
            </Button>
            <Button variant="outline" onClick={() => doExport("sie")} disabled={busy !== null} className="h-11 sm:h-10">
              {busy === "sie" ? t.exExporting : t.exSie}
            </Button>
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </motion.div>

      {/* History */}
      <div>
        <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
          {t.exHistory}
        </p>
        {histStatus === "loading" ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : histStatus === "error" ? (
          <p className="text-sm text-red-600">{t.exHistoryError}</p>
        ) : history.length === 0 ? (
          <div className="rounded-2xl panel p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {t.exEmpty}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl panel">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    {[t.rcColDate, t.exColPeriod, t.exColFormat, t.colReceipts].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-xs font-medium sm:px-5 text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr
                      key={h.id}
                      className="border-t border-gray-900/[0.07] transition-colors hover:bg-gray-900/[0.02] dark:border-white/[0.07] dark:hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500 dark:text-gray-400 sm:px-5">
                        {h.createdAt?.slice(0, 10)}
                      </td>
                      <td className="px-3 py-3 text-sm sm:px-5 text-gray-500 dark:text-gray-400">
                        {h.fromDate || h.toDate ? `${h.fromDate ?? "…"} - ${h.toDate ?? "…"}` : t.exAll}
                      </td>
                      <td className="px-3 py-3 text-sm sm:px-5 uppercase text-gray-500 dark:text-gray-400">
                        {h.format}
                      </td>
                      <td className="px-3 py-3 text-sm sm:px-5 text-gray-500 dark:text-gray-400">
                        {h.receiptCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
