"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

/** Shown in place of a gated feature when the user's plan doesn't include it. */
export function UpsellCard({
  title,
  requiredPlan,
  description,
}: {
  title: string;
  requiredPlan: string;
  description?: string;
}) {
  const { t } = useLanguage();
  // Billing is owner-only (the page redirects others), so don't link non-owners there.
  const [nonOwner, setNonOwner] = useState(false);
  useEffect(() => {
    fetch("/api/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setNonOwner(!!d?.role && d.role !== "owner"))
      .catch(() => {});
  }, []);
  return (
    <Card>
      <CardHeader>
        <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-nordic-600/10 text-nordic-700 dark:text-nordic-300">
          <Lock className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <CardTitle as="h2">{title}</CardTitle>
        <CardDescription>
          {description ?? t.upsellIncludedIn.replace("{plan}", requiredPlan)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {nonOwner ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.upsellAskOwner}</p>
        ) : (
          <Link href="/dashboard/settings/billing" className={buttonClass()}>
            {t.upsellUpgradeTo.replace("{plan}", requiredPlan)}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
