"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeRange, type PresetKey } from "@/lib/export-range";

export type Period = { preset: PresetKey; from: string; to: string };

export const defaultPeriod = (preset: PresetKey = "thisQuarter"): Period => ({
  preset,
  ...computeRange(preset),
});

/** Preset pills; date inputs only appear for "custom". */
export function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const { t } = useLanguage();
  const presets: { key: PresetKey; label: string }[] = [
    { key: "thisMonth", label: t.expThisMonth },
    { key: "lastMonth", label: t.expLastMonth },
    { key: "thisQuarter", label: t.expThisQuarter },
    { key: "lastQuarter", label: t.expLastQuarter },
    { key: "thisYear", label: t.expThisYear },
    { key: "allTime", label: t.expAllTime },
    { key: "custom", label: t.expCustom },
  ];
  const label = "mb-1 block !text-xs text-gray-500 dark:text-gray-400";

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key === "custom" ? { ...value, preset: "custom" } : { preset: p.key, ...computeRange(p.key) })}
            aria-pressed={value.preset === p.key}
            className={`min-h-11 shrink-0 snap-start rounded-full px-4 py-1.5 text-sm sm:min-h-10 font-medium transition duration-300 ease-premium active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 ${
              value.preset === p.key
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "border border-gray-900/15 text-gray-600 hover:border-gray-900/30 dark:border-white/[0.14] dark:text-gray-300 dark:hover:border-white/30"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === "custom" && (
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-end">
          <div>
            <Label htmlFor="exp-from" className={label}>{t.expFrom}</Label>
            <Input id="exp-from" type="date" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} className="sm:!w-auto" />
          </div>
          <div>
            <Label htmlFor="exp-to" className={label}>{t.expTo}</Label>
            <Input id="exp-to" type="date" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} className="sm:!w-auto" />
          </div>
        </div>
      )}
    </div>
  );
}
