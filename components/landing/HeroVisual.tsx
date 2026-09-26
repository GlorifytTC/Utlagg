"use client";

import { useEffect, useState, type PointerEvent } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

// One loop of the product story: 0 scanning → 1 fields read → 2 approved → 3 ready for payout.
// Starts at 1 so the first paint already shows a filled-in expense.
const STEP_MS = [1600, 1700, 1500, 2800];
const pop = { type: "spring", bounce: 0.45, duration: 0.5 } as const;
const settle = { type: "spring", bounce: 0, duration: 0.45 } as const;

// Landing page is light-only, so this visual deliberately has no dark: variants.
export function HeroVisual() {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (reduced) {
      setStep(3);
      return;
    }
    const id = setTimeout(
      () => setStep((s) => (s + 1) % STEP_MS.length),
      STEP_MS[step],
    );
    return () => clearTimeout(id);
  }, [step, reduced]);

  // Pointer tilt on springs — follows the cursor, retargets mid-flight, eases home on leave.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), {
    stiffness: 150,
    damping: 18,
  });

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div
      aria-hidden
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative hidden h-[520px] select-none md:block [perspective:1200px]"
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="absolute inset-0 [transform-style:preserve-3d]"
      >
        {/* Soft accent glow ties the stack into the ambient blobs behind it */}
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.16),transparent_70%)]" />

        {/* Paper receipt */}
        {/* drop-shadow on the wrapper: box-shadow would be clipped by the zigzag mask */}
        <div className="absolute left-[6%] top-10 w-[240px] -rotate-6 [filter:drop-shadow(0_18px_22px_rgba(26,26,26,0.18))]">
          <div className="receipt-edge relative bg-[#FFFDF8] px-6 pb-9 pt-6 font-mono text-[11px] leading-5 text-ink/70">
            <p className="text-center font-sans text-sm font-bold tracking-wide text-ink">
              CAFÉ LINNEA
            </p>
            <p className="text-center">Götgatan 14 · Stockholm</p>
            <p className="mb-3 text-center">2026-09-18 12:41</p>
            <div className="border-t border-dashed border-ink/20 pt-2">
              <Row a={t.heroVisualItem1} b="118,00" />
              <Row a={t.heroVisualItem2} b="30,00" />
            </div>
            <div className="mt-2 border-t border-dashed border-ink/20 pt-2">
              <Row a={t.heroVisualVat} b="15,86" />
              <Row a={t.heroVisualTotal} b="148,00" strong />
            </div>
            <div className="mx-auto mt-4 h-6 w-3/4 bg-[repeating-linear-gradient(90deg,currentColor_0_2px,transparent_2px_4px,currentColor_4px_5px,transparent_5px_8px)] opacity-40" />

            {/* Scan beam */}
            <AnimatePresence>
              {step === 0 && (
                <motion.div
                  key="beam"
                  className="absolute inset-x-2 top-0 h-[3px] rounded-full bg-nordic-600 shadow-[0_0_18px_4px_rgb(var(--accent)/0.45)]"
                  initial={{ top: "6%", opacity: 0 }}
                  animate={{ top: ["6%", "90%", "6%"], opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    top: { duration: 1.6, ease: "easeInOut" },
                    opacity: { duration: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <ExpenseCard
          step={step}
          className="absolute bottom-4 right-0 w-[300px]"
          style={{ transform: "translateZ(40px)" }}
        />

        {/* Approval toast — the moment of relief */}
        <AnimatePresence>
          {step === 3 && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
              transition={pop}
              className="absolute right-6 top-14 flex items-center gap-3 rounded-full bg-ink py-2.5 pl-2.5 pr-5 text-sm font-medium text-white shadow-xl"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-nordic-600 text-white">
                <Check className="h-4 w-4" />
              </span>
              {t.heroVisualReady}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Mobile gets the finished card only — no receipt, tilt or loop.
export function HeroVisualMobile() {
  return (
    <div aria-hidden className="mt-10 select-none md:hidden">
      <ExpenseCard step={3} className="max-w-sm" />
    </div>
  );
}

// The expense as the employee sees it in the app.
function ExpenseCard({
  step,
  className,
  style,
}: {
  step: number;
  className: string;
  style?: React.CSSProperties;
}) {
  const { t } = useLanguage();
  const approved = step >= 2;
  const fields: [string, string][] = [
    [t.heroVisualVendor, "Café Linnea"],
    [t.heroVisualAmount, "148,00 kr"],
    [t.heroVisualVat, "12 % · 15,86 kr"],
    [t.heroVisualAccount, t.heroVisualAccountValue],
  ];

  return (
    <div
      className={`rounded-2xl bg-white/95 p-5 shadow-[0_1px_2px_rgba(26,26,26,0.06),0_24px_60px_-16px_rgba(26,26,26,0.3)] ring-1 ring-ink/5 ${className}`}
      style={style}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full light-surface bg-nordic-50 text-xs font-semibold text-nordic-700">
          AL
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{t.heroVisualNewExpense}</p>
          <p className="text-xs text-ink/50">Anna Lind · 18 sep</p>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={approved ? "ok" : "wait"}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={pop}
            className={
              approved
                ? "inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
            }
          >
            {approved && <Check className="h-3.5 w-3.5" />}
            {approved
              ? t.statusApproved
              : step === 0
                ? t.heroVisualReading
                : t.statusPending}
          </motion.span>
        </AnimatePresence>
      </div>

      <dl className="mt-4 space-y-2.5 border-t border-ink/5 pt-4 text-sm">
        {fields.map(([label, value], i) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <dt className="text-ink/50">{label}</dt>
            <dd className="relative h-5 min-w-[96px] text-right font-medium text-ink">
              <AnimatePresence initial={false}>
                {step >= 1 ? (
                  <motion.span
                    key="v"
                    className="absolute right-0 top-0 whitespace-nowrap"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ ...settle, delay: i * 0.08 }}
                  >
                    {value}
                  </motion.span>
                ) : (
                  <motion.span
                    key="s"
                    className="absolute right-0 top-1.5 h-2 w-20 rounded-full bg-ink/10"
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 flex items-center gap-2 border-t border-ink/5 pt-3 text-xs text-ink/50">
        <span className="h-1.5 w-1.5 rounded-full bg-nordic-600" />
        {t.heroVisualFortnox}
      </p>
    </div>
  );
}

export function Check({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function Row({ a, b, strong }: { a: string; b: string; strong?: boolean }) {
  return (
    <div
      className={`flex justify-between ${strong ? "font-bold text-ink" : ""}`}
    >
      <span>{a}</span>
      <span>{b}</span>
    </div>
  );
}
