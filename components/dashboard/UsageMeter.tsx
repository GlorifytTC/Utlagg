"use client";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function UsageMeter({
  used,
  limit,
  tier,
}: {
  used: number;
  limit: number; // -1 = unlimited
  tier: string;
}) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  const near = !unlimited && pct >= 80;

  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border hairline bg-white/60 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-ink/60">{t.scansThisMonth}</p>
        <span className="rounded-full bg-nordic-50 px-2.5 py-0.5 text-xs font-medium text-nordic-600 capitalize">
          {tier}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl">
        {used}
        {unlimited ? (
          <span className="text-base text-ink/40"> / {t.unlimited}</span>
        ) : (
          <span className="text-base text-ink/40"> / {limit}</span>
        )}
      </p>
      {!unlimited && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-fog">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              near ? "bg-amber" : "bg-nordic-600",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {near && (
        <p className="mt-2 text-xs text-amber">
          Snart slut — uppgradera för obegränsade skanningar.
        </p>
      )}
    </div>
  );
}
