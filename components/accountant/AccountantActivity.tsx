"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

/**
 * "Din aktivitet" — real throughput (receipts this accountant reviewed this
 * week / month), from GET /api/accountant/attention. Honest momentum, not a
 * fabricated streak.
 */
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
  if (week === 0 && month === 0) return null; // nothing to celebrate yet — stay quiet

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-8 p-6">
        <div>
          <p className="text-2xl font-semibold text-ink">{week}</p>
          <p className="text-sm text-ink/50">{t.activityReviewedWeek}</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-ink">{month}</p>
          <p className="text-sm text-ink/50">{t.activityReviewedMonth}</p>
        </div>
      </CardContent>
    </Card>
  );
}
