"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpsellCard } from "@/components/UpsellCard";
import { useLanguage } from "@/context/LanguageContext";

interface Entry {
  id: string;
  startAddress: string;
  endAddress: string;
  distanceKm: string;
  amount: string;
  date: string;
  purpose: string;
}

export default function MileagePage() {
  const { t } = useLanguage();
  const [rate, setRate] = useState(2.5);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState({
    startAddress: "",
    endAddress: "",
    distanceKm: "",
    date: new Date().toISOString().slice(0, 10),
    purpose: "business",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAllowed(d ? Boolean(d.features?.mileage) : false))
      .catch(() => setAllowed(false));
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/mileage");
    if (res.ok) {
      const d = await res.json();
      setEntries(d.entries);
      setRate(d.ratePerKm);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const km = Number(form.distanceKm) || 0;
  const preview = (km * rate).toFixed(2).replace(".", ",");

  async function save() {
    if (!form.startAddress || !form.endAddress || km <= 0) {
      toast.error("Fyll i adresser och sträcka");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/mileage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, distanceKm: km }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Resa sparad");
      setForm({ ...form, startAddress: "", endAddress: "", distanceKm: "", note: "" });
      load();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "Kunde inte spara");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/mileage/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Borttagen"); load(); }
  }

  if (allowed === false) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Milersättning</h1>
        <UpsellCard
          title="Milersättning"
          requiredPlan="Företag"
          description="Registrera resor och få skattefri milersättning (2,50 kr/km) automatiskt uträknad. Ingår i Företag-planen."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Milersättning</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Skattefri sats för egen bil: {rate.toFixed(2).replace(".", ",")} kr/km (25 kr/mil, Skatteverket 2026)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ny resa</CardTitle>
          <CardDescription>Ange sträckan i kilometer. Belopp beräknas automatiskt.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from">Från</Label>
              <Input id="from" value={form.startAddress} onChange={(e) => setForm({ ...form, startAddress: e.target.value })} placeholder="Startadress" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Till</Label>
              <Input id="to" value={form.endAddress} onChange={(e) => setForm({ ...form, endAddress: e.target.value })} placeholder="Slutadress" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km">Sträcka (km)</Label>
              <Input id="km" type="number" min="0" step="0.1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Datum</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Syfte</Label>
              <select id="purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950">
                <option value="business">Tjänsteresa</option>
                <option value="private">Privat</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Belopp</Label>
              <p className="flex h-10 items-center text-lg font-semibold">{preview} kr</p>
            </div>
          </div>
          <Button onClick={save} disabled={loading}>{loading ? t.stSaving : t.btnSaveTrip}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Körjournal</CardTitle>
          <a href="/api/mileage/export"><Button variant="outline">{t.btnExportCsv}</Button></a>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">Inga resor ännu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">Datum</th><th>Från</th><th>Till</th><th>km</th><th>Belopp</th><th>Syfte</th><th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2">{new Date(e.date).toLocaleDateString("sv-SE")}</td>
                      <td className="max-w-[140px] truncate">{e.startAddress}</td>
                      <td className="max-w-[140px] truncate">{e.endAddress}</td>
                      <td>{Number(e.distanceKm).toFixed(0)}</td>
                      <td>{Number(e.amount).toFixed(2).replace(".", ",")} kr</td>
                      <td>{e.purpose === "business" ? "Tjänst" : "Privat"}</td>
                      <td><button onClick={() => remove(e.id)} className="text-red-600 hover:underline">{t.btnDelete}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400">
        Sträckan anges manuellt. Automatisk avståndsberäkning (Google Maps/OpenRouteService)
        kan kopplas in med en API-nyckel — den är inte aktiverad här.
      </p>
    </div>
  );
}
