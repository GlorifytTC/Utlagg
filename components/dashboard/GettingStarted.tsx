"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Store, Upload } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const KEY = "kvittino-gs-dismissed";

/** First-run card: one dominant action, two numbered follow-ups, dismissible. */
export function GettingStarted() {
  const { t } = useLanguage();
  const [hidden, setHidden] = useState(true); // start hidden to avoid a flash for returning dismissers
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);
  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };
  const steps = [
    { href: "/dashboard/settings/company", icon: Building2, title: t.dashGsCompany, why: t.dashStepCompanyWhy },
    { href: "/dashboard/marketplace", icon: Store, title: t.dashGsMarketplace, why: t.dashStepAccountantWhy },
  ];

  return (
    <section className="rounded-2xl bg-nordic-50 p-6 dark:bg-nordic-600/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-wide text-nordic-700 dark:text-nordic-300">
          {t.dashGettingStartedKicker}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="-m-2 rounded p-2 text-sm text-gray-500 transition hover:text-gray-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:text-gray-400 dark:hover:text-white"
        >
          {t.dashSkip}
        </button>
      </div>
      <h2 className="mt-1 font-display text-xl font-semibold text-gray-900 dark:text-white">{t.dashFirstTitle}</h2>
      <p className="mt-1 max-w-xl text-sm text-gray-600 dark:text-gray-300">{t.dashFirstWhy}</p>
      <Link
        href="/dashboard/receipts"
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-nordic-600 px-6 text-sm font-medium text-white transition duration-300 ease-premium hover:bg-nordic-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
      >
        <Upload className="h-4 w-4" strokeWidth={1.75} />
        {t.dashFirstCta}
      </Link>

      <p className="mt-6 text-xs font-medium text-gray-500 dark:text-gray-400">{t.dashThenLabel}</p>
      <ol className="mt-2 grid gap-3 sm:grid-cols-2">
        {steps.map(({ href, icon: Icon, title, why }, i) => (
          <li key={href}>
            <Link
              href={href}
              className="panel group flex h-full items-start gap-3 rounded-xl p-4 transition duration-300 ease-premium hover:border-nordic-600/30 active:scale-[0.99]"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-nordic-600/10 text-xs font-semibold text-nordic-700 dark:text-nordic-300">
                {i + 2}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                  <Icon className="h-4 w-4 text-nordic-600" strokeWidth={1.75} />
                  {title}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{why}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
