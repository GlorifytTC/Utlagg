"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Download, FileSpreadsheet, FileText, Car, Bus } from "lucide-react";

type PresetKey = "thisMonth" | "lastMonth" | "thisQuarter" | "lastQuarter" | "thisYear" | "allTime" | "custom";

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Swedish VAT quarters: Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec —
 * matches how Skatteverket actually structures quarterly VAT reporting,
 * not a generic rolling 3-month window. */
function quarterRange(year: number, quarter: number): { from: Date; to: Date } {
  const startMonth = (quarter - 1) * 3;
  const from = new Date(year, startMonth, 1);
  const to = new Date(year, startMonth + 3, 0); // last day of the quarter
  return { from, to };
}

function computeRange(preset: PresetKey, now = new Date()): { from: string; to: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "thisMonth": {
      const from = new Date(y, m, 1);
      const to = new Date(y, m + 1, 0);
      return { from: toIso(from), to: toIso(to) };
    }
    case "lastMonth": {
      const from = new Date(y, m - 1, 1);
      const to = new Date(y, m, 0);
      return { from: toIso(from), to: toIso(to) };
    }
    case "thisQuarter": {
      const q = Math.floor(m / 3) + 1;
      const { from, to } = quarterRange(y, q);
      return { from: toIso(from), to: toIso(to) };
    }
    case "lastQuarter": {
      const q = Math.floor(m / 3) + 1;
      const { from, to } = q === 1 ? quarterRange(y - 1, 4) : quarterRange(y, q - 1);
      return { from: toIso(from), to: toIso(to) };
    }
    case "thisYear":
      return { from: toIso(new Date(y, 0, 1)), to: toIso(new Date(y, 11, 31)) };
    case "allTime":
      return { from: "2000-01-01", to: toIso(new Date(y, 11, 31)) };
    default:
      return { from: toIso(new Date(y, m, 1)), to: toIso(now) };
  }
}

export function ExportPanel() {
  const { t } = useLanguage();
  const [preset, setPreset] = useState<PresetKey>("thisQuarter");
  const initial = computeRange("thisQuarter");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  function choosePreset(p: PresetKey) {
    setPreset(p);
    if (p !== "custom") {
      const r = computeRange(p);
      setFrom(r.from);
      setTo(r.to);
    }
  }

  const qs = useMemo(() => `?from=${from}&to=${to}`, [from, to]);

  const presets: { key: PresetKey; label: string }[] = [
    { key: "thisMonth", label: t.expThisMonth },
    { key: "lastMonth", label: t.expLastMonth },
    { key: "thisQuarter", label: t.expThisQuarter },
    { key: "lastQuarter", label: t.expLastQuarter },
    { key: "thisYear", label: t.expThisYear },
    { key: "allTime", label: t.expAllTime },
    { key: "custom", label: t.expCustom },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.expPeriodTitle}</CardTitle>
        <CardDescription>{t.expPeriodDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => choosePreset(p.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                preset === p.key
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "border border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/[0.10] dark:text-gray-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t.expFrom}</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPreset("custom");
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/[0.10] dark:bg-[#111]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{t.expTo}</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPreset("custom");
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/[0.10] dark:bg-[#111]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <a href={`/api/export/csv${qs}`}>
            <Button variant="outline" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              {t.btnExportCsv}
            </Button>
          </a>
          <a href={`/api/export/sie${qs}`}>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              {t.btnExportSie}
            </Button>
          </a>
          <a href={`/api/export/pdf${qs}`}>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {t.btnExportPdf}
            </Button>
          </a>
          <a href={`/api/mileage/export${qs}`}>
            <Button variant="outline" className="gap-2">
              <Car className="h-4 w-4" />
              {t.expDownloadMileage}
            </Button>
          </a>
          <a href={`/api/transport/export${qs}`}>
            <Button variant="outline" className="gap-2">
              <Bus className="h-4 w-4" />
              {t.expDownloadTransport}
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
