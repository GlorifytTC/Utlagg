"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ClientAvatar } from "@/components/accountant/ClientAvatar";
import { AccountantClientStats } from "@/components/accountant/AccountantClientStats";
import { AccountantReceipts } from "@/components/accountant/AccountantReceipts";
import { AccountantInvoices } from "@/components/accountant/AccountantInvoices";
import { AccountantExports } from "@/components/accountant/AccountantExports";
import { AccountantAuditLog } from "@/components/accountant/AccountantAuditLog";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

interface Detail {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  receiptCount: number;
  clientId: string | null;
}

type Tab = "overview" | "receipts" | "invoices" | "exports" | "activity";

export function AccountantClientWorkspace({ companyId, initialTab }: { companyId: string; initialTab?: string }) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [tab, setTab] = useState<Tab>(initialTab === "invoices" ? "invoices" : "overview");

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

  const tabListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabListRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [tab, status]);

  const back = { href: "/accountant", label: t.allClients };

  if (status === "loading") {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="skeleton h-5 w-28 rounded-full" />
        <div className="flex items-center gap-4">
          <div className="skeleton h-14 w-14 rounded-full" />
          <div className="skeleton h-9 w-64 max-w-full rounded-xl" />
        </div>
        <div className="skeleton h-11 w-96 max-w-full rounded-full" />
        <div className="skeleton h-72 rounded-2xl" />
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="space-y-6">
        <PageHeader title={t.cwNotAvailable} back={back} />
        <div className="rounded-2xl panel p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.cwNotAvailableHint}</p>
        </div>
      </div>
    );
  }

  if (status === "error" || !detail) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.cwLoadError} back={back} />
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: t.overviewTitle },
    { key: "receipts", label: t.colReceipts },
    { key: "invoices", label: t.cwTabInvoices },
    { key: "exports", label: t.cwTabExport },
    { key: "activity", label: t.cwTabActivity },
  ];

  const tabCls = (active: boolean) =>
    cn(
      "whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition duration-300 ease-premium",
      active
        ? "bg-nordic-600 text-white"
        : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white",
    );

  return (
    <div className="space-y-6">
      <PageHeader
        back={back}
        title={
          <span className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span aria-hidden className="hidden sm:block">
              <ClientAvatar name={detail.companyName} logoUrl={detail.logoUrl} size="lg" />
            </span>
            <span aria-hidden className="sm:hidden">
              <ClientAvatar name={detail.companyName} logoUrl={detail.logoUrl} size="md" />
            </span>
            <span className="min-w-0 truncate">{detail.companyName}</span>
          </span>
        }
        subtitle={`${detail.receiptCount} ${t.distReceiptUnit}`}
        actions={
          detail.clientId && (
            <Link href={`/accountant/clients/${companyId}/chat`} className={buttonClass("outline", "w-full sm:w-auto")}>
              <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
              {t.chatTitle}
            </Link>
          )
        }
      />

      {/* Scrolls sideways on phones instead of wrapping five tabs onto two rows */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div ref={tabListRef} role="tablist" className="panel inline-flex gap-1 rounded-full p-1">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              role="tab"
              aria-selected={tab === tb.key}
              onClick={() => setTab(tb.key)}
              className={tabCls(tab === tb.key)}
            >
              {tb.label}
            </button>
          ))}
        </div>
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
        {tab === "invoices" && (
          <motion.div
            key="invoices"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <AccountantInvoices companyId={companyId} />
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
        {tab === "activity" && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <AccountantAuditLog companyId={companyId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
