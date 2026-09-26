"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

interface BoostState {
  active: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
}

export function AccountantBoostCard() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const params = useSearchParams();
  const [state, setState] = useState<BoostState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/accountant/boost");
      if (res.ok) setState(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (params.get("boost") === "processing") {
      toast.info(t.boostProcessing);
      let tries = 0;
      const iv = setInterval(async () => {
        tries++;
        const res = await fetch("/api/accountant/boost");
        if (res.ok) {
          const s = await res.json();
          setState(s);
          if (s.active || tries >= 5) clearInterval(iv);
        }
      }, 2000);
      return () => clearInterval(iv);
    }
    if (params.get("boost") === "cancelled") toast.info(t.boostCancelled);
  }, [params, t]);

  async function buy() {
    setBusy(true);
    try {
      const res = await fetch("/api/accountant/boost", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) {
        window.location.href = d.url;
        return;
      }
      if (res.status === 409 && d.alreadyActive) {
        toast.info(t.boostAlreadyActive);
        load();
      } else {
        toast.error(d.error ?? t.boostBuyError);
      }
    } catch {
      toast.error(t.boostBuyError);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  if (state?.active) {
    const until = state.expiresAt
      ? new Date(state.expiresAt).toLocaleDateString(lang === "en" ? "en-GB" : "sv-SE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-l-2 border-gray-900/[0.07] border-l-nordic-600 bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
      >
        <div className="flex items-center gap-2">
          <p className="font-display text-base font-semibold text-gray-900 dark:text-white">
            {t.boostActive}
          </p>
          <span className="rounded-full bg-nordic-600/10 px-2.5 py-1 text-xs font-medium text-nordic-600 dark:bg-nordic-600/20">
            {t.statusActive}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t.boostActiveDesc}
        </p>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {t.boostActiveUntil}{" "}
          <span className="font-medium text-gray-900 dark:text-white">{until ?? "—"}</span>
          {state.daysLeft != null && (
            <span className="text-gray-400"> · {state.daysLeft} {t.boostDaysLeft}</span>
          )}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-l-2 border-gray-900/[0.07] border-l-nordic-600 bg-white/60 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#0D0D0D]"
    >
      <p className="font-display text-base font-semibold text-gray-900 dark:text-white">
        {t.boostTitle}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t.boostDesc}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-display text-lg font-semibold text-gray-900 dark:text-white">
            49 kr
          </span>{" "}
          {t.boostPriceTerms}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={buy}
          disabled={busy}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-nordic-900 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          {busy ? t.boostOpening : t.boostCta}
        </motion.button>
      </div>
    </motion.div>
  );
}
