"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Pager } from "@/components/ui/pager";

interface ClientRow {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
  connectedAt: string | null;
  receiptCount: number;
}

/** `limit` = dashboard preview: first N clients + "view all" link instead of a pager. */
export function AccountantClientsList({ limit }: { limit?: number }) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(limit ?? 25);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const load = useCallback(async (p: number) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients?page=${p}&pageSize=${limit ?? 25}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.clients ?? []);
      setTotal(data.total ?? 0);
      setPageSize(data.pageSize ?? 25);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  if (status === "loading") {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <ErrorState onRetry={() => load(page)} retryLabel={t.retry}>
        {t.clientsLoadError}
      </ErrorState>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl panel p-10 text-center">
        <p className="font-display text-base font-semibold text-gray-900 dark:text-white">
          {t.clientsEmpty}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t.clientsListEmptyHint}
        </p>
      </div>
    );
  }

  const totalPages = limit ? 1 : Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl panel"
      >
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t.colCompany}
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t.colCity}
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t.colReceipts}
                </th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t.rcColStatus}
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.companyId}
                  className="border-t border-gray-900/[0.07] transition-colors hover:bg-gray-900/[0.02] dark:border-white/[0.07] dark:hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ClientAvatar name={c.companyName} logoUrl={c.logoUrl} size="sm" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{c.companyName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {c.city || "-"}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {c.receiptCount}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone="success">{t.statusActive}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/accountant/clients/${c.companyId}`}
                      className="inline-flex min-h-11 items-center rounded-full text-sm font-medium text-nordic-600 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:text-nordic-400"
                    >
                      {t.openClient} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-gray-900/[0.07] dark:divide-white/[0.07] md:hidden">
          {rows.map((c) => (
            <li key={c.companyId}>
              <Link
                href={`/accountant/clients/${c.companyId}`}
                className="flex min-h-[56px] items-center gap-3 p-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-nordic-600/20"
              >
                <ClientAvatar name={c.companyName} logoUrl={c.logoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.companyName}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {c.city ? `${c.city} · ` : ""}
                    {c.receiptCount} {t.colReceipts.toLowerCase()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        {limit && total > limit && (
          <Link
            href="/accountant/clients"
            className="flex min-h-11 items-center justify-between border-t border-gray-900/[0.07] px-5 py-3 text-sm font-medium text-nordic-600 dark:text-nordic-400 transition-opacity hover:opacity-70 dark:border-white/[0.07]"
          >
            {t.clientsViewAll}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        )}

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
    </div>
  );
}
