"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { CompanyAccountantAccess } from "@/components/dashboard/CompanyAccountantAccess";
import { CompanyDiscoverySettings } from "@/components/dashboard/CompanyDiscoverySettings";
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
        <>
          <CompanyAccountantAccess />
          <CompanyDiscoverySettings />
        </>
      ) : role === null ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.coCreateDesc}</p>
      ) : null /* ponytail: owner/admin only; plain members see an empty section */}
    </div>
  );
}
