"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { downloadExport, fetchFile } from "@/lib/export-download";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatSek, formatDate, localeFor, localDateStr } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  return { from: localDateStr(from), to: localDateStr(to) };
}

export default function TransportPage() {
  const { t, lang } = useLanguage();
  const locale = localeFor(lang);
  const [passes, setPasses] = useState<Pass[]>([]);
  const init = monthRange();
  const [saving, setSaving] = useState(false);
  const [quickAmount, setQuickAmount] = useState("");
  const [del, setDel] = useState<Pass | null>(null);
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
      toast.error(t.trAmountInvalid);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transport/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, amount }),
      });
      if (res.ok) {
        toast.success(t.trSaved);
        fetchPasses();
      } else {
        toast.error(t.trSaveFail);
      }
    } catch {
      toast.error(t.trSaveFail);
    } finally {
      setSaving(false);
    }
  }

  async function exportCsv() {
    try {
      const f = await fetchFile("/api/transport/export", undefined, "transport.csv");
      await downloadExport([f], f.name);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t.somethingWentWrong);
    }
  }

  async function quickAddCurrentMonth() {
    const r = monthRange();
    await save({ passType: "monthly", validFrom: r.from, validTo: r.to, isRecurring: true, amount: quickAmount });
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
          <CardTitle as="h2">{t.trQuickTitle}</CardTitle>
          <CardDescription>{t.trQuickDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="tr-quick-amount">{t.trAmount}</Label>
            <Input
              id="tr-quick-amount"
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="970"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
            />
          </div>
          <Button onClick={quickAddCurrentMonth} disabled={saving}>
            {t.trQuickBtn.replace("{month}", monthLabel)}
          </Button>
        </CardContent>
      </Card>

      {/* New pass */}
      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.trNewTitle}</CardTitle>
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

          <Checkbox
            checked={form.isRecurring}
            onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            label={t.trRecurring}
          />

          <Button onClick={() => save()} disabled={saving}>{t.trSave}</Button>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.trListTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {passes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.trEmpty}</p>
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-900/[0.07] text-left text-xs font-medium text-gray-500 dark:border-white/[0.08] dark:text-gray-400">
                    <th scope="col" className="px-3 py-3 font-medium">{t.trColPeriod}</th>
                    <th scope="col" className="px-3 py-3 font-medium">{t.trColProvider}</th>
                    <th scope="col" className="px-3 py-3 text-right">{t.trColAmount}</th>
                    <th scope="col" className="px-3 py-3 text-right">{t.trColVat}</th>
                    <th scope="col" className="px-3 py-3 text-right">{t.trColStatus}</th>
                    <th scope="col" className="px-3 py-3"><span className="sr-only">{t.colActions}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map((p) => (
                    <tr key={p.id} className="border-b border-gray-900/[0.06] last:border-0 dark:border-white/[0.07] dark:text-gray-100">
                      <td className="px-3 py-3">
                        {formatDate(p.validFrom, lang)} - {formatDate(p.validTo, lang)}
                      </td>
                      <td className="px-3 py-3">{providerLabel(p)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatSek(p.amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {p.vatAmount ? formatSek(p.vatAmount) : "-"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {p.isRecurring ? t.trRecurringTag : t.trOnceTag}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          variant="ghost"
                          onClick={() => setDel(p)}
                          aria-label={`${t.btnDelete}: ${providerLabel(p)} ${formatDate(p.validFrom, lang)}`}
                          title={t.btnDelete}
                          className="!h-11 !w-11 md:!h-10 md:!w-10 !p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.07] md:hidden">
              {passes.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium" title={providerLabel(p)}>{providerLabel(p)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(p.validFrom, lang)} - {formatDate(p.validTo, lang)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.isRecurring ? t.trRecurringTag : t.trOnceTag}
                      {p.vatAmount ? ` · ${t.trColVat}: ${formatSek(p.vatAmount)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-medium tabular-nums">{formatSek(p.amount)}</span>
                    <Button
                      variant="ghost"
                      onClick={() => setDel(p)}
                      aria-label={`${t.btnDelete}: ${providerLabel(p)} ${formatDate(p.validFrom, lang)}`}
                      title={t.btnDelete}
                      className="!h-11 !w-11 md:!h-10 md:!w-10 !p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
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

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle as="h2">{t.trExportTitle}</CardTitle>
          <CardDescription>{t.trExportDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={exportCsv}>
            {t.trExportBtn}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!del}
        title={t.confirmDeleteTitle.replace("{name}", del ? `${providerLabel(del)} ${formatDate(del.validFrom, lang)}` : "")}
        description={t.confirmDeleteDesc}
        confirmLabel={t.btnDelete}
        cancelLabel={t.btnCancel}
        destructive
        onConfirm={async () => { if (del) await remove(del.id); setDel(null); }}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}
