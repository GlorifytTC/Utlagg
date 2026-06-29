"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";

interface Pass {
  id: string;
  passType: string;
  provider: string;
  providerOther: string | null;
  amount: string;
  vatAmount: string | null;
  validFrom: string;
  validTo: string;
  isRecurring: boolean;
}

const PROVIDERS = ["SL", "Västtrafik", "Skånetrafiken", "Other"] as const;

function monthRange(d = new Date()) {
  const from = new Date(d.getFullYear(), d.getMonth(), 1);
  const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function TransportPage() {
  const { t, lang } = useLanguage();
  const locale = lang === "sv" ? "sv-SE" : "en-US";
  const [passes, setPasses] = useState<Pass[]>([]);
  const init = monthRange();
  const [form, setForm] = useState({
    passType: "monthly",
    provider: "SL",
    providerOther: "",
    amount: "",
    validFrom: init.from,
    validTo: init.to,
    isRecurring: true,
  });

  const fetchPasses = useCallback(async () => {
    const res = await fetch("/api/transport/pass");
    if (res.ok) setPasses((await res.json()).passes ?? []);
  }, []);
  useEffect(() => {
    fetchPasses();
  }, [fetchPasses]);

  async function save(overrides?: Partial<typeof form>) {
    const payload = { ...form, ...overrides };
    const amount = parseFloat(payload.amount);
    if (!amount || amount <= 0) {
      toast.error(t.trAmount);
      return;
    }
    const res = await fetch("/api/transport/pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, amount }),
    });
    if (res.ok) {
      toast.success(t.trSaved);
      fetchPasses();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? t.trSaveFail);
    }
  }

  async function quickAddCurrentMonth() {
    const r = monthRange();
    await save({ passType: "monthly", validFrom: r.from, validTo: r.to, isRecurring: true });
  }

  async function remove(id: string) {
    const res = await fetch(`/api/transport/pass/${id}`, { method: "DELETE" });
    if (res.ok) fetchPasses();
  }

  const monthLabel = new Date().toLocaleDateString(locale, { month: "long", year: "numeric" });
  const providerLabel = (p: Pass) => (p.provider === "Other" ? p.providerOther || "—" : p.provider);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.trTitle}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.trSubtitle}</p>
      </div>

      {/* Quick add */}
      <Card>
        <CardHeader>
          <CardTitle>{t.trQuickTitle}</CardTitle>
          <CardDescription>{t.trQuickDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={quickAddCurrentMonth}>
            {t.trQuickBtn.replace("{month}", monthLabel)}
          </Button>
        </CardContent>
      </Card>

      {/* New pass */}
      <Card>
        <CardHeader>
          <CardTitle>{t.trNewTitle}</CardTitle>
          <CardDescription>{t.trVatNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t.trType}</Label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-transparent p-2 dark:border-white/[0.10]"
                value={form.passType}
                onChange={(e) => setForm({ ...form, passType: e.target.value })}
              >
                <option value="monthly">{t.trTypeMonthly}</option>
                <option value="yearly">{t.trTypeYearly}</option>
                <option value="single">{t.trTypeSingle}</option>
              </select>
            </div>
            <div>
              <Label>{t.trProvider}</Label>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-transparent p-2 dark:border-white/[0.10]"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p === "Other" ? t.trProviderOtherLabel : p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.provider === "Other" && (
            <div>
              <Label>{t.trProviderOtherLabel}</Label>
              <Input
                value={form.providerOther}
                onChange={(e) => setForm({ ...form, providerOther: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label>{t.trAmount}</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="970"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t.trValidFrom}</Label>
              <Input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div>
              <Label>{t.trValidTo}</Label>
              <Input
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            />
            {t.trRecurring}
          </label>

          <Button onClick={() => save()}>{t.trSave}</Button>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.trListTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {passes.length === 0 ? (
            <p className="text-sm text-gray-500">{t.trEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="p-2">{t.trColPeriod}</th>
                    <th className="p-2">{t.trColProvider}</th>
                    <th className="p-2 text-right">{t.trColAmount}</th>
                    <th className="p-2 text-right">{t.trColVat}</th>
                    <th className="p-2 text-right">{t.trColStatus}</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">
                        {new Date(p.validFrom).toLocaleDateString(locale)} –{" "}
                        {new Date(p.validTo).toLocaleDateString(locale)}
                      </td>
                      <td className="p-2">{providerLabel(p)}</td>
                      <td className="p-2 text-right">{Number(p.amount).toFixed(2)} kr</td>
                      <td className="p-2 text-right">
                        {p.vatAmount ? `${Number(p.vatAmount).toFixed(2)} kr` : "—"}
                      </td>
                      <td className="p-2 text-right">
                        {p.isRecurring ? t.trRecurringTag : t.trOnceTag}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => remove(p.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>{t.trExportTitle}</CardTitle>
          <CardDescription>{t.trExportDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/api/transport/export">
            <Button variant="outline">{t.trExportBtn}</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
