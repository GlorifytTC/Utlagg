"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatSek, formatDate, cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import type { Receipt } from "@/db/schema";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  approved: "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  rejected: "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

export function ReceiptTable({ refreshKey }: { refreshKey: number }) {
  const { t } = useLanguage();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
    setRemovingId(id);
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    load();
    setRemovingId(null);
  }

  return (
    <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.07] dark:bg-gray-950/60">
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.img 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={preview} 
              alt="" 
              className="max-h-[90vh] max-w-full rounded-lg" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 border-b border-gray-900/[0.07] p-5 dark:border-white/[0.07]">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-gray-900 dark:text-white">{t.navReceipts}</h2>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.receiptSearch}
            className="min-w-[200px] flex-1 rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 dark:border-white/[0.12] dark:bg-gray-950"
          />
          <div className="flex items-end gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {t.receiptFrom}
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-0.5 block rounded-lg border border-gray-900/[0.12] bg-white px-2 py-1.5 text-sm dark:border-white/[0.12] dark:bg-gray-950" />
            </label>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {t.receiptTo}
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-0.5 block rounded-lg border border-gray-900/[0.12] bg-white px-2 py-1.5 text-sm dark:border-white/[0.12] dark:bg-gray-950" />
            </label>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button onClick={exportCsv} className="rounded-full border border-gray-900/[0.15] px-4 py-2 text-sm hover:border-gray-900/40 dark:border-white/[0.15] dark:hover:border-white/40">
                {t.receiptExportCsv}
              </button>
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
            {t.receiptLoading}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-10 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {receipts.length === 0 ? t.receiptNone : "—"}
          </motion.p>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-600">
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
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-t border-gray-900/[0.07] hover:bg-gray-900/[0.02] dark:border-white/[0.07] dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">{formatDate(r.date)}</td>
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {r.imageUrl && (
                          <img
                            src={r.imageUrl}
                            alt=""
                            onClick={() => setPreview(r.imageUrl!)}
                            className="h-9 w-9 cursor-pointer rounded object-cover ring-1 ring-black/10 transition-transform hover:scale-110 dark:ring-white/10"
                          />
                        )}
                        <span>{r.vendorName ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-500 dark:text-gray-400">{r.basCode ?? "—"}</td>
                    <td className="px-5 py-3">
                      {r.vatRate ? `${r.vatRate}%` : "—"} <span className="text-gray-400 dark:text-gray-600">{formatSek(r.vatAmount)}</span>
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
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => approve(r.id)}
                            className="rounded-full border border-gray-900/[0.15] px-3 py-1 text-xs hover:border-emerald-400 hover:text-emerald-700 dark:border-white/[0.15]"
                          >
                            {t.receiptApprove}
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => remove(r.id)}
                          disabled={removingId === r.id}
                          className={cn(
                            "rounded-full border border-gray-900/[0.15] px-3 py-1 text-xs text-red-600 hover:border-red-400 dark:border-white/[0.15]",
                            removingId === r.id && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          {removingId === r.id ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            </span>
                          ) : (
                            t.receiptDelete
                          )}
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}