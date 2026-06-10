"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function CsvRangeExport() {
  const now = new Date();
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(iso(now));

  function presetThisMonth() {
    setFrom(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
    setTo(iso(now));
  }
  function presetThisYear() {
    setFrom(iso(new Date(now.getFullYear(), 0, 1)));
    setTo(iso(now));
  }
  function presetLast12() {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    setFrom(iso(d));
    setTo(iso(now));
  }

  function download() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/export/csv?${params.toString()}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportera kvitton (CSV)</CardTitle>
        <CardDescription>Välj en period — t.ex. en månad eller ett helt år.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={presetThisMonth}>Denna månad</Button>
          <Button variant="outline" onClick={presetThisYear}>I år</Button>
          <Button variant="outline" onClick={presetLast12}>Senaste 12 mån</Button>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Från</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Till</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={download}>Ladda ner CSV</Button>
        </div>
      </CardContent>
    </Card>
  );
}
