"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

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

  const inputCls =
    "rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white";

  return (
    <div className="space-y-6">
      {/* Export controls */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
              {t.rcFrom}
            </label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
              {t.rcTo}
            </label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => doExport("csv")}
              disabled={busy !== null}
              className="rounded-full bg-nordic-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-nordic-700 disabled:opacity-60"
            >
              {busy === "csv" ? t.exExporting : t.exCsv}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => doExport("sie")}
              disabled={busy !== null}
              className="rounded-full border border-gray-900/[0.15] px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-900/30 disabled:opacity-60 dark:border-white/[0.15] dark:text-gray-300"
            >
              {busy === "sie" ? t.exExporting : t.exSie}
            </motion.button>
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      </motion.div>

      {/* History */}
      <div>
        <p className="mb-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
          {t.exHistory}
        </p>
        {histStatus === "loading" ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
          </div>
        ) : histStatus === "error" ? (
          <p className="text-sm text-red-600">{t.exHistoryError}</p>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-8 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:text-gray-400">
            {t.exEmpty}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    {[t.rcColDate, t.exColPeriod, t.exColFormat, t.colReceipts].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400"
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
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {h.createdAt?.slice(0, 10)}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {h.fromDate || h.toDate ? `${h.fromDate ?? "…"} – ${h.toDate ?? "…"}` : t.exAll}
                      </td>
                      <td className="px-5 py-3 text-sm uppercase text-gray-500 dark:text-gray-400">
                        {h.format}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
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
