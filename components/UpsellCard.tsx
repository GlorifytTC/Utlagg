"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2 text-gray-500">
          <Lock className="h-5 w-5" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>
          {description ?? t.upsellIncludedIn.replace("{plan}", requiredPlan)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard/subscription">
          <Button>{t.upsellUpgradeTo.replace("{plan}", requiredPlan)}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
