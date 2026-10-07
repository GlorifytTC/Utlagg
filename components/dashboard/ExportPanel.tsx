"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCard } from "@/components/ui/check-card";
import { PeriodPicker, defaultPeriod } from "@/components/export/PeriodPicker";
import { useLanguage } from "@/context/LanguageContext";
import { downloadFile } from "@/lib/export-download";
import type { ExportPreview } from "@/lib/export-preview";
import { Download, FileText, Car, Bus, Lock, Loader2 } from "lucide-react";

type Category = "receipts" | "mileage" | "transport";
type Format = "csv" | "sie" | "pdf";

const fmtSek = (n: number) => `${n.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} kr`;

export function ExportPanel({ locked }: { locked: { sie: boolean; pdf: boolean } }) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState(() => defaultPeriod());
  const [selected, setSelected] = useState<Record<Category, boolean>>({ receipts: true, mileage: false, transport: false });
  const [format, setFormat] = useState<Format>("csv");
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qs = `?from=${period.from}&to=${period.to}`;

  useEffect(() => {
    const ctl = new AbortController();
    setPreview(null);
    fetch(`/api/export/preview${qs}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPreview(d))
      .catch(() => {});
    return () => ctl.abort();
  }, [qs]);

  const urls: Record<Category, string> = {
    receipts: `/api/export/${format}${qs}`,
    mileage: `/api/mileage/export${qs}`,
    transport: `/api/transport/export${qs}`,
  };
  const picked = (Object.keys(selected) as Category[]).filter((c) => selected[c]);

  async function download() {
    setBusy(true);
    setErr(null);
    try {
      for (const c of picked) await downloadFile(urls[c], undefined, `${c}.${c === "receipts" ? format : "csv"}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.expFailed);
    } finally {
      setBusy(false);
    }
  }

  const info = (c: Category) => {
    const p = preview?.[c];
    if (!preview) return <span className="skeleton mt-2 block h-4 w-32 rounded" aria-hidden />;
    return (
      <p className="mt-2 text-xs tabular-nums text-gray-500 dark:text-gray-400">
        {p && p.count > 0 ? `${t.expRows.replace("{n}", String(p.count))} · ${fmtSek(p.total)}` : t.expNoRows}
      </p>
    );
  };
  const empty = !!preview && picked.every((c) => preview[c].count === 0);

  const formats: { key: Format; label: string; lock: boolean; icon: React.ReactNode }[] = [
    { key: "csv", label: t.btnExportCsv, lock: false, icon: <FileText className="h-4 w-4" strokeWidth={1.75} /> },
    { key: "sie", label: t.btnExportSie, lock: locked.sie, icon: <FileText className="h-4 w-4" strokeWidth={1.75} /> },
    { key: "pdf", label: t.btnExportPdf, lock: locked.pdf, icon: <Download className="h-4 w-4" strokeWidth={1.75} /> },
  ];

  const toggle = (c: Category) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelected((s) => ({ ...s, [c]: e.target.checked }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.expPeriodTitle}</CardTitle>
          <CardDescription>{t.expPeriodDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <PeriodPicker value={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.expCategories}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CheckCard
            title={t.expDownloadReceipts}
            description={t.expReceiptsDesc}
            icon={<FileText className="h-5 w-5" strokeWidth={1.75} />}
            checked={selected.receipts}
            onChange={toggle("receipts")}
          >
            <div>
              <div role="radiogroup" aria-label={t.expDownloadReceipts} className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                {formats.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    role="radio"
                    aria-checked={format === f.key}
                    disabled={f.lock}
                    onClick={() => setFormat(f.key)}
                    title={f.lock ? t.expLockedHint : undefined}
                    className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3.5 sm:min-h-10 py-1.5 text-sm font-medium transition duration-300 ease-premium motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                      format === f.key
                        ? "border-nordic-600 bg-nordic-600 text-white"
                        : "border-gray-900/15 text-gray-600 hover:border-gray-900/30 dark:border-white/[0.14] dark:text-gray-300"
                    }`}
                  >
                    {f.lock ? <Lock className="h-3.5 w-3.5" strokeWidth={2} /> : f.icon}
                    {f.label}
                  </button>
                ))}
              </div>
              {(locked.sie || locked.pdf) && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.expLockedHint}</p>}
              {info("receipts")}
            </div>
          </CheckCard>

          <CheckCard
            title={t.expDownloadMileage}
            description={t.expMileageDesc}
            icon={<Car className="h-5 w-5" strokeWidth={1.75} />}
            checked={selected.mileage}
            onChange={toggle("mileage")}
          >
            {info("mileage")}
          </CheckCard>

          <CheckCard
            title={t.expDownloadTransport}
            description={t.expTransportDesc}
            icon={<Bus className="h-5 w-5" strokeWidth={1.75} />}
            checked={selected.transport}
            onChange={toggle("transport")}
          >
            {info("transport")}
          </CheckCard>

          <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-2 border-t border-gray-900/[0.07] bg-[#fffefb]/90 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-white/[0.08] dark:bg-[#0d0d0d]/90 sm:static sm:mx-0 sm:mb-0 sm:flex-row sm:items-center sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2 sm:backdrop-blur-none">
            <Button onClick={download} disabled={busy || picked.length === 0 || empty} className="w-full sm:w-auto">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={1.75} />}
              {busy ? t.expDownloading : t.expDownloadSelected}
            </Button>
            {picked.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400">{t.expSelectOne}</p>}
            {empty && picked.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400">{t.expNoRows}</p>}
          </div>
          {err && (
            <p role="alert" className="text-sm text-red-600">
              {err}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
