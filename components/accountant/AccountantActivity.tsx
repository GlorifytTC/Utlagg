"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

export function AccountantActivity() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [week, setWeek] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/accountant/attention")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.activity) {
          setWeek(d.activity.reviewedWeek ?? 0);
          setMonth(d.activity.reviewedMonth ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  if (week === null) return null;
  if (week === 0 && month === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-gray-900/[0.07] dark:border-white/[0.07] dark:bg-white/[0.07]"
    >
      <div className="grid grid-cols-2">
        {[
          { value: week, label: t.activityReviewedWeek },
          { value: month, label: t.activityReviewedMonth },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#F5F4F0] p-5 dark:bg-[#0D0D0D]"
          >
            <p className="font-display text-[22px] font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              {s.value}
            </p>
            <p className="mt-2 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
