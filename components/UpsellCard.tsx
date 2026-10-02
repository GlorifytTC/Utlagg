"use client";

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
  return (
    <Card>
      <CardHeader>
        <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-nordic-600/10 text-nordic-700 dark:text-nordic-300">
          <Lock className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description ?? t.upsellIncludedIn.replace("{plan}", requiredPlan)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard/settings/billing" className={buttonClass()}>
          {t.upsellUpgradeTo.replace("{plan}", requiredPlan)}
        </Link>
      </CardContent>
    </Card>
  );
}
