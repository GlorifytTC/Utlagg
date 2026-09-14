"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveCompany() {
    setLoading(true);
    const res = await fetch("/api/user/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: company }),
    });
    toast[res.ok ? "success" : "error"](
      res.ok ? t.toastCompanySaved : t.toastSaveFail,
    );
    setLoading(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">{t.navSettings}</h1>

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
        <div className="space-y-4 bg-[#F5F4F0] px-6 py-4 dark:bg-[#0D0D0D]">
          <div className="space-y-1.5">
            <label htmlFor="company" className="text-xs font-medium uppercase tracking-[0.12em] text-gray-400 dark:text-gray-400">
              {t.fldCompanyName}
            </label>
            <input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t.phCompany}
              className="w-full rounded-xl border border-gray-900/[0.10] bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30 dark:border-white/[0.10] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={saveCompany}
            disabled={loading}
            className="rounded-xl bg-nordic-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-nordic-700 active:scale-[0.98] active:opacity-90 disabled:opacity-60"
          >
            {t.btnSave}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] dark:border-white/[0.08]">
        <div className="border-b border-gray-900/[0.07] bg-[#F5F4F0] px-6 py-4 dark:border-white/[0.08] dark:bg-[#0D0D0D]">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{t.setExportTitle}</p>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t.setExportDesc}</p>
        </div>
        <div className="flex flex-wrap gap-3 bg-[#F5F4F0] px-6 py-4 dark:bg-[#0D0D0D]">
          <Link
            href="/dashboard/export"
            className="flex items-center gap-2 rounded-xl bg-nordic-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-nordic-700 active:scale-[0.98] active:opacity-90"
          >
            <Download className="h-4 w-4" />
            {t.navExport}
          </Link>
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
