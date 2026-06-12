"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ThemeProvider";
import { SkatteverketExport } from "@/components/SkatteverketExport";
import { CsvRangeExport } from "@/components/dashboard/CsvRangeExport";
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navSettings}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t.setAppearance}</CardTitle>
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
          <CardTitle>{t.navCompany}</CardTitle>
          <CardDescription>{t.setCompanyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">{t.fldCompanyName}</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t.phCompany} />
          </div>
          <Button onClick={saveCompany} disabled={loading}>
            {t.btnSave}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.setExportTitle}</CardTitle>
          <CardDescription>{t.setExportDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a href="/api/export/csv">
            <Button variant="outline">{t.btnExportCsv}</Button>
          </a>
          <a href="/api/export/pdf">
            <Button variant="outline">{t.btnExportPdf}</Button>
          </a>
          <a href="/api/export/sie">
            <Button variant="outline">{t.btnExportSie}</Button>
          </a>
          <a href="/api/integrations/fortnox/auth">
            <Button variant="outline">{t.btnConnectFortnox}</Button>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.setSkvTitle}</CardTitle>
          <CardDescription>{t.setSkvDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <CsvRangeExport />
          <SkatteverketExport />
        </CardContent>
      </Card>
    </div>
  );
}
