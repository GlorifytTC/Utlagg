"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { PageHeader } from "@/components/ui/page-header";
import { AccountantFirmStats } from "@/components/accountant/AccountantFirmStats";
import { AccountantWorkQueue } from "@/components/accountant/AccountantWorkQueue";
import { AccountantClientsList } from "@/components/accountant/AccountantClientsList";
import { AccountantActivity } from "@/components/accountant/AccountantActivity";
import { AccountantBoostCard } from "@/components/accountant/AccountantBoostCard";
import { AccountantClientDistribution } from "@/components/accountant/AccountantClientDistribution";

const sectionTitle = "text-lg font-semibold text-gray-900 dark:text-white";

/**
 * Work-focused accountant dashboard. Information architecture, in priority of
 * the accountant's daily need:
 *   1. Key numbers - data-first: totals before the task queue.
 *   2. Work queue ("Att göra") - what needs attention now.
 *   3. Clients - the working list, most-needing-attention first.
 *   4. Activity - real throughput/momentum.
 *   5. Growth ("Väx din byrå") - discovery + boost, demoted secondary.
 * Profile/logo lives in the header avatar menu, not here.
 */
export function AccountantDashboard() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);

  return (
    <div className="max-w-6xl animate-fade-up space-y-10">
      <PageHeader title={t.overviewTitle} subtitle={t.overviewSubtitle} />

      <section className="space-y-3">
        <h2 className={sectionTitle}>{t.firmStatsTitle}</h2>
        <AccountantFirmStats />
        <AccountantClientDistribution />
      </section>

      <AccountantWorkQueue />

      <section className="space-y-3">
        <h2 className={sectionTitle}>{t.clientsTitle}</h2>
        <AccountantClientsList />
      </section>

      <AccountantActivity />

      <section className="space-y-3">
        <h2 className={sectionTitle}>{t.growthTitle}</h2>

        <Suspense fallback={null}>
          <AccountantBoostCard />
        </Suspense>

        <Link
          href="/accountant/marketplace"
          className="panel group flex items-center justify-between gap-4 rounded-2xl p-5 transition duration-300 ease-premium hover:border-nordic-600/30 active:scale-[0.99]"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.marketplaceTitle}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t.marketplaceDesc}</p>
          </div>
          <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-nordic-700 dark:text-nordic-300">
            <span className="hidden sm:inline">{t.marketplaceViewAll}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-nordic-600/10 transition duration-300 ease-premium group-hover:-translate-y-px group-hover:translate-x-0.5">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}
