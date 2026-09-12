"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReceiptDetail {
  id: string;
  vendorName: string | null;
  category: string | null;
  vatAmount: string | null;
  vatRate: number | null;
  basCode: string | null;
  note: string | null;
  reviewedAt: string | null;
}

/**
 * Inline editor for a single receipt. Loads via
 * GET /api/accountant/clients/[id]/receipts/[receiptId] and saves the
 * WHITELISTED fields via PATCH — exactly the fields the API allows
 * (category, vatAmount, vatRate, basCode, vendorName, note) plus the
 * `reviewed` action. No controls exist for non-editable fields.
 */
export function AccountantReceiptEditor({
  companyId,
  receiptId,
  onSaved,
}: {
  companyId: string;
  receiptId: string;
  onSaved?: () => void;
}) {
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Editable field state
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [vatRate, setVatRate] = useState("");
  const [basCode, setBasCode] = useState("");
  const [note, setNote] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}/receipts/${receiptId}`);
      if (!res.ok) throw new Error();
      const { receipt } = await res.json();
      setDetail(receipt);
      setVendorName(receipt.vendorName ?? "");
      setCategory(receipt.category ?? "");
      setVatAmount(receipt.vatAmount ?? "");
      setVatRate(receipt.vatRate != null ? String(receipt.vatRate) : "");
      setBasCode(receipt.basCode ?? "");
      setNote(receipt.note ?? "");
      setReviewed(Boolean(receipt.reviewedAt));
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [companyId, receiptId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(extra?: Record<string, unknown>) {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        vendorName: vendorName || null,
        category: category || null,
        vatAmount: vatAmount === "" ? null : Number(vatAmount),
        vatRate: vatRate === "" ? null : Number(vatRate),
        basCode: basCode || null,
        note: note || null,
        ...extra,
      };
      const res = await fetch(`/api/accountant/clients/${companyId}/receipts/${receiptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setMsg("Kunde inte spara.");
        return;
      }
      setMsg("Sparat.");
      onSaved?.();
    } catch {
      setMsg("Kunde inte spara.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleReviewed() {
    const next = !reviewed;
    setReviewed(next);
    await save({ reviewed: next });
  }

  if (status === "loading") return <p className="text-sm text-ink/50">Laddar kvitto…</p>;
  if (status === "error" || !detail) return <p className="text-sm text-red-600">Kunde inte ladda kvittot.</p>;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Leverantör"><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} /></Field>
        <Field label="Kategori"><Input value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
        <Field label="Moms (SEK)"><Input value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} inputMode="decimal" /></Field>
        <Field label="Momssats (%)">
          <select
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-white/[0.12]"
          >
            <option value="">—</option>
            <option value="6">6</option>
            <option value="12">12</option>
            <option value="25">25</option>
          </select>
        </Field>
        <Field label="BAS-konto"><Input value={basCode} onChange={(e) => setBasCode(e.target.value)} /></Field>
        <Field label="Notering"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => save()} disabled={saving}>{saving ? "Sparar…" : "Spara"}</Button>
        <Button variant="outline" onClick={toggleReviewed} disabled={saving}>
          {reviewed ? "Markera som ogranskad" : "Markera som granskad"}
        </Button>
        {reviewed && <span className="text-xs text-green-700 dark:text-green-300">✓ Granskad</span>}
        {msg && <span className="text-xs text-ink/60">{msg}</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-ink/50">{label}</label>
      {children}
    </div>
  );
}
