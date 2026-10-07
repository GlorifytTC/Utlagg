"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatSek, formatDate, cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { ReviewerStack } from "@/components/dashboard/ReviewerStack";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Pager } from "@/components/ui/pager";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const STATUS_TONE: Record<string, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

type SortKey = "date" | "vendor" | "bas" | "vat" | "amount" | "status";

// Trimmed shape returned by GET /api/receipts - no image bytes or OCR text.
type ReceiptRow = {
  id: string;
  vendorName: string | null;
  date: string | null;
  totalAmount: string | null;
  vatAmount: string | null;
  vatRate: number | null;
  basCode: string | null;
  category: string | null;
  status: string;
  createdAt: string;
  hasImage: boolean;
  inCompany: boolean;
  approver: { name: string; logoUrl: string | null } | null;
  reviewers: { name: string; logoUrl: string | null }[];
};

const PAGE_SIZE = 25;

type CacheEntry = { receipts: ReceiptRow[]; total: number };

function buildQs(
  page: number,
  sort: { key: SortKey; dir: "asc" | "desc" },
  query: string,
  from: string,
  to: string,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), sort: sort.key, dir: sort.dir });
  if (query) params.set("q", query);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return params.toString();
}

export function ReceiptTable({ refreshKey }: { refreshKey: number }) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const exportRef = useRef<HTMLDivElement>(null);
  // ponytail: in-memory page cache; cleared when data changes (refreshKey) so stale pages aren't served after upload/delete
  const cache = useRef<Map<string, CacheEntry>>(new Map());

  const statusLabel: Record<string, string> = {
    pending: t.statusPending,
    approved: t.statusApproved,
    rejected: t.statusRejected,
  };

  // Approved: the avatar stack (approver + accountant reviewers) replaces the pill.
  // Solo users have no approver, only reviewers (if any).
  const statusCell = (r: ReceiptRow) =>
    r.status === "approved" && ((r.inCompany && r.approver) || r.reviewers.length > 0) ? (
      <ReviewerStack approver={r.inCompany ? r.approver : null} reviewers={r.reviewers} />
    ) : r.status === "approved" ? (
      <span className="text-gray-500 dark:text-gray-400">-</span>
    ) : (
      <span className="inline-flex items-center gap-2">
        <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{statusLabel[r.status] ?? r.status}</Badge>
        <ReviewerStack reviewers={r.reviewers} />
      </span>
    );

  // Debounce the search box so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // Any change to filters or sort returns to the first page.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, from, to, sort]);

  // New receipt saved → invalidate cache so stale page data isn't served.
  useEffect(() => { cache.current.clear(); }, [refreshKey]);

  const load = useCallback(async () => {
    const qs = buildQs(page, sort, debouncedQuery, from, to);
    const hit = cache.current.get(qs);
    if (hit) {
      setReceipts(hit.receipts);
      setTotal(hit.total);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/receipts?${qs}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const rows: ReceiptRow[] = data.receipts ?? [];
      const fetchedTotal: number = data.total ?? 0;
      cache.current.set(qs, { receipts: rows, total: fetchedTotal });
      setReceipts(rows);
      setTotal(fetchedTotal);
      // prefetch prev/next pages so navigation is instant
      const totalPages = Math.ceil(fetchedTotal / PAGE_SIZE);
      [page - 1, page + 1].forEach((p) => {
        if (p < 1 || p > totalPages) return;
        const pqs = buildQs(p, sort, debouncedQuery, from, to);
        if (cache.current.has(pqs)) return;
        fetch(`/api/receipts?${pqs}`)
          .then((r) => r.json())
          .then((d) => cache.current.set(pqs, { receipts: d.receipts ?? [], total: d.total ?? 0 }))
          .catch(() => {});
      });
    } catch {
      setReceipts([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, sort, debouncedQuery, from, to]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setExportOpen(false);
        exportRef.current?.querySelector("button")?.focus();
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
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
    setConfirmId(null);
    setRemovingId(id);
    await fetch(`/api/receipts/${id}`, { method: "DELETE" });
    await load();
    setRemovingId(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, total);
  const showingLabel = t.receiptShowing
    .replace("{from}", String(rangeFrom))
    .replace("{to}", String(rangeTo))
    .replace("{total}", String(total));

  const sortHeader = (column: SortKey, label: string, className?: string) => {
    const active = sort.key === column;
    return (
      <th
        scope="col"
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
        className={cn("px-5 py-3 font-medium", className)}
      >
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={cn(
            "group inline-flex items-center gap-1 py-2 uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20",
            active
              ? "text-nordic-600 [text-shadow:0_0_10px_rgb(var(--accent)/0.55)]"
              : "hover:text-gray-700 dark:hover:text-gray-200",
          )}
        >
          {label}
          <span aria-hidden className={cn("text-xs leading-none transition-opacity", active ? "opacity-100" : "opacity-0 group-hover:opacity-40 group-focus-visible:opacity-40")}>
            {active && sort.dir === "desc" ? "▼" : "▲"}
          </span>
        </button>
      </th>
    );
  };

  const filtersActive = Boolean(debouncedQuery || from || to);
  function clearFilters() {
    setQuery("");
    setDebouncedQuery("");
    setFrom("");
    setTo("");
  }
  const actionBtn = "!px-3 !py-1 !text-xs md:!min-h-0";
  const approveClass = "hover:border-emerald-400 hover:text-emerald-700 dark:hover:border-emerald-400 dark:hover:text-emerald-300";
  const deleteClass = "text-red-600 hover:border-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400";
  const linkClass =
    "rounded hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20";

  const rowActions = (r: ReceiptRow, mobile: boolean) => (
    <>
      {r.status === "pending" && (
        <Button
          variant="outline"
          onClick={(e) => { e.stopPropagation(); approve(r.id); }}
          className={cn(mobile ? "" : actionBtn, approveClass)}
        >
          {t.receiptApprove}
        </Button>
      )}
      <Button
        variant="outline"
        onClick={(e) => { e.stopPropagation(); setConfirmId(r.id); }}
        disabled={removingId === r.id}
        aria-busy={removingId === r.id}
        className={cn(mobile ? "" : actionBtn, deleteClass)}
      >
        {removingId === r.id ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400" />
            <span className="sr-only">{t.receiptLoading}</span>
          </span>
        ) : (
          t.receiptDelete
        )}
      </Button>
    </>
  );

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-900/[0.07] p-5 dark:border-white/[0.07]">
        <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-white">{t.navReceipts}</h2>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.receiptSearch}
            aria-label={t.receiptSearch}
            className="min-w-[200px] flex-1"
          />
          <div className="grid w-full grid-cols-2 items-end gap-2 sm:flex sm:w-auto">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {t.receiptFrom}
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 block sm:!w-auto" />
            </label>
            <label className="text-xs text-gray-500 dark:text-gray-400">
              {t.receiptTo}
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 block sm:!w-auto" />
            </label>
            <div ref={exportRef} className="relative col-span-2 sm:col-span-1">
              <Button
                variant="outline"
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                onClick={() => setExportOpen((o) => !o)}
                className="w-full sm:w-auto"
              >
                {t.receiptExport}
                <svg
                  aria-hidden
                  className={cn("h-3.5 w-3.5 transition-transform", exportOpen && "rotate-180")}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="panel absolute right-0 z-20 mt-1 min-w-[140px] max-sm:w-full overflow-hidden rounded-2xl py-1"
                  >
                    {EXPORT_FORMATS.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        role="menuitem"
                        onClick={() => exportAs(f.path)}
                        className="block min-h-11 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-900/[0.05] focus-visible:bg-gray-900/[0.05] focus-visible:outline-none md:min-h-0 md:py-2 dark:text-gray-200 dark:hover:bg-white/[0.06] dark:focus-visible:bg-white/[0.06]"
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
            role="status"
            aria-busy="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
            {t.receiptLoading}
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
            <ErrorState onRetry={load} retryLabel={t.btnRetry}>
              {t.receiptLoadFailed}
            </ErrorState>
          </motion.div>
        ) : receipts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 p-10 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            <p>{filtersActive ? t.receiptNoMatch : t.receiptNone}</p>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className={buttonClass("outline")}>
                {t.receiptClearFilters}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {sortHeader("date", t.colDate)}
                  {sortHeader("vendor", t.colVendor)}
                  {sortHeader("bas", t.colBas)}
                  {sortHeader("vat", t.colVat)}
                  {sortHeader("amount", t.colAmount)}
                  {sortHeader("status", t.colStatus)}
                  <th scope="col" className="px-5 py-3 font-medium text-right">{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => router.push(`/dashboard/receipts/${r.id}`)}
                    className="cursor-pointer border-t border-gray-900/[0.07] hover:bg-gray-900/[0.02] dark:border-white/[0.07] dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">{formatDate(r.date, lang)}</td>
                    <td className="px-5 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/receipts/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={linkClass}
                        >
                          {r.vendorName ?? "-"}
                        </Link>
                        {r.hasImage && (
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600"
                            aria-hidden
                          >
                            <rect x="3" y="4" width="14" height="12" rx="2" />
                            <circle cx="7.5" cy="8.5" r="1.2" />
                            <path d="M4 14l4-4 3 3 2-2 3 3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-500 dark:text-gray-400">{r.basCode ?? "-"}</td>
                    <td className="px-5 py-3">
                      {r.vatRate ? `${r.vatRate}%` : "-"} <span className="text-gray-500 dark:text-gray-400">{formatSek(r.vatAmount)}</span>
                    </td>
                    <td className="px-5 py-3">{formatSek(r.totalAmount)}</td>
                    <td className="px-5 py-3">
                      {statusCell(r)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">{rowActions(r, false)}</div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            </div>

            <ul className="divide-y divide-gray-900/[0.07] dark:divide-white/[0.07] md:hidden">
              {receipts.map((r) => (
                <li
                  key={r.id}
                  onClick={() => router.push(`/dashboard/receipts/${r.id}`)}
                  className="cursor-pointer space-y-3 px-4 py-3 active:bg-gray-900/[0.03] dark:active:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">
                        <Link
                          href={`/dashboard/receipts/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={linkClass}
                        >
                          {r.vendorName ?? "-"}
                        </Link>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(r.date, lang)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium tabular-nums">{formatSek(r.totalAmount)}</p>
                      <div className="mt-1 flex justify-end">{statusCell(r)}</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">{rowActions(r, true)}</div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-900/[0.07] px-5 py-3 text-sm text-gray-500 dark:border-white/[0.07] dark:text-gray-400">
              <span>{showingLabel}</span>
              <Pager
                page={page}
                pageCount={totalPages}
                onChange={setPage}
                prevLabel={t.receiptPrev}
                nextLabel={t.receiptNext}
                className="gap-2"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmId !== null}
        title={t.receiptDeleteTitle}
        description={t.receiptDeleteConfirm}
        confirmLabel={t.receiptDelete}
        cancelLabel={t.btnCancel}
        destructive
        onConfirm={() => confirmId && remove(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </Card>
  );
}
