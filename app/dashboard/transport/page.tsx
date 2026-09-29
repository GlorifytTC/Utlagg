"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatSek } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/ui/page-header";

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
  const providerLabel = (p: Pass) => (p.provider === "Other" ? p.providerOther || "-" : p.provider);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t.trTitle} subtitle={t.trSubtitle} />

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
            <div className="space-y-2">
              <Label htmlFor="tr-type">{t.trType}</Label>
              <Select
                id="tr-type"
                value={form.passType}
                onChange={(e) => setForm({ ...form, passType: e.target.value })}
              >
                <option value="monthly">{t.trTypeMonthly}</option>
                <option value="yearly">{t.trTypeYearly}</option>
                <option value="single">{t.trTypeSingle}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-provider">{t.trProvider}</Label>
              <Select
                id="tr-provider"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p === "Other" ? t.trProviderOtherLabel : p}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {form.provider === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="tr-provider-other">{t.trProviderOtherLabel}</Label>
              <Input
                id="tr-provider-other"
                value={form.providerOther}
                onChange={(e) => setForm({ ...form, providerOther: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tr-amount">{t.trAmount}</Label>
            <Input
              id="tr-amount"
              type="number"
              inputMode="decimal"
              placeholder="970"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tr-from">{t.trValidFrom}</Label>
              <Input
                id="tr-from"
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tr-to">{t.trValidTo}</Label>
              <Input
                id="tr-to"
                type="date"
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.trEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-900/[0.07] text-left text-xs font-medium text-gray-500 dark:border-white/[0.08] dark:text-gray-400">
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
                    <tr key={p.id} className="border-b border-gray-900/[0.06] last:border-0 dark:border-white/[0.07] dark:text-gray-100">
                      <td className="p-2">
                        {new Date(p.validFrom).toLocaleDateString(locale)} -{" "}
                        {new Date(p.validTo).toLocaleDateString(locale)}
                      </td>
                      <td className="p-2">{providerLabel(p)}</td>
                      <td className="p-2 text-right tabular-nums">{formatSek(p.amount)}</td>
                      <td className="p-2 text-right tabular-nums">
                        {p.vatAmount ? formatSek(p.vatAmount) : "-"}
                      </td>
                      <td className="p-2 text-right">
                        {p.isRecurring ? t.trRecurringTag : t.trOnceTag}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => remove(p.id)}
                          aria-label={t.btnDelete}
                          title={t.btnDelete}
                          className="h-8 w-8 !p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </Button>
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
          <a href="/api/transport/export" className={buttonClass("outline")}>
            {t.trExportBtn}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
