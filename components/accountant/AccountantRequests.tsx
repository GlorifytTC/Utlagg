"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

interface RequestRow {
  id: string;
  companyId: string;
  companyName: string;
  status: "pending" | "active" | "revoked";
  createdAt: string;
  respondedAt: string | null;
}

const statusBadge: Record<string, { label: "statusPending" | "reqStatusAccepted" | "reqStatusDeclined"; cls: string }> = {
  pending: {
    label: "statusPending",
    cls: "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  },
  active: {
    label: "reqStatusAccepted",
    cls: "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  },
  revoked: {
    label: "reqStatusDeclined",
    cls: "bg-gray-100/80 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400",
  },
};

export function AccountantRequests() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/accountant/connection-requests");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.requests ?? []);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(id: string, action: "accept" | "decline") {
    setBusy(id);
    try {
      const res = await fetch(`/api/accountant/connection-requests/${id}/${action}`, {
        method: "POST",
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return <p className="text-sm text-red-600">{t.reqLoadError}</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl panel p-10 text-center text-sm text-gray-500 dark:text-gray-400">
        {t.reqEmpty}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl panel"
    >
      <ul>
        {rows.map((r) => {
          const s = statusBadge[r.status] ?? statusBadge.revoked;
          return (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-900/[0.07] p-5 first:border-0 dark:border-white/[0.07]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{r.companyName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{r.createdAt?.slice(0, 10)}</p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
                  {t[s.label]}
                </span>
                {r.status === "pending" && (
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={busy === r.id}
                      onClick={() => respond(r.id, "accept")}
                      className="rounded-full border border-green-600/30 bg-green-50/60 min-h-11 px-4 text-sm font-medium text-green-700 transition-colors hover:bg-green-100/60 disabled:opacity-50 dark:border-green-400/20 dark:bg-green-900/20 dark:text-green-300"
                    >
                      {t.reqAccept}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={busy === r.id}
                      onClick={() => respond(r.id, "decline")}
                      className="rounded-full border border-gray-900/[0.15] min-h-11 px-4 text-sm font-medium text-gray-600 transition-colors hover:border-gray-900/30 disabled:opacity-50 dark:border-white/[0.15] dark:text-gray-400"
                    >
                      {t.reqDecline}
                    </motion.button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
