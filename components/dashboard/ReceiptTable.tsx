"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { formatSek, formatDate, cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import type { Receipt } from "@/db/schema";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber/15 text-amber",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export function ReceiptTable({ refreshKey }: { refreshKey: number }) {
  const { t } = useLanguage();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const statusLabel: Record<string, string> = {
    pending: t.statusPending,
    approved: t.statusApproved,
    rejected: t.statusRejected,
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/receipts");
      const data = await res.json();
      setReceipts(data.receipts ?? []);
    } catch {
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  // Client-side search over vendor, BAS code and amount.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter((r) =>
      [r.vendorName, r.basCode, r.totalAmount != null ? String(r.totalAmount) : ""]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [receipts, query]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    window.location.href = `/api/export/csv${qs ? `?${qs}` : ""}`;
  }

  async function approve(id: string) {
    await fetch(`/api/receipts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm(t.receiptDeleteConfirm)) return;
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="rounded-2xl border hairline bg-white/60">
      <div className="flex flex-col gap-3 border-b hairline p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{t.navReceipts}</h2>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.receiptSearch}
            className="min-w-[200px] flex-1 rounded-lg border hairline bg-white px-3 py-2 text-sm"
          />
          <div className="flex items-end gap-2">
            <label className="text-xs text-ink/50">
              {t.receiptFrom}
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="block rounded-lg border hairline bg-white px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-ink/50">
              {t.receiptTo}
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="block rounded-lg border hairline bg-white px-2 py-1.5 text-sm" />
            </label>
            <button onClick={exportCsv}
              className="rounded-full border hairline px-4 py-2 text-sm hover:border-ink/40">
              {t.receiptExportCsv}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="p-8 text-center text-sm text-ink/50">{t.receiptLoading}</p>
      ) : filtered.length === 0 ? (
        <p className="p-10 text-center text-sm text-ink/50">
          {receipts.length === 0 ? t.receiptNone : "—"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/45">
                <th className="px-5 py-3 font-medium">{t.colDate}</th>
                <th className="px-5 py-3 font-medium">{t.colVendor}</th>
                <th className="px-5 py-3 font-medium">{t.colBas}</th>
                <th className="px-5 py-3 font-medium">{t.colVat}</th>
                <th className="px-5 py-3 font-medium">{t.colAmount}</th>
                <th className="px-5 py-3 font-medium">{t.colStatus}</th>
                <th className="px-5 py-3 font-medium text-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hairline hover:bg-paper/50">
                  <td className="px-5 py-3">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 font-medium">{r.vendorName ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-ink/70">{r.basCode ?? "—"}</td>
                  <td className="px-5 py-3">
                    {r.vatRate ? `${r.vatRate}%` : "—"}{" "}
                    <span className="text-ink/40">{formatSek(r.vatAmount)}</span>
                  </td>
                  <td className="px-5 py-3">{formatSek(r.totalAmount)}</td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_STYLE[r.status])}>
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {r.status === "pending" && (
                        <button
                          onClick={() => approve(r.id)}
                          className="rounded-full border hairline px-3 py-1 text-xs hover:border-emerald-400 hover:text-emerald-700"
                        >
                          {t.receiptApprove}
                        </button>
                      )}
                      <button
                        onClick={() => remove(r.id)}
                        className="rounded-full border hairline px-3 py-1 text-xs text-red-600 hover:border-red-400"
                      >
                        {t.receiptDelete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
