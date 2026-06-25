"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { formatSek, cn } from "@/lib/utils";

interface PendingReceipt {
  id: string;
  date: string | null;
  vendorName: string | null;
  totalAmount: string | null;
  vatAmount: string | null;
  category: string | null;
  basCode: string | null;
  status: string;
}

export function FortnoxPanel({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingReceipt[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { t } = useLanguage();

  useEffect(() => {
    if (!connected) return;
    fetch("/api/integrations/fortnox/pending")
      .then((r) => (r.ok ? r.json() : { receipts: [] }))
      .then((d) => {
        setPending(d.receipts ?? []);
        // Nothing pre-selected — the person opts in receipt by receipt
        // (or uses "select all"), rather than everything being sent by default.
      })
      .catch(() => setPending([]));
  }, [connected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!pending) return;
    setSelected((prev) => (prev.size === pending.length ? new Set() : new Set(pending.map((r) => r.id))));
  }

  async function syncSelected() {
    if (selected.size === 0) {
      toast.error(t.fortnoxNoneSelected);
      return;
    }
    setBusy("sync");
    const res = await fetch("/api/integrations/fortnox/sync-selected", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptIds: Array.from(selected) }),
    });
    setBusy(null);
    if (res.ok) {
      const d = await res.json();
      toast.success(`Synkat ${d.synced} kvitton${d.failed ? `, ${d.failed} misslyckades` : ""}`);
      setSelected(new Set());
      setPending((prev) => prev?.filter((r) => !selected.has(r.id)) ?? null);
      router.refresh();
    } else {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? t.fortnoxSyncFail);
    }
  }

  async function disconnect() {
    if (!confirm(t.fortnoxDisconnectConfirm)) return;
    setBusy("disc");
    const res = await fetch("/api/integrations/fortnox/disconnect", { method: "POST" });
    setBusy(null);
    if (res.ok) {
      toast.success(t.fortnoxDisconnected);
      router.refresh();
    } else toast.error(t.fortnoxDisconnectFail);
  }

  if (!connected) {
    return (
      <motion.a
        href="/api/integrations/fortnox/auth"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="inline-block"
      >
        <Button className="rounded-full bg-gray-900 px-5 py-2 text-sm text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
          {t.fortnoxConnect}
        </Button>
      </motion.a>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <motion.span
          className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.span
            className="h-2 w-2 rounded-full bg-green-500"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {t.fortnoxConnected}
        </motion.span>
        <Button
          variant="outline"
          onClick={disconnect}
          disabled={busy !== null}
          className="rounded-full border border-gray-900/[0.15] px-5 py-2 text-sm transition hover:border-gray-900/40 disabled:opacity-50 dark:border-white/[0.15] dark:hover:border-white/40"
        >
          {busy === "disc" ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
              {t.fortnoxDisconnect}
            </span>
          ) : (
            t.fortnoxDisconnect
          )}
        </Button>
      </div>

      <div className="rounded-xl border border-gray-900/[0.08] dark:border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-gray-900/[0.08] px-4 py-3 dark:border-white/[0.08]">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{t.fortnoxReviewTitle}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.fortnoxReviewDesc}</p>
          </div>
          {pending && pending.length > 0 && (
            <button
              onClick={toggleAll}
              className="shrink-0 text-xs font-medium text-nordic-700 hover:underline dark:text-nordic-300"
            >
              {selected.size === pending.length ? t.fortnoxDeselectAll : t.fortnoxSelectAll}
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto">
          {pending === null ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">…</div>
          ) : pending.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-400">{t.fortnoxNonePending}</div>
          ) : (
            <ul className="divide-y divide-gray-900/[0.06] dark:divide-white/[0.06]">
              {pending.map((r) => (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      className="h-4 w-4 rounded border-gray-300 text-nordic-600 focus:ring-nordic-500"
                    />
                    <span className="flex-1 truncate text-sm text-gray-900 dark:text-white">
                      {r.vendorName || "—"}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {r.date ? new Date(r.date).toLocaleDateString("sv-SE") : "—"}
                    </span>
                    <span className="shrink-0 truncate text-xs text-gray-500 dark:text-gray-400" style={{ maxWidth: 140 }}>
                      {r.category || "—"}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-gray-900 dark:text-white">
                      {formatSek(r.totalAmount)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {pending && pending.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-900/[0.08] px-4 py-3 dark:border-white/[0.08]">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selected.size} {t.fortnoxSelectedCount}
            </span>
            <Button
              onClick={syncSelected}
              disabled={busy !== null || selected.size === 0}
              className={cn(
                "rounded-full bg-gray-900 px-5 py-2 text-sm text-white transition hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
                busy === "sync" && "cursor-wait",
              )}
            >
              {busy === "sync" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-gray-900 dark:border-t-transparent" />
                  {t.fortnoxSyncing}
                </span>
              ) : (
                t.fortnoxSyncSelected
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
