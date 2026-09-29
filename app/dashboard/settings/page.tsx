"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { EmailIntakeCard } from "@/components/dashboard/EmailIntakeCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

const arrow = <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />;

export default function SettingsPage() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t.navSettings} />

      <EmailIntakeCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.setAppearance}</CardTitle>
          <CardDescription>{t.setAppearanceDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={toggleTheme}>
            {theme === "dark" ? t.setSwitchToLight : t.setSwitchToDark}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.navCompany}</CardTitle>
          <CardDescription>{t.setCompanyDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/company" className={buttonClass("outline")}>
            {t.navCompany}
            {arrow}
          </Link>
        </CardContent>
      </Card>

      {/* Fortnox goes through the integrations page so the plan gate applies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.setExportTitle}</CardTitle>
          <CardDescription>{t.setExportDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/dashboard/export" className={buttonClass("outline")}>
            {t.navExport}
            {arrow}
          </Link>
          <Link href="/dashboard/integrations" className={buttonClass("outline")}>
            {t.navIntegrations}
            {arrow}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
