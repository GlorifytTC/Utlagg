"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { AuditTimeline, type AuditEntry } from "@/components/audit/AuditTimeline";

export function CompanyAccountantAudit() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/company/accountant-audit");
      if (res.status === 403) { setStatus("ok"); return; } // no manage rights
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEntries(data.logs ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (status === "error") {
    return <p className="text-sm text-red-600">Kunde inte ladda aktivitetslogg.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="overflow-hidden rounded-2xl border border-gray-900/[0.07] bg-white/60 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-900/[0.07] px-6 py-5 dark:border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-900/[0.07] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.05]">
            <ShieldCheck className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-gray-900 dark:text-white">
              Revisorsaktivitet
            </h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Vad dina revisorer har gjort
            </p>
          </div>
        </div>
        <span className="rounded-full border border-gray-900/[0.07] px-2.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-white/[0.07]">
          30 dagar
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-b border-gray-900/[0.05] px-6 py-2.5 dark:border-white/[0.05]">
        {[
          { dot: "bg-gray-300 dark:bg-gray-600", label: "Visning" },
          { dot: "bg-accent", label: "Redigering" },
          { dot: "bg-amber", label: "Export" },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="px-5 py-5">
        <AuditTimeline
          entries={entries}
          showActor
          loading={status === "loading"}
        />
      </div>
    </motion.div>
  );
}
