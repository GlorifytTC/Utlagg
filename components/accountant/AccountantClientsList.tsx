"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

interface ClientRow {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  city: string | null;
  country: string | null;
  connectedAt: string | null;
  receiptCount: number;
}

export function AccountantClientsList() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const load = useCallback(async (p: number) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients?page=${p}&pageSize=25`);
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
      <div className="flex items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-8 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        <p className="text-sm text-red-600">{t.clientsLoadError}</p>
        <button
          onClick={() => load(page)}
          className="mt-3 rounded-full border border-gray-900/[0.15] px-4 py-1.5 text-xs transition-colors hover:border-gray-900/40 dark:border-white/[0.15] dark:hover:border-white/40"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-10 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        <p className="font-display text-base font-semibold text-gray-900 dark:text-white">
          {t.clientsEmpty}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t.clientsListEmptyHint}
        </p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-5 py-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
                  {t.colCompany}
                </th>
                <th className="px-5 py-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
                  {t.colCity}
                </th>
                <th className="px-5 py-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
                  {t.colReceipts}
                </th>
                <th className="px-5 py-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
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
                    {c.city || "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {c.receiptCount}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-green-100/50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
                      {t.statusActive}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/accountant/clients/${c.companyId}`}
                      className="text-sm font-medium text-nordic-600 transition-opacity hover:opacity-70"
                    >
                      {t.openClient} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-900/[0.07] px-5 py-3 dark:border-white/[0.07]">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t.pageOf.replace("{page}", String(page)).replace("{total}", String(totalPages))}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-gray-900/[0.15] px-3 py-1 text-xs transition-colors hover:border-gray-900/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.15] dark:hover:border-white/40"
              >
                {t.pagePrev}
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-gray-900/[0.15] px-3 py-1 text-xs transition-colors hover:border-gray-900/40 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.15] dark:hover:border-white/40"
              >
                {t.pageNext}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
