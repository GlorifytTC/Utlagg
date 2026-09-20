"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AccountantClientStats } from "@/components/accountant/AccountantClientStats";
import { AccountantReceipts } from "@/components/accountant/AccountantReceipts";
import { AccountantExports } from "@/components/accountant/AccountantExports";

interface Detail {
  companyId: string;
  companyName: string;
  receiptCount: number;
  clientId: string | null;
}

type Tab = "overview" | "receipts" | "exports";

export function AccountantClientWorkspace({ companyId }: { companyId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}`);
      if (res.status === 404 || res.status === 403) {
        setStatus("notfound");
        return;
      }
      if (!res.ok) throw new Error();
      setDetail(await res.json());
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-10 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        <p className="font-display text-base font-semibold text-gray-900 dark:text-white">
          Klienten är inte tillgänglig
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Åtkomsten kan ha tagits bort, eller så finns klienten inte.
        </p>
      </div>
    );
  }

  if (status === "error" || !detail) {
    return <p className="text-sm text-red-600">Kunde inte ladda klienten.</p>;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Översikt" },
    { key: "receipts", label: "Kvitton" },
    { key: "exports", label: "Export" },
  ];

  const tabCls = (active: boolean) =>
    cn(
      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
      active
        ? "bg-nordic-600 text-white"
        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white",
    );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
      >
        <h1 className="font-display text-xl font-semibold text-gray-900 dark:text-white">
          {detail.companyName}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {detail.receiptCount} kvitton
        </p>
      </motion.div>

      <div className="flex items-center gap-2">
        <div className="inline-flex gap-1 rounded-full border border-gray-900/[0.07] bg-white/60 p-1 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={tabCls(tab === t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        {detail.clientId && (
          <Link
            href={`/accountant/clients/${companyId}/chat`}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-900/[0.07] bg-white/60 px-4 py-1.5 text-sm font-medium text-gray-500 backdrop-blur-sm transition-colors hover:text-gray-800 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-gray-400 dark:hover:text-white"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chatt
          </Link>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <AccountantClientStats
              companyId={companyId}
              onViewAllReceipts={() => setTab("receipts")}
            />
          </motion.div>
        )}
        {tab === "receipts" && (
          <motion.div
            key="receipts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <AccountantReceipts companyId={companyId} />
          </motion.div>
        )}
        {tab === "exports" && (
          <motion.div
            key="exports"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <AccountantExports companyId={companyId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
