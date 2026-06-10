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

export default function SettingsPage() {
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
      res.ok ? "Företagsnamn sparat" : "Kunde inte spara",
    );
    setLoading(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inställningar</h1>

      <Card>
        <CardHeader>
          <CardTitle>Utseende</CardTitle>
          <CardDescription>Välj ljust eller mörkt läge</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={toggleTheme}>
            Byt till {theme === "dark" ? "ljust" : "mörkt"} läge
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Företag</CardTitle>
          <CardDescription>Visas på exporter och underlag</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Företagsnamn</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ditt företag AB" />
          </div>
          <Button onClick={saveCompany} disabled={loading}>
            Spara
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export & integrationer</CardTitle>
          <CardDescription>Ladda ner dina data eller koppla bokföring</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <a href="/api/export/csv">
            <Button variant="outline">Exportera CSV</Button>
          </a>
          <a href="/api/export/pdf">
            <Button variant="outline">Exportera PDF</Button>
          </a>
          <a href="/api/export/sie">
            <Button variant="outline">Exportera SIE (bokföring)</Button>
          </a>
          <a href="/api/integrations/fortnox/auth">
            <Button variant="outline">Koppla Fortnox</Button>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skatteverket-export (PRO)</CardTitle>
          <CardDescription>Välj period och ladda ner alla kvitton med moms och BAS-konto</CardDescription>
        </CardHeader>
        <CardContent>
          <CsvRangeExport />
          <SkatteverketExport />
        </CardContent>
      </Card>
    </div>
  );
}
