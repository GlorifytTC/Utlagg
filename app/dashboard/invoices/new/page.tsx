"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeInvoiceTotals, REVERSE_CHARGE_TEXT, type InvoiceLine } from "@/lib/invoice";

const emptyLine = (): InvoiceLine => ({ description: "", quantity: 1, unitPrice: 0, vatRate: 25 });
const kr = (n: number) => n.toFixed(2).replace(".", ",");

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reverseCharge, setReverseCharge] = useState(false);
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [form, setForm] = useState({
    invoiceNumber: "",
    buyerName: "",
    buyerOrgNumber: "",
    buyerVatNumber: "",
    buyerAddress: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    note: "",
  });

  const totals = computeInvoiceTotals(lines, reverseCharge);

  function setLine(i: number, patch: Partial<InvoiceLine>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function save() {
    if (!form.invoiceNumber || !form.buyerName || lines.some((l) => !l.description)) {
      toast.error("Fyll i fakturanummer, kund och alla rader");
      return;
    }
    if (reverseCharge && !form.buyerVatNumber && !form.buyerOrgNumber) {
      toast.error("Vid omvänd skattskyldighet krävs köparens moms-/org.nummer");
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
      toast.success("Faktura sparad");
      router.push(`/dashboard/invoices/${invoice.id}`);
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "Kunde inte spara");
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ny faktura</h1>

      <Card>
        <CardHeader><CardTitle>Kund</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Fakturanummer</Label>
            <Input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="2026-001" /></div>
          <div className="space-y-2"><Label>Kundnamn</Label>
            <Input value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} /></div>
          <div className="space-y-2"><Label>Org.nummer</Label>
            <Input value={form.buyerOrgNumber} onChange={(e) => setForm({ ...form, buyerOrgNumber: e.target.value })} placeholder="556677-8899" /></div>
          <div className="space-y-2"><Label>Momsnummer</Label>
            <Input value={form.buyerVatNumber} onChange={(e) => setForm({ ...form, buyerVatNumber: e.target.value })} placeholder="SE556677889901" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>Adress</Label>
            <Input value={form.buyerAddress} onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })} /></div>
          <div className="space-y-2"><Label>Fakturadatum</Label>
            <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></div>
          <div className="space-y-2"><Label>Förfallodatum</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rader</CardTitle>
          <CardDescription>Pris anges exkl. moms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input className="col-span-5" placeholder="Beskrivning" value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
              <Input className="col-span-2" type="number" min="0" step="0.5" value={l.quantity} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} placeholder="Antal" />
              <Input className="col-span-2" type="number" min="0" step="0.01" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: Number(e.target.value) })} placeholder="à-pris" />
              <select disabled={reverseCharge} className="col-span-2 rounded-lg border border-gray-300 px-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950"
                value={l.vatRate} onChange={(e) => setLine(i, { vatRate: Number(e.target.value) })}>
                <option value={25}>25%</option><option value={12}>12%</option><option value={6}>6%</option><option value={0}>0%</option>
              </select>
              <button className="col-span-1 text-red-600" onClick={() => setLines((ls) => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls)} aria-label="Ta bort rad">×</button>
            </div>
          ))}
          <Button variant="outline" onClick={() => setLines((ls) => [...ls, emptyLine()])}>+ Lägg till rad</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={reverseCharge} onChange={(e) => setReverseCharge(e.target.checked)} className="mt-0.5" />
            <span>Omvänd skattskyldighet (byggtjänster) — fakturan ställs ut utan moms och får texten
              "{REVERSE_CHARGE_TEXT}". Köparens moms-/org.nummer måste anges.</span>
          </label>
          <div className="text-sm">
            <div className="flex justify-between"><span>Summa exkl. moms</span><span>{kr(totals.subtotal)} kr</span></div>
            <div className="flex justify-between"><span>Moms</span><span>{reverseCharge ? "0,00 kr (omvänd)" : `${kr(totals.vatTotal)} kr`}</span></div>
            <div className="flex justify-between font-semibold"><span>Att betala</span><span>{kr(totals.total)} kr</span></div>
          </div>
          <Button onClick={save} disabled={loading}>{loading ? "Sparar…" : "Spara faktura"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
