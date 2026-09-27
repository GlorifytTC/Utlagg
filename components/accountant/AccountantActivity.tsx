"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CalendarRange } from "lucide-react";
import { StatGrid } from "@/components/ui/stat";
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
    <StatGrid
      items={[
        { label: t.activityReviewedWeek, value: week, icon: CalendarCheck },
        { label: t.activityReviewedMonth, value: month ?? 0, icon: CalendarRange },
      ]}
    />
  );
}
