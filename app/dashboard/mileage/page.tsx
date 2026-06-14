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

interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string | null;
  isElectric: boolean;
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [vForm, setVForm] = useState({ registrationNumber: "", model: "", fuelType: "petrol" });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAllowed(d ? Boolean(d.features?.mileage) : false))
      .catch(() => setAllowed(false));
  }, []);

  const loadVehicles = useCallback(async () => {
    const r = await fetch("/api/company/vehicles");
    if (!r.ok) return;
    const d = await r.json();
    setVehicles(d.vehicles ?? []);
    setIsAdmin(Boolean(d.isAdmin));
  }, []);
  useEffect(() => { loadVehicles(); }, [loadVehicles]);

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
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) || null;
  const effectiveRate = !selectedVehicle ? rate : selectedVehicle.isElectric ? 0.95 : 1.2;
  const preview = (km * effectiveRate).toFixed(2).replace(".", ",");

  async function save() {
    if (!form.startAddress || !form.endAddress || km <= 0) {
      toast.error(t.toastFillAddresses);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/mileage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, distanceKm: km, vehicleId: vehicleId || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(t.toastTripSaved);
      setForm({ ...form, startAddress: "", endAddress: "", distanceKm: "", note: "" });
      load();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? t.toastSaveFail);
    }
  }

  async function addVehicle() {
    if (!vForm.registrationNumber.trim()) return;
    const res = await fetch("/api/company/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vForm),
    });
    if (res.ok) {
      toast.success(t.milVehicleAdded);
      setVForm({ registrationNumber: "", model: "", fuelType: "petrol" });
      loadVehicles();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? t.milVehicleFail);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/mileage/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success(t.toastRemoved); load(); }
  }

  if (allowed === false) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navMileage}</h1>
        <UpsellCard
          title={t.navMileage}
          requiredPlan="Företag"
          description={t.milUpsellDesc}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.navMileage}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t.milRatePre} {rate.toFixed(2).replace(".", ",")} kr/km {t.milRateNote}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.milNewTrip}</CardTitle>
          <CardDescription>{t.milNewTripDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from">{t.fldFrom}</Label>
              <Input id="from" value={form.startAddress} onChange={(e) => setForm({ ...form, startAddress: e.target.value })} placeholder={t.phStartAddress} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">{t.fldTo}</Label>
              <Input id="to" value={form.endAddress} onChange={(e) => setForm({ ...form, endAddress: e.target.value })} placeholder={t.phEndAddress} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km">{t.fldDistance}</Label>
              <Input id="km" type="number" min="0" step="0.1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">{t.fldDate}</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">{t.fldPurpose}</Label>
              <select id="purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950">
                <option value="business">{t.purposeBusiness}</option>
                <option value="private">{t.purposePrivate}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">{t.milVehicle}</Label>
              <select
                id="vehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950"
              >
                <option value="">{t.milPrivateCar} (2,50 kr/km)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber}
                    {v.model ? ` · ${v.model}` : ""}
                    {v.isElectric ? ` · ${t.milElectricTag}` : ""} (
                    {(v.isElectric ? 0.95 : 1.2).toFixed(2).replace(".", ",")} kr/km)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t.fldAmount}</Label>
              <p className="flex h-10 items-center text-lg font-semibold">{preview} kr</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">{t.milVehicleNote}</p>
          <Button onClick={save} disabled={loading}>{loading ? t.stSaving : t.btnSaveTrip}</Button>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{t.milManageVehicles}</CardTitle>
            <CardDescription>{t.milVehicleNote}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicles.length > 0 && (
              <ul className="divide-y text-sm">
                {vehicles.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2">
                    <span>
                      <span className="font-medium">{v.registrationNumber}</span>
                      {v.model ? ` · ${v.model}` : ""}
                      {v.isElectric ? ` · ${t.milElectricTag}` : ""}
                    </span>
                    <button
                      onClick={async () => {
                        const r = await fetch(`/api/company/vehicles/${v.id}`, { method: "DELETE" });
                        if (r.ok) loadVehicles();
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t.milRegNr}</Label>
                <Input
                  value={vForm.registrationNumber}
                  onChange={(e) => setVForm({ ...vForm, registrationNumber: e.target.value })}
                  placeholder="ABC123"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.milModel}</Label>
                <Input
                  value={vForm.model}
                  onChange={(e) => setVForm({ ...vForm, model: e.target.value })}
                  placeholder="Volvo V60"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.milFuel}</Label>
                <select
                  value={vForm.fuelType}
                  onChange={(e) => setVForm({ ...vForm, fuelType: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-950"
                >
                  <option value="petrol">{t.milFuelPetrol}</option>
                  <option value="diesel">{t.milFuelDiesel}</option>
                  <option value="hybrid">{t.milFuelHybrid}</option>
                  <option value="electric">{t.milFuelElectric}</option>
                </select>
              </div>
            </div>
            <Button variant="outline" onClick={addVehicle}>{t.milAddVehicle}</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t.milLog}</CardTitle>
          <a href="/api/mileage/export"><Button variant="outline">{t.btnExportCsv}</Button></a>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500">{t.milNoneYet}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">{t.fldDate}</th><th>{t.fldFrom}</th><th>{t.fldTo}</th><th>{t.milKm}</th><th>{t.fldAmount}</th><th>{t.fldPurpose}</th><th></th>
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
                      <td>{e.purpose === "business" ? t.purposeBusinessShort : t.purposePrivate}</td>
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
        {t.milManualNote}
      </p>
    </div>
  );
}
