"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { AuditTimeline, type AuditEntry } from "@/components/audit/AuditTimeline";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

export function AccountantAuditLog({ companyId }: { companyId: string }) {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/accountant/clients/${companyId}/audit`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.logs ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (status === "error") {
    return <p className="text-sm text-red-600">{t.auditLoadError}</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
    >
      <div className="flex items-center justify-between border-b border-gray-900/[0.07] px-5 py-4 dark:border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
          <p className="font-display text-sm font-semibold text-gray-900 dark:text-white">
            {t.auditTitle}
          </p>
        </div>
        <span className="rounded-full border border-gray-900/[0.07] px-2.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-white/[0.07]">
          {t.audit30Days}
        </span>
      </div>
      <div className="px-4 py-4">
        <AuditTimeline entries={entries} loading={status === "loading"} />
      </div>
    </motion.div>
  );
}
