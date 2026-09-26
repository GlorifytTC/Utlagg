"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

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
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
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
      const { receipt, imageSrc: src } = await res.json();
      setDetail(receipt);
      setImageSrc(src ?? null);
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
        setMsg(t.reSaveError);
        return;
      }
      setMsg(t.reSaved);
      onSaved?.();
    } catch {
      setMsg(t.reSaveError);
    } finally {
      setSaving(false);
    }
  }

  async function toggleReviewed() {
    const next = !reviewed;
    setReviewed(next);
    await save({ reviewed: next });
  }

  if (status === "loading") return <p className="text-sm text-gray-500 dark:text-gray-400">{t.reLoading}</p>;
  if (status === "error" || !detail) return <p className="text-sm text-red-600">{t.reLoadError}</p>;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t.rcColVendor}><Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} /></Field>
          <Field label={t.reCategory}><Input value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
          <Field label={t.reVatSek}><Input value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} inputMode="decimal" /></Field>
          <Field label={t.reVatRate}>
            <select
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              className="w-full rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white"
            >
              <option value="">—</option>
              <option value="6">6</option>
              <option value="12">12</option>
              <option value="25">25</option>
            </select>
          </Field>
          <Field label={t.reBasAccount}><Input value={basCode} onChange={(e) => setBasCode(e.target.value)} /></Field>
          <Field label={t.reNote}><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => save()} disabled={saving}>{saving ? t.settingsSaving : t.settingsSave}</Button>
          <Button variant="outline" onClick={toggleReviewed} disabled={saving}>
            {reviewed ? t.reMarkUnreviewed : t.reMarkReviewed}
          </Button>
          {reviewed && <span className="text-xs text-green-700 dark:text-green-300">{t.reReviewed}</span>}
          {msg && <span className="text-xs text-gray-500 dark:text-gray-400">{msg}</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-3 dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        {imageSrc ? (
          <a href={imageSrc} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={detail.vendorName ?? ""}
              className="w-full rounded-lg object-contain"
            />
          </a>
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-gray-900/[0.03] p-6 text-center text-sm text-gray-400 dark:bg-white/[0.03]">
            {t.reNoImage}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">{label}</label>
      {children}
    </div>
  );
}
