"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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

  if (!loaded) return null;

  const totals = data?.totals ?? { toReview: 0, missingInfo: 0, lowConfidence: 0, pending: 0 };
  const nothing =
    totals.toReview + totals.missingInfo + totals.lowConfidence + totals.pending === 0;

  const rows = [
    { key: "toReview", label: t.todoToReview, value: totals.toReview },
    { key: "missingInfo", label: t.todoMissingInfo, value: totals.missingInfo },
    { key: "lowConfidence", label: t.todoLowConfidence, value: totals.lowConfidence },
    { key: "pending", label: t.todoPending, value: totals.pending },
  ].filter((r) => r.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-6 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
    >
      <p className="mb-0.5 text-[9.5px] font-medium uppercase tracking-[0.2em] text-nordic-600">
        {t.todoTitle}
      </p>
      {nothing ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t.todoEmpty}</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-900/[0.07] bg-gray-900/[0.07] dark:border-white/[0.07] dark:bg-white/[0.07]">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {rows.map((r) => (
              <div
                key={r.key}
                className="bg-[#F5F4F0] p-4 dark:bg-[#0D0D0D]"
              >
                <p className="font-display text-[22px] font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
                  {r.value}
                </p>
                <p className="mt-2 text-[9.5px] font-medium uppercase tracking-[0.14em] text-gray-400">
                  {r.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
