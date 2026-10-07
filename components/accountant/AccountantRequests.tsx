"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { formatDate } from "@/lib/utils";

interface RequestRow {
  id: string;
  companyId: string;
  companyName: string;
  status: "pending" | "active" | "revoked";
  createdAt: string;
  respondedAt: string | null;
}

const statusBadge: Record<string, { label: "statusPending" | "reqStatusAccepted" | "reqStatusDeclined"; tone: BadgeTone }> = {
  pending: { label: "statusPending", tone: "warning" },
  active: { label: "reqStatusAccepted", tone: "success" },
  revoked: { label: "reqStatusDeclined", tone: "neutral" },
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
    return <ErrorState onRetry={load} retryLabel={t.retry}>{t.reqLoadError}</ErrorState>;
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
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(r.createdAt, lang)}</p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <Badge tone={s.tone}>{t[s.label]}</Badge>
                {r.status === "pending" && (
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                    <Button disabled={busy === r.id} onClick={() => respond(r.id, "accept")}>
                      {t.reqAccept}
                    </Button>
                    <Button variant="outline" disabled={busy === r.id} onClick={() => respond(r.id, "decline")}>
                      {t.reqDecline}
                    </Button>
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
