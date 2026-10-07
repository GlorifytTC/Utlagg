"use client";

import { useLanguage } from "@/context/LanguageContext";
import { formatSek, formatDate } from "@/lib/utils";
import type { ExportPreview } from "@/lib/export-preview";

type Category = "receipts" | "mileage" | "transport";

/** Everything that will be in the export, grouped by category (same row look as RecentReceipts). */
export function ExportList({ preview, selected }: { preview: ExportPreview; selected: Record<Category, boolean> }) {
  const { t } = useLanguage();
  const titles: Record<Category, string> = {
    receipts: t.expDownloadReceipts,
    mileage: t.expDownloadMileage,
    transport: t.expDownloadTransport,
  };
  const cats = (Object.keys(titles) as Category[]).filter((c) => selected[c] && preview[c].count > 0);
  if (cats.length === 0) return null;

  return (
    <div className="space-y-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.expListTitle}</p>
      {cats.map((c) => {
        const s = preview[c];
        return (
          <section key={c} aria-label={titles[c]}>
            <h3 className="mb-1 flex items-baseline justify-between text-sm font-medium text-gray-900 dark:text-white">
              {titles[c]}
              <span className="text-xs font-normal tabular-nums text-gray-500 dark:text-gray-400">{s.count}</span>
            </h3>
            <ul className="max-h-80 divide-y divide-gray-900/[0.06] overflow-y-auto overscroll-contain dark:divide-white/[0.06]">
              {s.items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-white">{it.title || t.unknownVendor}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {it.date ? formatDate(it.date) : "-"}
                      {it.meta && ` ${it.meta}`}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    {formatSek(it.amount)}
                  </p>
                </li>
              ))}
            </ul>
            {s.count > s.items.length && (
              <p className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                {t.expMore.replace("{n}", String(s.count - s.items.length))}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
