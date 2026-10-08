"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Store } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { CompanyAccountantAccess } from "@/components/dashboard/CompanyAccountantAccess";
import { SectionHeader } from "@/components/settings/SettingsShell";

export default function CompanyAccountantsPage() {
  const { t } = useLanguage();
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRole(d?.company ? d.role : null))
      .catch(() => setRole(null));
  }, []);

  const canManage = role === "owner" || role === "admin";

  return (
    <div className="space-y-6">
      <SectionHeader title={t.setAccountants} />
      {role === undefined ? (
        <div className="skeleton h-40 rounded-2xl" aria-busy="true" aria-label={t.loading} />
      ) : canManage ? (
        <CompanyAccountantAccess />
      ) : role === null ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.coCreateDesc}</p>
      ) : null /* ponytail: owner/admin only; plain members see an empty section */}
      <Link
        href="/dashboard/marketplace"
        className="panel group flex items-center gap-4 rounded-2xl p-5 transition duration-300 ease-premium hover:border-nordic-600/30 active:scale-[0.99]"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nordic-600/10 text-nordic-700 dark:text-nordic-300">
          <Store className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t.navMarketplace}</span>
          <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">{t.setFindAccountants}</span>
        </span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-500 transition duration-300 ease-premium group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:text-nordic-600 dark:text-gray-400" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
