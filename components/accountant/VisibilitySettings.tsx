"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { AccountantBoostCard } from "@/components/accountant/AccountantBoostCard";
import { SectionHeader } from "@/components/settings/SettingsShell";
import { buttonClass } from "@/components/ui/button";

export function VisibilitySettings() {
  const { lang } = useLanguage();
  const at = accountantStrings(lang);
  const { data: session } = useSession();
  return (
    <div className="space-y-6">
      <SectionHeader title={at.settingsVisibility} />
      <Suspense fallback={null}>
        <AccountantBoostCard />
      </Suspense>
      <Link
        href={session?.user?.id ? `/accountant/marketplace/${session.user.id}` : "/accountant/marketplace"}
        className={buttonClass("outline")}
      >
        {at.settingsViewProfile}
        <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
