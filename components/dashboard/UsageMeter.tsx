"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function UsageMeter({
  used,
  limit,
  tier,
}: {
  used: number;
  limit: number; // -1 = unlimited
  tier: string;
}) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / limit) * 100);
  const near = !unlimited && pct >= 80;

  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-gray-900/[0.07] bg-white/60 p-5 backdrop-blur-sm transition-shadow hover:shadow-sm dark:border-white/[0.07] dark:bg-gray-950/60">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.scansThisMonth}</p>
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-600 capitalize dark:bg-sky-900/30 dark:text-sky-400"
        >
          {tier}
        </motion.span>
      </div>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-2 font-display text-2xl text-gray-900 dark:text-white"
      >
        {used}
        {unlimited ? (
          <span className="text-base text-gray-400"> / {t.unlimited}</span>
        ) : (
          <span className="text-base text-gray-400"> / {limit}</span>
        )}
      </motion.p>
      {!unlimited && (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn("h-full rounded-full transition-all", near ? "bg-amber-500" : "bg-sky-600")}
            />
          </div>
          <AnimatePresence>
            {near && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400"
              >
                Snart slut — uppgradera för obegränsade skanningar.
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}