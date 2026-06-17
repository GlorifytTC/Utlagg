"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function FortnoxPanel({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const { t } = useLanguage();

  async function syncAll() {
    setBusy("sync");
    const res = await fetch("/api/integrations/fortnox/sync-all", { method: "POST" });
    setBusy(null);
    if (res.ok) {
      const d = await res.json();
      toast.success(`Synkat ${d.synced} kvitton${d.failed ? `, ${d.failed} misslyckades` : ""}`);
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <AnimatePresence mode="wait">
        {!connected ? (
          <motion.a
            key="connect"
            href="/api/integrations/fortnox/auth"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button className="rounded-full bg-gray-900 px-5 py-2 text-sm text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100">
              {t.fortnoxConnect}
            </Button>
          </motion.a>
        ) : (
          <motion.div
            key="connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-wrap items-center gap-3"
          >
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
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={syncAll} 
                disabled={busy !== null}
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
                  t.fortnoxSyncNow
                )}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={disconnect} 
                disabled={busy !== null}
                className={cn(
                  "rounded-full border border-gray-900/[0.15] px-5 py-2 text-sm transition hover:border-gray-900/40 disabled:opacity-50 dark:border-white/[0.15] dark:hover:border-white/40",
                  busy === "disc" && "cursor-wait",
                )}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}