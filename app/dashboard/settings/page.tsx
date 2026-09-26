"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { EmailIntakeCard } from "@/components/dashboard/EmailIntakeCard";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">{t.navSettings}</h1>

      <EmailIntakeCard />

      <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] dark:border-white/[0.08]">
        <div className="border-b border-gray-900/[0.07] bg-[#F5F4F0] px-6 py-4 dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.setAppearance}</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t.setAppearanceDesc}</p>
        </div>
        <div className="bg-[#F5F4F0] px-6 py-4 dark:bg-[#0D0D0D]">
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-gray-900/[0.10] px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-900/[0.20] hover:bg-gray-900/[0.04] active:scale-[0.98] active:opacity-80 dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-white/[0.06]"
          >
            {theme === "dark" ? t.setSwitchToLight : t.setSwitchToDark}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] dark:border-white/[0.08]">
        <div className="border-b border-gray-900/[0.07] bg-[#F5F4F0] px-6 py-4 dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.navCompany}</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t.setCompanyDesc}</p>
        </div>
        <div className="bg-[#F5F4F0] px-6 py-4 dark:bg-[#0D0D0D]">
          <Link
            href="/dashboard/company"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-900/[0.10] px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-900/[0.20] hover:bg-gray-900/[0.04] dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-white/[0.06]"
          >
            {t.navCompany} →
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] dark:border-white/[0.08]">
        <div className="border-b border-gray-900/[0.07] bg-[#F5F4F0] px-6 py-4 dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.setExportTitle}</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t.setExportDesc}</p>
        </div>
        <div className="flex flex-wrap gap-3 bg-[#F5F4F0] px-6 py-4 dark:bg-[#0D0D0D]">
          <a
            href="/api/integrations/fortnox/auth"
            className="rounded-xl border border-gray-900/[0.10] px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-900/[0.20] hover:bg-gray-900/[0.04] active:scale-[0.98] active:opacity-80 dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-white/[0.06]"
          >
            {t.btnConnectFortnox}
          </a>
        </div>
      </div>
    </div>
  );
}
