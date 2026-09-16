"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AccountantReceipts } from "@/components/accountant/AccountantReceipts";
import { AccountantExports } from "@/components/accountant/AccountantExports";
import { AccountantChat } from "@/components/AccountantChat";

interface Detail {
  companyId: string;
  companyName: string;
  receiptCount: number;
  clientId: string | null;
}

type Tab = "overview" | "receipts" | "exports" | "chat";

export function AccountantClientWorkspace({
  companyId,
  currentUserId,
}: {
  companyId: string;
  currentUserId: string;
}) {
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
    { key: "chat", label: "Chatt" },
  ];

  return (
    <div className="space-y-6">
      {/* Client header */}
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

      {/* Pill tab bar */}
      <div className="inline-flex gap-1 rounded-full border border-gray-900/[0.07] bg-white/60 p-1 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-nordic-600 text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-gray-900/[0.07] dark:border-white/[0.07] dark:bg-white/[0.07]"
          >
            <div className="bg-[#F5F4F0] p-5 dark:bg-[#0D0D0D]">
              <p className="mb-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
                Kvitton totalt
              </p>
              <p className="font-display text-[22px] font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
                {detail.receiptCount}
              </p>
            </div>
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
        {tab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {detail.clientId ? (
              <AccountantChat clientId={detail.clientId} currentUserId={currentUserId} />
            ) : (
              <p className="text-sm text-gray-500">Chatt är inte tillgänglig.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
