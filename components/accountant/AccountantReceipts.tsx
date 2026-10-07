"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountantReceiptEditor } from "@/components/accountant/AccountantReceiptEditor";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Pager } from "@/components/ui/pager";
import { formatDate } from "@/lib/utils";

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
  /** Only on the cross-client work-queue lists. */
  companyId?: string;
  companyName?: string;
}

const statusTone: Record<string, BadgeTone> = { approved: "success", pending: "warning", rejected: "danger" };

/** One client's receipts (companyId), or a cross-client work-queue list (filter). */
export function AccountantReceipts({ companyId, filter, range }: { companyId?: string; filter?: "review" | "uncertain" | "missing" | "pending" | "month" | "reviewed"; range?: "week" | "month" }) {
  const endpoint = companyId ? `/api/accountant/clients/${companyId}/receipts` : "/api/accountant/receipts";
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const statusLabel: Record<string, string> = { approved: t.statusApproved, pending: t.statusPending, rejected: t.statusRejected };
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
  // table and card list both render; mount the editor in only the visible one
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const [refreshKey, setRefreshKey] = useState(0);
  // ponytail: in-memory page cache; cleared on save so stale pages aren't served after edits
  const cache = useRef<Map<string, { rows: ReceiptRow[]; total: number }>>(new Map());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => { cache.current.clear(); }, [refreshKey]);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page), pageSize: "25", sort, dir });
    if (filter) p.set("filter", filter);
    if (range) p.set("range", range);
    if (debouncedQ) p.set("q", debouncedQ);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    const qs = p.toString();
    const hit = cache.current.get(qs);
    if (hit) {
      setRows(hit.rows);
      setTotal(hit.total);
      setStatus("ok");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(`${endpoint}?${qs}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fetchedRows: ReceiptRow[] = data.receipts ?? [];
      const fetchedTotal: number = data.total ?? 0;
      cache.current.set(qs, { rows: fetchedRows, total: fetchedTotal });
      setRows(fetchedRows);
      setTotal(fetchedTotal);
      setPageSize(data.pageSize ?? 25);
      // work-queue lists shrink as receipts get reviewed - step back off an emptied last page
      if (fetchedRows.length === 0 && fetchedTotal > 0 && page > 1) {
        setPage(Math.ceil(fetchedTotal / 25));
        return;
      }
      // prefetch prev/next pages for instant navigation
      const totalPages = Math.ceil(fetchedTotal / 25);
      [page - 1, page + 1].forEach((pn) => {
        if (pn < 1 || pn > totalPages) return;
        const pqs = new URLSearchParams({ page: String(pn), pageSize: "25", sort, dir });
        if (filter) pqs.set("filter", filter);
        if (range) pqs.set("range", range);
        if (debouncedQ) pqs.set("q", debouncedQ);
        if (from) pqs.set("from", from);
        if (to) pqs.set("to", to);
        const pqsStr = pqs.toString();
        if (cache.current.has(pqsStr)) return;
        fetch(`${endpoint}?${pqsStr}`)
          .then((r) => r.json())
          .then((d) => cache.current.set(pqsStr, { rows: d.receipts ?? [], total: d.total ?? 0 }))
          .catch(() => {});
      });
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [endpoint, filter, range, page, debouncedQ, from, to, sort, dir]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  function handleSaved() {
    setRefreshKey((k) => k + 1);
  }

  function toggleSort(key: string) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap">
        <div className="col-span-2 min-w-[180px] flex-1">
          <Label htmlFor="rc-q" className="mb-1.5 block">
            {t.rcSearch}
          </Label>
          <Input
            id="rc-q"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t.rcSearchPlaceholder}
          />
        </div>
        <div>
          <Label htmlFor="rc-from" className="mb-1.5 block">
            {t.rcFrom}
          </Label>
          <Input
            id="rc-from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="sm:!w-auto"
          />
        </div>
        <div>
          <Label htmlFor="rc-to" className="mb-1.5 block">
            {t.rcTo}
          </Label>
          <Input
            id="rc-to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="sm:!w-auto"
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
            className="space-y-2"
            aria-busy="true"
            aria-label={t.rcLoading}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </motion.div>
        ) : status === "error" ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ErrorState onRetry={load} retryLabel={t.retry}>
              {t.rcLoadError}
            </ErrorState>
          </motion.div>
        ) : rows.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl panel p-10 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            {t.rcEmpty}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl panel"
          >
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    {[
                      { label: t.rcColDate, k: "date" },
                      { label: t.rcColVendor, k: "vendor" },
                      { label: t.rcColBas, k: "bas" },
                      { label: t.rcColAmount, k: "amount" },
                      { label: t.rcColVat, k: "vat" },
                    ].map(({ label, k }) => (
                      <Fragment key={k}>
                      {k === "vendor" && !companyId && (
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t.rcColClient}</th>
                      )}
                      <th
                        aria-sort={sort === k ? (dir === "asc" ? "ascending" : "descending") : "none"}
                        className="px-5 py-1"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(k)}
                          className={`inline-flex items-center gap-1 rounded-full py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 ${sort === k ? "text-nordic-700 dark:text-nordic-300" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
                        >
                          {label}
                          {sort === k && <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span>}
                        </button>
                      </th>
                      </Fragment>
                    ))}
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {t.rcColStatus}
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <Fragment key={r.id}>
                      <tr
                        className="cursor-pointer border-t border-gray-900/[0.07] transition-colors hover:bg-gray-900/[0.02] dark:border-white/[0.07] dark:hover:bg-white/[0.02]"
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}
                      >
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(r.date, lang)}
                        </td>
                        {!companyId && (
                          <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">{r.companyName || "-"}</td>
                        )}
                        <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {r.vendorName || "-"}
                        </td>
                        <td className="px-5 py-3 font-mono text-sm text-gray-500 dark:text-gray-400">
                          {r.basCode || "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {r.totalAmount ?? "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {r.vatAmount ?? "-"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={statusTone[r.status] ?? "neutral"}>{statusLabel[r.status] ?? r.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-medium text-nordic-600 transition-opacity hover:opacity-70">
                          {openId === r.id ? t.rcClose : t.rcReview}
                        </td>
                      </tr>
                      {openId === r.id && isDesktop && (
                        <tr key={`${r.id}-editor`}>
                          <td
                            colSpan={companyId ? 7 : 8}
                            className="border-t border-gray-900/[0.07] bg-gray-900/[0.02] px-5 py-4 dark:border-white/[0.07] dark:bg-white/[0.02]"
                          >
                            <AccountantReceiptEditor
                              companyId={r.companyId ?? companyId!}
                              receiptId={r.id}
                              onSaved={handleSaved}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-gray-900/[0.07] dark:divide-white/[0.07] md:hidden">
              {rows.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{r.vendorName || "-"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {!companyId && r.companyName ? `${r.companyName} · ` : ""}
                        {formatDate(r.date, lang)} · {r.totalAmount ?? "-"}
                      </p>
                    </div>
                    <Badge tone={statusTone[r.status] ?? "neutral"} className="shrink-0">
                      {statusLabel[r.status] ?? r.status}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}
                      className="min-h-11 shrink-0 rounded-full px-2 text-sm font-medium text-nordic-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:text-nordic-400"
                    >
                      {openId === r.id ? t.rcClose : t.rcReview}
                    </button>
                  </div>
                  {openId === r.id && !isDesktop && (
                    <div className="border-t border-gray-900/[0.07] bg-gray-900/[0.02] px-4 py-4 dark:border-white/[0.07] dark:bg-white/[0.02]">
                      <AccountantReceiptEditor companyId={r.companyId ?? companyId!} receiptId={r.id} onSaved={handleSaved} />
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <Pager
                page={page}
                pageCount={totalPages}
                onChange={setPage}
                prevLabel={t.pagePrev}
                nextLabel={t.pageNext}
                status={t.pageOf.replace("{page}", String(page)).replace("{total}", String(totalPages))}
                className="border-t border-gray-900/[0.07] px-5 py-3 dark:border-white/[0.07]"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
