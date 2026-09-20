"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

interface Client {
  companyId: string;
  companyName: string;
  receiptCount: number;
}

export function AccountantAllChats() {
  const { lang } = useLanguage();
  const at = accountantStrings(lang);
  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/accountant/clients?pageSize=100");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(data.clients ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
      </div>
    );
  }

  if (status === "error") {
    return <p className="text-sm text-red-600">{at.error}</p>;
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-10 text-center backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        <p className="text-sm text-gray-500 dark:text-gray-400">{at.clientsEmpty}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D] divide-y divide-gray-900/[0.05] dark:divide-white/[0.05]"
    >
      {clients.map((c) => (
        <Link
          key={c.companyId}
          href={`/accountant/clients/${c.companyId}/chat`}
          className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-900/[0.02] dark:hover:bg-white/[0.03] first:rounded-t-2xl last:rounded-b-2xl"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.08]">
            <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{c.companyName}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        </Link>
      ))}
    </motion.div>
  );
}
