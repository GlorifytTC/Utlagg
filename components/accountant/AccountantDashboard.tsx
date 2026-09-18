"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { AccountantWorkQueue } from "@/components/accountant/AccountantWorkQueue";
import { AccountantClientsList } from "@/components/accountant/AccountantClientsList";
import { AccountantActivity } from "@/components/accountant/AccountantActivity";
import { AccountantBoostCard } from "@/components/accountant/AccountantBoostCard";

/**
 * Work-focused accountant dashboard. Information architecture, in priority of
 * the accountant's daily need:
 *   1. Work queue ("Att göra") — the hero: what needs attention now.
 *   2. Clients — the working list, most-needing-attention first.
 *   3. Activity — real throughput/momentum.
 *   4. Growth ("Väx din byrå") — discovery + boost, demoted secondary.
 * Profile/logo lives in the header avatar menu, not here.
 */
export function AccountantDashboard() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{t.overviewTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.overviewSubtitle}</p>
      </div>

      {/* 1. Hero work queue */}
      <AccountantWorkQueue />

      {/* 2. Clients — the working list */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.clientsTitle}</h2>
        <AccountantClientsList />
      </section>

      {/* 3. Activity / momentum */}
      <AccountantActivity />

      {/* 4. Growth — demoted */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.growthTitle}</h2>

        <Suspense fallback={null}>
          <AccountantBoostCard />
        </Suspense>

        <div className="flex items-center justify-between rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.marketplaceTitle}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Företag söker revisor direkt i marknadsplatsen.
            </p>
          </div>
          <Link href="/accountant/marketplace" className="shrink-0 text-sm text-nordic-600 hover:underline">
            {t.marketplaceViewAll} →
          </Link>
        </div>
      </section>
    </div>
  );
}
