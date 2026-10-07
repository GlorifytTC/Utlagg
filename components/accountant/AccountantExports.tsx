"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate, formatSek } from "@/lib/utils";
import { CheckCard } from "@/components/ui/check-card";
import { PeriodPicker, defaultPeriod } from "@/components/export/PeriodPicker";
import { ExportList } from "@/components/export/ExportList";
import { downloadExport, fetchFile } from "@/lib/export-download";
import type { ExportPreview } from "@/lib/export-preview";
import { Download, FileText, Car, Bus, Loader2 } from "lucide-react";

type Dataset = "receipts" | "mileage" | "transport";

interface ExportRow {
  id: string;
  fromDate: string | null;
  toDate: string | null;
  format: string;
  receiptCount: number;
  createdAt: string;
}

export function AccountantExports({ companyId }: { companyId: string }) {
  const { lang, t: tt } = useLanguage();
  const t = accountantStrings(lang);
  const [period, setPeriod] = useState(() => defaultPeriod());
  const [selected, setSelected] = useState<Record<Dataset, boolean>>({ receipts: true, mileage: false, transport: false });
  const [format, setFormat] = useState<"csv" | "sie">("csv");
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [busy, setBusy] = useState(false);
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

  const post = (extra: object) =>
    [`/api/accountant/clients/${companyId}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: period.from || undefined, to: period.to || undefined, ...extra }),
    }] as const;

  useEffect(() => {
    const ctl = new AbortController();
    setPreview(null);
    fetch(...post({ preview: true }), )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && !ctl.signal.aborted && setPreview(d))
      .catch(() => {});
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, period.from, period.to]);

  const picked = (Object.keys(selected) as Dataset[]).filter((d) => selected[d]);
  const empty = !!preview && picked.every((d) => preview[d].count === 0);

  async function doExport() {
    setBusy(true);
    setErr(null);
    try {
      const files = [];
      for (const d of picked) {
        const [url, init] = post({ dataset: d, format: d === "receipts" ? format : "csv" });
        files.push(await fetchFile(url, init, d));
      }
      await downloadExport(files, `kvittino-export-${period.from}_${period.to}.zip`);
      loadHistory();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.exFailed);
    } finally {
      setBusy(false);
    }
  }

  const info = (d: Dataset) =>
    !preview ? (
      <span className="skeleton mt-2 block h-4 w-32 rounded" aria-hidden />
    ) : (
      <p className="mt-2 text-xs tabular-nums text-gray-500 dark:text-gray-400">
        {preview[d].count > 0 ? `${tt.expRows.replace("{n}", String(preview[d].count))} · ${formatSek(preview[d].total)}` : tt.expNoRows}
      </p>
    );
  const toggle = (d: Dataset) => (e: React.ChangeEvent<HTMLInputElement>) => setSelected((s) => ({ ...s, [d]: e.target.checked }));

  return (
    <div className="space-y-6">
      {/* Export controls */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 rounded-2xl panel p-4 sm:p-6"
      >
        <PeriodPicker value={period} onChange={setPeriod} />
        <div className="space-y-3">
          <CheckCard title={tt.expDownloadReceipts} description={tt.expReceiptsDesc} icon={<FileText className="h-5 w-5" strokeWidth={1.75} />} checked={selected.receipts} onChange={toggle("receipts")}>
            <div>
              <div role="radiogroup" aria-label={tt.expDownloadReceipts} className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {(["csv", "sie"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={format === f}
                    onClick={() => setFormat(f)}
                    className={`min-h-11 rounded-full border px-3.5 sm:min-h-10 py-1.5 text-sm font-medium transition duration-300 ease-premium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 motion-reduce:transition-none ${
                      format === f
                        ? "border-nordic-600 bg-nordic-600 text-white"
                        : "border-gray-900/15 text-gray-600 hover:border-gray-900/30 dark:border-white/[0.14] dark:text-gray-300"
                    }`}
                  >
                    {f === "csv" ? "CSV" : "SIE"}
                  </button>
                ))}
              </div>
              {info("receipts")}
            </div>
          </CheckCard>
          <CheckCard title={tt.expDownloadMileage} description={tt.expMileageDesc} icon={<Car className="h-5 w-5" strokeWidth={1.75} />} checked={selected.mileage} onChange={toggle("mileage")}>
            {info("mileage")}
          </CheckCard>
          <CheckCard title={tt.expDownloadTransport} description={tt.expTransportDesc} icon={<Bus className="h-5 w-5" strokeWidth={1.75} />} checked={selected.transport} onChange={toggle("transport")}>
            {info("transport")}
          </CheckCard>
        </div>
        {preview && <ExportList preview={preview} selected={selected} />}
        <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-2 border-t border-gray-900/[0.07] bg-[#fffefb]/90 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-white/[0.08] dark:bg-[#0d0d0d]/90 sm:static sm:mx-0 sm:mb-0 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <Button onClick={doExport} disabled={busy || picked.length === 0 || empty} className="w-full sm:w-auto">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={1.75} />}
            {busy ? t.exExporting : tt.expDownloadSelected}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400">{picked.length > 1 ? `${tt.expBundleHint} ` : ""}{t.exSieNote}</p>
        </div>
        {err && <ErrorState>{err}</ErrorState>}
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
          <ErrorState onRetry={loadHistory} retryLabel={t.retry}>{t.exHistoryError}</ErrorState>
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
                        {formatDate(h.createdAt, lang)}
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
