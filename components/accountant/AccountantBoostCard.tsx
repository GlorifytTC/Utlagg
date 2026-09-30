"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Button } from "@/components/ui/button";

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
        className="panel rounded-2xl bg-nordic-50 p-5 dark:bg-nordic-600/[0.06]"
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
          <span className="font-medium text-gray-900 dark:text-white">{until ?? "-"}</span>
          {state.daysLeft != null && (
            <span className="text-gray-500 dark:text-gray-400"> · {state.daysLeft} {t.boostDaysLeft}</span>
          )}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel rounded-2xl bg-nordic-50 p-5 dark:bg-nordic-600/[0.06]"
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
        <Button onClick={buy} disabled={busy} className="h-11 w-full !px-5 sm:w-auto md:h-10">
          {busy ? t.boostOpening : t.boostCta}
        </Button>
      </div>
    </motion.div>
  );
}
