"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountantReceiptEditor } from "@/components/accountant/AccountantReceiptEditor";

interface ReceiptRow {
  id: string;
  vendorName: string | null;
  date: string | null;
  totalAmount: string | null;
  vatAmount: string | null;
  vatRate: number | null;
  basCode: string | null;
  category: string | null;
  status: string;
}

const statusBadge: Record<string, string> = {
  approved: "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  pending: "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  rejected: "bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

export function AccountantReceipts({ companyId }: { companyId: string }) {
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const p = new URLSearchParams({ page: String(page), pageSize: "25", sort, dir });
      if (debouncedQ) p.set("q", debouncedQ);
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      const res = await fetch(`/api/accountant/clients/${companyId}/receipts?${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.receipts ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 25);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [companyId, page, debouncedQ, from, to, sort, dir]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSort(key: string) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const inputCls =
    "rounded-lg border border-gray-900/[0.12] bg-white px-3 py-2 text-sm outline-none transition focus:border-nordic-600 focus:ring-2 focus:ring-nordic-600/20 dark:border-white/[0.12] dark:bg-[#111] dark:text-white dark:placeholder:text-gray-600";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
            Sök
          </label>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Leverantör, BAS, belopp…"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
            Från
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
            Till
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className={inputCls}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center p-10 text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
            Laddar kvitton…
          </motion.div>
        ) : status === "error" ? (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-600"
          >
            Kunde inte ladda kvitton.
          </motion.p>
        ) : rows.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-10 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:text-gray-400"
          >
            Inga kvitton matchar.
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    {[
                      { label: "Datum", k: "date" },
                      { label: "Leverantör", k: "vendor" },
                      { label: "BAS", k: "bas" },
                      { label: "Belopp", k: "amount" },
                      { label: "Moms", k: "vat" },
                    ].map(({ label, k }) => (
                      <th
                        key={k}
                        onClick={() => toggleSort(k)}
                        className="cursor-pointer select-none px-5 py-3"
                      >
                        <span
                          className={`inline-flex items-center gap-1 text-[9.5px] font-medium uppercase tracking-[0.16em] transition-colors ${sort === k ? "text-nordic-600" : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
                        >
                          {label}
                          <span className="text-[9px] leading-none">
                            {sort === k ? (dir === "asc" ? "↑" : "↓") : ""}
                          </span>
                        </span>
                      </th>
                    ))}
                    <th className="px-5 py-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
                      Status
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <>
                      <tr
                        key={r.id}
                        className="cursor-pointer border-t border-gray-900/[0.07] transition-colors hover:bg-gray-900/[0.02] dark:border-white/[0.07] dark:hover:bg-white/[0.02]"
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}
                      >
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {r.date ? r.date.slice(0, 10) : "—"}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {r.vendorName || "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-sm text-gray-500 dark:text-gray-400">
                          {r.basCode || "—"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {r.totalAmount ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {r.vatAmount ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge[r.status] ?? "bg-gray-100/80 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400"}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-medium text-nordic-600 transition-opacity hover:opacity-70">
                          {openId === r.id ? "Stäng" : "Granska"}
                        </td>
                      </tr>
                      {openId === r.id && (
                        <tr key={`${r.id}-editor`}>
                          <td
                            colSpan={7}
                            className="border-t border-gray-900/[0.07] bg-gray-900/[0.02] px-5 py-4 dark:border-white/[0.07] dark:bg-white/[0.02]"
                          >
                            <AccountantReceiptEditor
                              companyId={companyId}
                              receiptId={r.id}
                              onSaved={load}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-900/[0.07] px-5 py-3 dark:border-white/[0.07]">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Sida {page} av {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-full border border-gray-900/[0.15] px-3 py-1 text-xs transition-colors hover:border-gray-900/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.15] dark:hover:border-white/40"
                  >
                    ← Föregående
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-full border border-gray-900/[0.15] px-3 py-1 text-xs transition-colors hover:border-gray-900/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.15] dark:hover:border-white/40"
                  >
                    Nästa →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
