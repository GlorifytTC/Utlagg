"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatSek, formatDate, cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import type { Receipt } from "@/db/schema";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  approved: "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  rejected: "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

type SortKey = "date" | "vendor" | "bas" | "vat" | "amount" | "status";

function sortValue(r: Receipt, key: SortKey): string | number | null {
  switch (key) {
    case "date":
      return r.date ? new Date(r.date).getTime() : null;
    case "vendor":
      return r.vendorName?.trim().toLowerCase() || null;
    case "bas":
      return r.basCode ? Number(r.basCode) : null;
    case "vat":
      return r.vatAmount != null ? Number(r.vatAmount) : null;
    case "amount":
      return r.totalAmount != null ? Number(r.totalAmount) : null;
    case "status":
      return r.status;
  }
}

export function ReceiptTable({ refreshKey }: { refreshKey: number }) {
  const { t } = useLanguage();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const exportRef = useRef<HTMLDivElement>(null);

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

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      // Missing values always sort to the bottom, regardless of direction.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1 * dir;
      if (av > bv) return dir;
      return 0;
    });
  }, [filtered, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  const EXPORT_FORMATS = [
    { key: "csv", label: "CSV", path: "/api/export/csv" },
    { key: "sie", label: "SIE4", path: "/api/export/sie" },
    { key: "pdf", label: "PDF", path: "/api/export/pdf" },
  ] as const;

  function exportAs(path: string) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    setExportOpen(false);
    window.location.href = `${path}${qs ? `?${qs}` : ""}`;
  }

  useEffect(() => {
    if (!exportOpen) return;
    function onClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [exportOpen]);

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

  const sortHeader = (column: SortKey, label: string, className?: string) => {
    const active = sort.key === column;
    return (
      <th className={cn("px-5 py-3 font-medium", className)}>
        <button
          type="button"
          onClick={() => toggleSort(column)}
          aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
          className={cn(
            "group inline-flex items-center gap-1 uppercase tracking-wide transition-colors",
            active
              ? "text-nordic-600 [text-shadow:0_0_10px_rgb(var(--accent)/0.55)]"
              : "hover:text-gray-700 dark:hover:text-gray-200",
          )}
        >
          {label}
          <span className={cn("text-[9px] leading-none transition-opacity", active ? "opacity-100" : "opacity-0 group-hover:opacity-40")}>
            {active && sort.dir === "desc" ? "▼" : "▲"}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
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
            className="min-w-[200px] flex-1 rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600"
          />
          <div className="flex items-end gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {t.receiptFrom}
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-0.5 block rounded-lg border border-gray-900/[0.12] bg-white px-2 py-1.5 text-sm dark:border-white/[0.12] dark:bg-[#111] dark:text-white" />
            </label>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {t.receiptTo}
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-0.5 block rounded-lg border border-gray-900/[0.12] bg-white px-2 py-1.5 text-sm dark:border-white/[0.12] dark:bg-[#111] dark:text-white" />
            </label>
            <div ref={exportRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setExportOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full border border-gray-900/[0.15] px-4 py-2 text-sm hover:border-gray-900/40 dark:border-white/[0.15] dark:hover:border-white/40"
              >
                {t.receiptExport}
                <svg
                  className={cn("h-3.5 w-3.5 transition-transform", exportOpen && "rotate-180")}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-gray-900/[0.12] bg-white py-1 shadow-lg dark:border-white/[0.12] dark:bg-[#111]"
                  >
                    {EXPORT_FORMATS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => exportAs(f.path)}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-900/[0.05] dark:text-gray-200 dark:hover:bg-white/[0.06]"
                      >
                        {f.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-400">
                  {sortHeader("date", t.colDate)}
                  {sortHeader("vendor", t.colVendor)}
                  {sortHeader("bas", t.colBas)}
                  {sortHeader("vat", t.colVat)}
                  {sortHeader("amount", t.colAmount)}
                  {sortHeader("status", t.colStatus)}
                  <th className="px-5 py-3 font-medium text-right">{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
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
                      {r.vatRate ? `${r.vatRate}%` : "—"} <span className="text-gray-400 dark:text-gray-400">{formatSek(r.vatAmount)}</span>
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