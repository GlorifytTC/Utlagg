"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { AccountantWorkQueue } from "@/components/accountant/AccountantWorkQueue";
import { AccountantClientsList } from "@/components/accountant/AccountantClientsList";
import { AccountantActivity } from "@/components/accountant/AccountantActivity";
import { AccountantDiscovery } from "@/components/accountant/AccountantDiscovery";
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
        <h1 className="text-2xl font-bold text-ink">{t.overviewTitle}</h1>
        <p className="text-ink/60">{t.overviewSubtitle}</p>
      </div>

      {/* 1. Hero work queue */}
      <AccountantWorkQueue />

      {/* 2. Clients — the working list */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">{t.clientsTitle}</h2>
        <AccountantClientsList />
      </section>

      {/* 3. Activity / momentum */}
      <AccountantActivity />

      {/* 4. Growth — demoted */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">{t.growthTitle}</h2>

        <Suspense fallback={null}>
          <AccountantBoostCard />
        </Suspense>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink/80">{t.discoverTitle}</h3>
            <Link href="/accountant/discover" className="text-sm text-nordic-600 hover:underline">
              {t.discoverViewAll} →
            </Link>
          </div>
          <AccountantDiscovery compact />
        </div>
      </section>
    </div>
  );
}
