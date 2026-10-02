"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.navMarketplace}</CardTitle>
          <CardDescription>{t.setFindAccountants}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/marketplace" className={buttonClass("outline")}>
            {t.navMarketplace}
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </CardContent>
      </Card>
      {role === undefined ? (
        <div className="skeleton h-40 rounded-2xl" aria-busy="true" aria-label={t.loading} />
      ) : canManage ? (
        <CompanyAccountantAccess />
      ) : role === null ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.coCreateDesc}</p>
      ) : null /* ponytail: owner/admin only; plain members see an empty section */}
    </div>
  );
}
