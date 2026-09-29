"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  computeInvoiceTotals,
  formatSellerAddress,
  hasPaymentMethod,
  REVERSE_CHARGE_TEXT,
  type InvoiceLine,
  type SellerDetails,
} from "@/lib/invoice";
import { useLanguage } from "@/context/LanguageContext";
import { BuyerAutocomplete } from "@/components/BuyerAutocomplete";

const emptyLine = (): InvoiceLine => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
  vatRate: 25,
});
const kr = (n: number) => n.toFixed(2).replace(".", ",");
const plusDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

interface Seller {
  name: string;
  orgNumber?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  invoiceDetails?: SellerDetails | null;
}

export default function NewInvoicePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reverseCharge, setReverseCharge] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [form, setForm] = useState({
    invoiceNumber: "",
    buyerName: "",
    buyerOrgNumber: "",
    buyerVatNumber: "",
    buyerAddress: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: plusDays(new Date().toISOString().slice(0, 10), 30),
    note: "",
  });

  const totals = computeInvoiceTotals(lines, reverseCharge);

  // The seller block is filled server-side from the company; shown here so the
  // user sees what the customer will get before saving.
  useEffect(() => {
    fetch("/api/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSeller(d?.company ?? null))
      .catch(() => {});
  }, []);
  const sellerAddress = seller ? formatSellerAddress(seller) : null;
  const sellerIncomplete = seller && (!sellerAddress || !hasPaymentMethod(seller.invoiceDetails));

  function setLine(i: number, patch: Partial<InvoiceLine>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  const handleBuyerSelect = (buyer: {
    name: string;
    orgNumber?: string | null;
    vatNumber?: string | null;
    address?: string | null;
  }) => {
    setForm((prev) => ({
      ...prev,
      buyerName: buyer.name,
      buyerOrgNumber: buyer.orgNumber ?? prev.buyerOrgNumber,
      buyerVatNumber: buyer.vatNumber ?? prev.buyerVatNumber,
      buyerAddress: buyer.address ?? prev.buyerAddress,
    }));
  };

  const handleBuyerInputChange = (value: string) => {
    setForm((prev) => ({ ...prev, buyerName: value }));
  };

  async function save() {
    if (!form.buyerName || lines.some((l) => !l.description)) {
      toast.error(t.toastFillCustomerRows);
      return;
    }
    if (reverseCharge && !form.buyerVatNumber && !form.buyerOrgNumber) {
      toast.error(t.toastReverseNeedsVat);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, reverseCharge, lineItems: lines }),
    });
    setLoading(false);
    if (res.ok) {
      const { invoice } = await res.json();
      toast.success(t.toastInvoiceSaved);
      router.push(`/dashboard/invoices/${invoice.id}`);
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? t.toastSaveFail);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold text-gray-900 dark:text-white">
        {t.btnNewInvoice}
      </h1>

      {seller && (
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <CardTitle>{t.invFromTitle}</CardTitle>
            <Link href="/dashboard/company" className="text-sm text-nordic-600 underline">
              {t.invFromEdit}
            </Link>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-gray-900 dark:text-white">{seller.name}</p>
            {seller.orgNumber && <p>{t.invOrgNr} {seller.orgNumber}</p>}
            {seller.vatNumber && <p>{t.invVatNr} {seller.vatNumber}</p>}
            {sellerAddress && <p className="whitespace-pre-line">{sellerAddress}</p>}
            {seller.invoiceDetails?.bankgiro && <p>{t.invBankgiro} {seller.invoiceDetails.bankgiro}</p>}
            {seller.invoiceDetails?.plusgiro && <p>{t.invPlusgiro} {seller.invoiceDetails.plusgiro}</p>}
            {seller.invoiceDetails?.iban && <p>{t.invIban} {seller.invoiceDetails.iban}</p>}
            {sellerIncomplete && (
              <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                {t.invFromMissing}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.invCustomer}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t.fldInvoiceNumber}</Label>
            <Input
              value={form.invoiceNumber}
              onChange={(e) =>
                setForm({ ...form, invoiceNumber: e.target.value })
              }
              placeholder={t.phAutoNumber}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.fldCustomerName}</Label>
            <BuyerAutocomplete
              onSelect={handleBuyerSelect}
              onInputChange={handleBuyerInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label>{t.fldOrgNumberShort}</Label>
            <Input
              value={form.buyerOrgNumber}
              onChange={(e) =>
                setForm({ ...form, buyerOrgNumber: e.target.value })
              }
              placeholder="556677-8899"
            />
          </div>
          <div className="space-y-2">
            <Label>{t.fldVatNumberShort}</Label>
            <Input
              value={form.buyerVatNumber}
              onChange={(e) =>
                setForm({ ...form, buyerVatNumber: e.target.value })
              }
              placeholder="SE556677889901"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t.fldAddress}</Label>
            <Input
              value={form.buyerAddress}
              onChange={(e) =>
                setForm({ ...form, buyerAddress: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t.fldIssueDate}</Label>
            <Input
              type="date"
              value={form.issueDate}
              onChange={(e) =>
                setForm({ ...form, issueDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>{t.fldDueDate}</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm({ ...form, dueDate: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.invLines}</CardTitle>
          <CardDescription>{t.invLinesDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-5"
                placeholder={t.phDescription}
                value={l.description}
                onChange={(e) => setLine(i, { description: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                min="0"
                step="0.5"
                value={l.quantity}
                onChange={(e) =>
                  setLine(i, { quantity: Number(e.target.value) })
                }
                placeholder={t.phQuantity}
              />
              <Input
                className="col-span-2"
                type="number"
                min="0"
                step="0.01"
                value={l.unitPrice}
                onChange={(e) =>
                  setLine(i, { unitPrice: Number(e.target.value) })
                }
                placeholder={t.phUnitPrice}
              />
              <select
                disabled={reverseCharge}
                className="col-span-2 rounded-lg border border-gray-300 px-2 text-sm disabled:opacity-50 dark:border-white/[0.10] dark:bg-[#111]"
                value={l.vatRate}
                onChange={(e) =>
                  setLine(i, { vatRate: Number(e.target.value) })
                }
              >
                <option value={25}>25%</option>
                <option value={12}>12%</option>
                <option value={6}>6%</option>
                <option value={0}>0%</option>
              </select>
              <button
                className="col-span-1 text-red-600"
                onClick={() =>
                  setLines((ls) =>
                    ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls
                  )
                }
                aria-label={t.ariaRemoveRow}
              >
                ×
              </button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => setLines((ls) => [...ls, emptyLine()])}
          >
            {t.btnAddRow}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={reverseCharge}
              onChange={(e) => setReverseCharge(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              {t.invReversePre} &quot;{REVERSE_CHARGE_TEXT}&quot;.{" "}
              {t.invReversePost}
            </span>
          </label>
          <div className="text-sm">
            <div className="flex justify-between">
              <span>{t.invSubtotal}</span>
              <span>{kr(totals.subtotal)} kr</span>
            </div>
            <div className="flex justify-between">
              <span>{t.invColVat}</span>
              <span>
                {reverseCharge ? t.invVatReverse : `${kr(totals.vatTotal)} kr`}
              </span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>{t.invToPay}</span>
              <span>{kr(totals.total)} kr</span>
            </div>
          </div>
          <Button onClick={save} disabled={loading}>
            {loading ? t.stSaving : t.btnSaveInvoice}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}