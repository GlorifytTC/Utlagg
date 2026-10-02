"use client";

import { useEffect, useState } from "react";
import { CircleCheck, ClipboardCheck, Clock, FileWarning, ScanLine } from "lucide-react";
import { StatGrid, type StatItem } from "@/components/ui/stat";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

interface Attention {
  totals: { toReview: number; missingInfo: number; lowConfidence: number; pending: number };
  clients: Array<{ companyId: string; companyName: string; toReview: number; attention: number }>;
}

export function AccountantWorkQueue() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [data, setData] = useState<Attention | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/accountant/attention")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .finally(() => setLoaded(true));
  }, []);

  // Reserve the space while loading so the page below doesn't jump
  if (!loaded) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.todoTitle}</h2>
        <div className="skeleton h-[116px] rounded-2xl" />
      </section>
    );
  }

  const totals = data?.totals ?? { toReview: 0, missingInfo: 0, lowConfidence: 0, pending: 0 };
  const items: StatItem[] = [
    { label: t.todoToReview, value: totals.toReview, icon: ClipboardCheck, href: "/accountant/receipts?filter=review" },
    { label: t.todoMissingInfo, value: totals.missingInfo, icon: FileWarning, href: "/accountant/receipts?filter=missing" },
    { label: t.todoLowConfidence, value: totals.lowConfidence, icon: ScanLine, href: "/accountant/receipts?filter=uncertain" },
    { label: t.todoPending, value: totals.pending, icon: Clock },
  ].filter((r) => r.value > 0);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.todoTitle}</h2>
      {items.length === 0 ? (
        <div className="panel flex items-center gap-3 rounded-2xl p-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CircleCheck className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t.todoEmpty}</p>
        </div>
      ) : (
        <StatGrid items={items} />
      )}
    </section>
  );
}
