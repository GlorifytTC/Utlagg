"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, ClipboardCheck, Clock, FileWarning, ScanLine } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
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
  const [failed, setFailed] = useState(false);
  const [pendingReq, setPendingReq] = useState(0);

  const load = useCallback(() => {
    setFailed(false);
    fetch("/api/accountant/attention")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setFailed(true))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    fetch("/api/accountant/connection-requests?status=pending")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPendingReq(d?.requests?.length ?? 0))
      .catch(() => {});
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

  if (failed || !data) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.todoTitle}</h2>
        <ErrorState onRetry={load} retryLabel={t.retry}>{t.todoLoadError}</ErrorState>
      </section>
    );
  }

  const top = data.clients.filter((c) => c.attention > 0).sort((a, b) => b.attention - a.attention).slice(0, 3);
  const totals = data?.totals ?? { toReview: 0, missingInfo: 0, lowConfidence: 0, pending: 0 };
  const items: StatItem[] = [
    { label: t.todoToReview, value: totals.toReview, icon: ClipboardCheck, href: "/accountant/receipts?filter=review" },
    { label: t.todoMissingInfo, value: totals.missingInfo, icon: FileWarning, href: "/accountant/receipts?filter=missing" },
    { label: t.todoLowConfidence, value: totals.lowConfidence, icon: ScanLine, href: "/accountant/receipts?filter=uncertain" },
    { label: t.todoPending, value: totals.pending, icon: Clock, href: "/accountant/receipts?filter=pending" },
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
      {pendingReq > 0 && (
        <Link href="/accountant/requests" className="panel flex min-h-11 items-center justify-between rounded-2xl px-4 text-sm font-medium text-nordic-600 dark:text-nordic-400">
          {t.pendingRequests}
          <span className="rounded-full bg-nordic-600 px-2 py-0.5 text-xs text-white">{pendingReq}</span>
        </Link>
      )}
      {top.length > 0 && (
        <div>
          <h3 className="mb-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">{t.todoTopClients}</h3>
          <ul className="flex flex-wrap gap-2">
            {top.map((c) => (
              <li key={c.companyId}>
                <Link
                  href={`/accountant/clients/${c.companyId}`}
                  className="panel inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-gray-900 dark:text-white"
                >
                  {c.companyName}
                  <span className="text-xs text-gray-500 dark:text-gray-400">{c.attention}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
