"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

interface Attention {
  totals: { toReview: number; missingInfo: number; lowConfidence: number; pending: number };
  clients: Array<{ companyId: string; companyName: string; toReview: number; attention: number }>;
}

/**
 * "Att göra" — the dashboard hero. A real work queue built from
 * GET /api/accountant/attention: receipts to review, missing info, uncertain
 * reads, pending approvals across all clients. This is what an accountant opens
 * the app to answer: "where do I start today?"
 */
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
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-ink">{t.todoTitle}</h2>
        {nothing ? (
          <p className="mt-2 text-sm text-ink/60">{t.todoEmpty}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {rows.map((r) => (
              <div
                key={r.key}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <span className="text-sm text-ink/70">{r.label}</span>
                <span className="text-xl font-semibold text-ink">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
