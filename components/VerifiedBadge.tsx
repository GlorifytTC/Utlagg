"use client";

import { BadgeCheck } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/** Shown next to an accountant's name once an admin has approved their credentials. */
export function VerifiedBadge() {
  const { t } = useLanguage();
  return (
    <span
      title={t.verifiedBadgeTitle}
      className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"
    >
      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
      {t.verifiedBadge}
    </span>
  );
}
