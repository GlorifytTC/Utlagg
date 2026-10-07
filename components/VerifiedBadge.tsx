"use client";

import { BadgeCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Accountant: pill next to the name once an admin approved their credentials.
 * Firm: compact check beside the firm name, shown when every member is verified.
 */
export function VerifiedBadge({ firm = false }: { firm?: boolean }) {
  const { t } = useLanguage();
  if (firm) {
    return (
      <span title={t.verifiedFirmBadgeTitle} className="inline-flex align-middle text-emerald-600 dark:text-emerald-400">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">{t.verifiedFirmBadgeTitle}</span>
      </span>
    );
  }
  return (
    <span
      title={t.verifiedBadgeTitle}
      className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600/10 px-1.5 py-px text-xs font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
    >
      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
      {t.verifiedBadge}
    </span>
  );
}
