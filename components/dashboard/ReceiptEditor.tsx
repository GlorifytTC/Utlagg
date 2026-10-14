"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BasSelect } from "@/components/dashboard/BasSelect";
import { getBasAccount } from "@/lib/bas";
import { useLanguage } from "@/context/LanguageContext";

export interface EditableReceipt {
  id: string;
  vendorName: string | null;
  date: string | null; // YYYY-MM-DD
  totalAmount: string | null;
  vatAmount: string | null;
  vatRate: number | null;
  basCode: string | null;
}

/** Inline edit form for the receipt detail page (PUT /api/receipts/[id]). */
export function ReceiptEditor({ receipt }: { receipt: EditableReceipt }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    vendorName: receipt.vendorName ?? "",
    date: receipt.date ?? "",
    totalAmount: receipt.totalAmount ?? "",
    vatAmount: receipt.vatAmount ?? "",
    vatRate: receipt.vatRate ?? 25,
    basCode: receipt.basCode,
  });

  async function save() {
    const num = (v: string) => Number(v.replace(",", "."));
    const total = num(String(f.totalAmount));
    const vat = num(String(f.vatAmount || "0"));
    if (!Number.isFinite(total) || !Number.isFinite(vat) || total < 0 || vat < 0) {
      toast.error(t.somethingWentWrong);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: f.vendorName,
          date: f.date ? new Date(f.date).toISOString() : undefined,
          totalAmount: total,
          vatAmount: vat,
          vatRate: f.vatRate,
          basCode: f.basCode ?? undefined,
          category: f.basCode ? getBasAccount(f.basCode)?.name : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(t.somethingWentWrong);
    }
    setBusy(false);
  }

  if (!open) {
    return <Button variant="outline" onClick={() => setOpen(true)}>{t.btnEdit}</Button>;
  }
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="re-vendor" className="mb-1.5 block">{t.colVendor}</Label>
        <Input id="re-vendor" value={f.vendorName} onChange={(e) => setF({ ...f, vendorName: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="re-date" className="mb-1.5 block">{t.colDate}</Label>
        <Input id="re-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="re-total" className="mb-1.5 block">{t.colAmount}</Label>
        <Input id="re-total" inputMode="decimal" value={f.totalAmount} onChange={(e) => setF({ ...f, totalAmount: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="re-rate" className="mb-1.5 block">{t.annFieldVatRate}</Label>
        <Select id="re-rate" value={f.vatRate} onChange={(e) => setF({ ...f, vatRate: Number(e.target.value) })}>
          {[0, 6, 12, 25].map((r) => <option key={r} value={r}>{r} %</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="re-vat" className="mb-1.5 block">{t.ruVatSek}</Label>
        <Input id="re-vat" inputMode="decimal" value={f.vatAmount} onChange={(e) => setF({ ...f, vatAmount: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="re-bas" className="mb-1.5 block">{t.colBas}</Label>
        <BasSelect id="re-bas" value={f.basCode} onChange={(c) => setF({ ...f, basCode: c })} />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button onClick={save} disabled={busy}>{busy ? "…" : t.btnSave}</Button>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>{t.btnCancel}</Button>
      </div>
    </div>
  );
}
