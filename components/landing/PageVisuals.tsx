"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Check } from "./HeroVisual";

// Decorative, light-only visuals for the marketing subpages. Same rules as
// HeroVisual: plain DOM (crisp at any DPR), springs, reduced-motion = final state.

const pop = { type: "spring", bounce: 0.45, duration: 0.5 } as const;

/** Features hero: a mixed-VAT hotel receipt annotated with VAT rate + BAS account per line.
 *  Above the fold, so it animates on mount rather than on scroll-into-view. */
export function VatSplitVisual() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  // 12 %: (1 120 + 145) × 12/112 = 135,54 · 25 %: 180 × 25/125 = 36,00
  const lines = [
    { name: t.fvRecLodging, amount: "1 120,00", vat: "12 %", bas: "5831" },
    { name: t.fvRecBreakfast, amount: "145,00", vat: "12 %", bas: "5831" },
    { name: t.fvRecParking, amount: "180,00", vat: "25 %", bas: "5890" },
  ];
  const chip = (i: number) => ({
    initial: reduced ? false : ({ scale: 0.5, opacity: 0 } as const),
    animate: { scale: 1, opacity: 1 },
    transition: { ...pop, delay: 0.3 + i * 0.15 },
  });

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none pb-24">
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.14),transparent_70%)]" />

      {/* drop-shadow on the wrapper: box-shadow would be clipped by the zigzag mask */}
      <div className="relative -rotate-2 [filter:drop-shadow(0_18px_22px_rgba(26,26,26,0.16))]">
        <div className="receipt-edge bg-[#FFFDF8] px-6 pb-10 pt-6 font-mono text-[11px] leading-5 text-ink/70">
          <p className="text-center font-sans text-sm font-bold tracking-wide text-ink">
            HOTELL NORRSKEN
          </p>
          <p className="mb-3 text-center">Storgatan 7 · Luleå</p>
          <div className="space-y-2 border-t border-dashed border-ink/20 pt-3">
            {lines.map((l, i) => (
              <div key={l.name} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{l.name}</span>
                <motion.span
                  {...chip(i)}
                  className="rounded-full bg-nordic-50 px-2 py-0.5 font-sans text-[10px] font-semibold text-nordic-700"
                >
                  {l.vat}
                </motion.span>
                <motion.span
                  {...chip(i)}
                  className="rounded-full bg-ink/5 px-2 py-0.5 font-sans text-[10px] font-semibold text-ink/70"
                >
                  BAS {l.bas}
                </motion.span>
                <span className="w-16 text-right">{l.amount}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-dashed border-ink/20 pt-2 font-bold text-ink">
            <span>{t.heroVisualTotal}</span>
            <span>1 445,00</span>
          </div>
        </div>
      </div>

      {/* The VAT split the app books */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...pop, delay: 0.85 }}
        className="absolute bottom-0 right-0 w-64 rounded-2xl bg-white/95 p-4 text-sm shadow-[0_1px_2px_rgba(26,26,26,0.06),0_24px_60px_-16px_rgba(26,26,26,0.3)] ring-1 ring-ink/5"
      >
        <Split label={`${t.heroVisualVat} 12 %`} value="135,54 kr" />
        <Split label={`${t.heroVisualVat} 25 %`} value="36,00 kr" />
        <div className="mt-2 flex items-center justify-between border-t border-ink/5 pt-2">
          <span className="text-ink/50">{t.fvRecToApprove}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            1 445,00 kr
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function Split({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-ink/50">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

/** Pricing bottom CTA: what the trial looks like, day by day — risk reversal made concrete. */
export function TrialVisual() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const steps = [
    { when: t.trialToday, body: t.trialTodayBody },
    { when: t.trialDuring, body: t.trialDuringBody },
    { when: t.trialEnd, body: t.trialEndBody },
  ];

  return (
    <div
      aria-hidden
      className="w-full max-w-sm select-none rounded-2xl bg-white/95 p-6 text-left shadow-[0_1px_2px_rgba(26,26,26,0.06),0_24px_60px_-16px_rgba(26,26,26,0.3)] ring-1 ring-ink/5"
    >
      <p className="text-sm font-semibold text-ink">{t.trialTitle}</p>
      <ol className="relative mt-5 space-y-5">
        {/* Connector line behind the dots */}
        <motion.span
          initial={reduced ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", bounce: 0, duration: 0.9, delay: 0.2 }}
          className="absolute bottom-2 left-[5px] top-2 w-px origin-top bg-ink/15"
        />
        {steps.map((s, i) => (
          <li key={s.when} className="relative flex gap-4">
            <motion.span
              initial={reduced ? false : { scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ ...pop, delay: 0.2 + i * 0.25 }}
              className={`mt-1 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-white ${i === 0 ? "bg-nordic-600" : "bg-ink/25"}`}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{s.when}</p>
              <p className="mt-0.5 text-sm text-ink">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <Check className="h-3.5 w-3.5" />
        {t.trialNoCard}
      </p>
    </div>
  );
}
