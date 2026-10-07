"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { formatSek, formatDate } from "@/lib/utils";
import { Button, buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UpsellCard } from "@/components/UpsellCard";
import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/ui/page-header";

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

interface Route {
  id: string;
  label: string;
  startAddress: string;
  endAddress: string;
  distanceKm: string;
  purpose: string;
  vehicleId: string | null;
}

export default function MileagePage() {
  const { t, lang } = useLanguage();
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
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeLabel, setRouteLabel] = useState("");
  const [periodFor, setPeriodFor] = useState<string | null>(null);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<{ from: string; to: string; dows: boolean[] }>({
    from: todayStr,
    to: todayStr,
    dows: [true, true, true, true, true, false, false], // Mon..Sun
  });

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

  const loadRoutes = useCallback(async () => {
    const r = await fetch("/api/mileage/routes");
    if (r.ok) setRoutes((await r.json()).routes ?? []);
  }, []);
  useEffect(() => { loadRoutes(); }, [loadRoutes]);

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
  const preview = formatSek(km * effectiveRate);

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

  function isValidSwedishPlate(value: string): boolean {
    const normalized = value.toUpperCase().replace(/\s+/g, "");
    return /^[A-Z]{3}\d{3}$/.test(normalized) || /^[A-Z]{3}\d{2}[A-Z]$/.test(normalized);
  }

  async function addVehicle() {
    if (!vForm.registrationNumber.trim()) return;
    if (!isValidSwedishPlate(vForm.registrationNumber)) {
      toast.error(t.milRegNrInvalid);
      return;
    }
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

  async function saveRoute() {
    if (!form.startAddress || !form.endAddress || km <= 0 || !routeLabel.trim()) {
      toast.error(t.milRouteNeedTrip);
      return;
    }
    const res = await fetch("/api/mileage/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: routeLabel.trim(),
        startAddress: form.startAddress,
        endAddress: form.endAddress,
        distanceKm: km,
        purpose: form.purpose,
        vehicleId: vehicleId || undefined,
      }),
    });
    if (res.ok) {
      toast.success(t.milRouteSaved);
      setRouteLabel("");
      loadRoutes();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? t.toastSaveFail);
    }
  }

  async function logToday(r: Route) {
    const res = await fetch("/api/mileage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAddress: r.startAddress,
        endAddress: r.endAddress,
        distanceKm: Number(r.distanceKm),
        date: new Date().toISOString().slice(0, 10),
        purpose: r.purpose,
        vehicleId: r.vehicleId || undefined,
      }),
    });
    if (res.ok) {
      toast.success(t.milTripsLogged);
      load();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? t.toastSaveFail);
    }
  }

  function datesInPeriod(): string[] {
    const out: string[] = [];
    const from = new Date(period.from);
    const to = new Date(period.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return out;
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dow = (d.getDay() + 6) % 7; // 0 = Mon
      if (period.dows[dow]) out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  async function logPeriod(r: Route) {
    const dates = datesInPeriod();
    if (dates.length === 0) { toast.error(t.milNoDates); return; }
    const res = await fetch("/api/mileage/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAddress: r.startAddress,
        endAddress: r.endAddress,
        distanceKm: Number(r.distanceKm),
        purpose: r.purpose,
        vehicleId: r.vehicleId || undefined,
        dates,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      toast.success(t.milLoggedN.replace("{n}", String(d.created)));
      setPeriodFor(null);
      load();
    }
  }

  async function deleteRoute(id: string) {
    const res = await fetch(`/api/mileage/routes/${id}`, { method: "DELETE" });
    if (res.ok) loadRoutes();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/mileage/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success(t.toastRemoved); load(); }
  }

  if (allowed === false) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader title={t.navMileage} />
        <UpsellCard
          title={t.navMileage}
          requiredPlan={t.planPro}
          description={t.milUpsellDesc}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={t.navMileage}
        subtitle={`${t.milRatePre} ${rate.toFixed(2).replace(".", ",")} kr/km ${t.milRateNote}`}
      />

      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.milNewTrip}</CardTitle>
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
              <Select id="purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                <option value="business">{t.purposeBusiness}</option>
                <option value="private">{t.purposePrivate}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle">{t.milVehicle}</Label>
              <Select
                id="vehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
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
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.fldAmount}</p>
              <p className="flex h-10 items-center font-display text-lg font-semibold tabular-nums" aria-live="polite">{preview}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t.milVehicleNote}</p>
          <Button onClick={save} disabled={loading}>{loading ? t.stSaving : t.btnSaveTrip}</Button>
        </CardContent>
      </Card>

      {/* Recurring / saved routes */}
      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.milRoutesTitle}</CardTitle>
          <CardDescription>{t.milRoutesDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="route-label">{t.milRouteLabel}</Label>
              <Input
                id="route-label"
                value={routeLabel}
                onChange={(e) => setRouteLabel(e.target.value)}
                placeholder={t.milRouteLabelPh}
              />
            </div>
            <Button variant="outline" onClick={saveRoute}>{t.milSaveRoute}</Button>
          </div>

          {routes.length === 0 ? (
            <div className="space-y-2">
              <div className="relative rounded-2xl border border-dashed border-gray-900/15 p-4 opacity-70 dark:border-white/[0.14]">
                <span className="absolute right-3 top-3 rounded-full bg-gray-900/[0.06] px-2 py-0.5 text-xs text-gray-500 dark:bg-white/[0.08] dark:text-gray-400">
                  {t.milExample}
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.milExampleLabel}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t.milExampleFrom} → {t.milExampleTo} · 18,4 km · 2,50 kr/km
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button disabled>{t.milLogToday}</Button>
                    <Button variant="outline" disabled>{t.milLogPeriod}</Button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.milExampleHint}</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {routes.map((r) => {
                const v = vehicles.find((x) => x.id === r.vehicleId) || null;
                const rRate = !v ? 2.5 : v.isElectric ? 0.95 : 1.2;
                const dowLabels = [t.milDowMon, t.milDowTue, t.milDowWed, t.milDowThu, t.milDowFri, t.milDowSat, t.milDowSun];
                const count = periodFor === r.id ? datesInPeriod().length : 0;
                return (
                  <li key={r.id} className="rounded-2xl border border-gray-900/[0.07] p-4 dark:border-white/[0.08]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{r.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {r.startAddress} → {r.endAddress} · {Number(r.distanceKm).toFixed(1)} km ·{" "}
                          {rRate.toFixed(2).replace(".", ",")} kr/km
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={() => logToday(r)}>{t.milLogToday}</Button>
                        <Button
                          variant="outline"
                          onClick={() => setPeriodFor(periodFor === r.id ? null : r.id)}
                        >
                          {t.milLogPeriod}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => deleteRoute(r.id)}
                          aria-label={t.btnDelete}
                          title={t.btnDelete}
                          className="!h-11 !w-11 shrink-0 !p-0 md:!h-10 md:!w-10 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </Button>
                      </div>
                    </div>

                    {periodFor === r.id && (
                      <div className="mt-4 space-y-3 border-t border-gray-900/[0.07] pt-4 dark:border-white/[0.08]">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label htmlFor={`pf-${r.id}`}>{t.milPeriodFrom}</Label>
                            <Input id={`pf-${r.id}`} type="date" value={period.from} onChange={(e) => setPeriod({ ...period, from: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`pt-${r.id}`}>{t.milPeriodTo}</Label>
                            <Input id={`pt-${r.id}`} type="date" value={period.to} onChange={(e) => setPeriod({ ...period, to: e.target.value })} />
                          </div>
                        </div>
                        <div role="group" aria-label={t.milWeekdays}>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.milWeekdays}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {dowLabels.map((d, i) => (
                              <button
                                key={i}
                                type="button"
                                aria-pressed={period.dows[i]}
                                onClick={() => {
                                  const dows = [...period.dows];
                                  dows[i] = !dows[i];
                                  setPeriod({ ...period, dows });
                                }}
                                className={
                                  "h-11 w-11 rounded-full border text-xs transition duration-300 ease-premium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 active:scale-95 md:h-10 md:w-10 " +
                                  (period.dows[i]
                                    ? "border-nordic-600 bg-nordic-600 text-white dark:text-[#050505]"
                                    : "border-gray-900/15 text-gray-500 hover:border-gray-900/30 dark:border-white/[0.14] dark:text-gray-300")
                                }
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Button onClick={() => logPeriod(r)} disabled={count === 0}>
                          {t.milLogN.replace("{n}", String(count))}
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle as="h2">{t.milManageVehicles}</CardTitle>
            <CardDescription>{t.milVehicleNote}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicles.length > 0 && (
              <ul className="divide-y divide-gray-900/[0.06] text-sm dark:divide-white/[0.07]">
                {vehicles.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 py-2 dark:text-gray-100">
                    <span>
                      <span className="font-medium">{v.registrationNumber}</span>
                      {v.model ? ` · ${v.model}` : ""}
                      {v.isElectric ? ` · ${t.milElectricTag}` : ""}
                    </span>
<Button
                      variant="ghost"
                      onClick={async () => {
                        const r = await fetch(`/api/company/vehicles/${v.id}`, { method: "DELETE" });
                        if (r.ok) loadVehicles();
                      }}
                      aria-label={t.btnDelete}
                      title={t.btnDelete}
                      className="!h-11 !w-11 shrink-0 !p-0 md:!h-10 md:!w-10 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="veh-reg">{t.milRegNr}</Label>
                <Input
                  id="veh-reg"
                  value={vForm.registrationNumber}
                  onChange={(e) => setVForm({ ...vForm, registrationNumber: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                  placeholder="ABC123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="veh-model">{t.milModel}</Label>
                <Input
                  id="veh-model"
                  value={vForm.model}
                  onChange={(e) => setVForm({ ...vForm, model: e.target.value })}
                  placeholder="Volvo V60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="veh-fuel">{t.milFuel}</Label>
                <Select
                  id="veh-fuel"
                  value={vForm.fuelType}
                  onChange={(e) => setVForm({ ...vForm, fuelType: e.target.value })}
                >
                  <option value="petrol">{t.milFuelPetrol}</option>
                  <option value="diesel">{t.milFuelDiesel}</option>
                  <option value="hybrid">{t.milFuelHybrid}</option>
                  <option value="electric">{t.milFuelElectric}</option>
                </Select>
              </div>
            </div>
            <Button variant="outline" onClick={addVehicle}>{t.milAddVehicle}</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle as="h2">{t.milLog}</CardTitle>
          <a href="/api/mileage/export" className={buttonClass("outline")}>{t.btnExportCsv}</a>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.milNoneYet}</p>
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-gray-900/[0.07] text-left text-xs font-medium text-gray-500 dark:border-white/[0.08] dark:text-gray-400">
                  <tr>
                    {[t.fldDate, t.fldFrom, t.fldTo, t.milKm, t.fldAmount, t.fldPurpose, ""].map((h, i) => (
                      <th key={i} scope="col" className="px-3 py-3 font-medium">{h || <span className="sr-only">{t.colActions}</span>}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07]">
                  {entries.map((e) => (
                    <tr key={e.id} className="dark:text-gray-100">
                      <td className="whitespace-nowrap px-3 py-3">{formatDate(e.date, lang)}</td>
                      <td className="max-w-[140px] truncate px-3 py-3" title={e.startAddress}>{e.startAddress}</td>
                      <td className="max-w-[140px] truncate px-3 py-3" title={e.endAddress}>{e.endAddress}</td>
                      <td className="px-3 py-3">{Number(e.distanceKm).toFixed(0)}</td>
                      <td className="whitespace-nowrap px-3 py-3 tabular-nums">{formatSek(e.amount)}</td>
                      <td className="px-3 py-3">{e.purpose === "business" ? t.purposeBusinessShort : t.purposePrivate}</td>
                      <td className="px-3 py-3 text-right"><Button
                          variant="ghost"
                          onClick={() => remove(e.id)}
                          aria-label={t.btnDelete}
                          title={t.btnDelete}
                          className="!h-11 !w-11 shrink-0 !p-0 md:!h-10 md:!w-10 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07] md:hidden">
              {entries.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium" title={`${e.startAddress} → ${e.endAddress}`}>
                      {e.startAddress} → {e.endAddress}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(e.date, lang)} · {Number(e.distanceKm).toFixed(0)} km ·{" "}
                      {e.purpose === "business" ? t.purposeBusinessShort : t.purposePrivate}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-medium tabular-nums">{formatSek(e.amount)}</span>
                    <Button
                      variant="ghost"
                      onClick={() => remove(e.id)}
                      aria-label={t.btnDelete}
                      title={t.btnDelete}
                      className="!h-11 !w-11 shrink-0 !p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t.milManualNote}
      </p>
    </div>
  );
}
