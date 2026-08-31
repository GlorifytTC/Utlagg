// components/CookieConsent.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/translations";

// ── Constants ──────────────────────────────────────────────────────────────────

const CONSENT_KEY = "utlagg_cookie_consent";
const CONSENT_VER = "1.0";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ConsentPrefs = {
  necessary: true;
  functional: boolean;
  analytics: boolean;
};

type StoredConsent = ConsentPrefs & {
  version: string;
  timestamp: string;
};

type CategoryId = "necessary" | "functional" | "analytics";

// ── Exported hook — read consent anywhere in the app ───────────────────────────

export function useCookieConsent(): ConsentPrefs | null {
  const [prefs, setPrefs] = useState<ConsentPrefs | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return;
      const stored: StoredConsent = JSON.parse(raw);
      if (stored.version !== CONSENT_VER) return;
      setPrefs({
        necessary: true,
        functional: stored.functional,
        analytics: stored.analytics,
      });
    } catch {
      /* ignore malformed stored data */
    }
  }, []);
  return prefs;
}

// ── Category data ──────────────────────────────────────────────────────────────

function getCategories(t: Translations): {
  id: CategoryId;
  label: string;
  required: boolean;
  legalBasis: string;
  description: string;
  examples: string;
  retention: string;
}[] {
  return [
    {
      id: "necessary",
      label: t.cookieCatNecessaryLabel,
      required: true,
      legalBasis: t.cookieCatNecessaryBasis,
      description: t.cookieCatNecessaryDesc,
      examples: t.cookieCatNecessaryExamples,
      retention: t.cookieCatNecessaryRetention,
    },
    {
      id: "functional",
      label: t.cookieCatFunctionalLabel,
      required: false,
      legalBasis: t.cookieCatFunctionalBasis,
      description: t.cookieCatFunctionalDesc,
      examples: t.cookieCatFunctionalExamples,
      retention: t.cookieCatFunctionalRetention,
    },
    {
      id: "analytics",
      label: t.cookieCatAnalyticsLabel,
      required: false,
      legalBasis: t.cookieCatAnalyticsBasis,
      description: t.cookieCatAnalyticsDesc,
      examples: t.cookieCatAnalyticsExamples,
      retention: t.cookieCatAnalyticsRetention,
    },
  ];
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function IconChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label} cookies — ${checked ? "enabled" : "disabled"}`}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600 focus-visible:ring-offset-2",
        checked ? "bg-ink" : "bg-ink/15",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <motion.span
        animate={{ x: checked ? 25 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 left-0 h-4 w-4 rounded-full bg-paper shadow-sm"
      />
    </button>
  );
}

// ── Category row ───────────────────────────────────────────────────────────────

function CategoryRow({
  cat,
  value,
  onChange,
  t,
}: {
  cat: ReturnType<typeof getCategories>[number];
  value: boolean;
  onChange: (v: boolean) => void;
  t: Translations;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors",
        value && !cat.required
          ? "border-nordic-600/25 bg-nordic-600/[0.03]"
          : "hairline bg-white/30",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 text-ink/30"
          >
            <IconChevron />
          </motion.span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-display text-sm font-semibold text-ink">
                {cat.label}
              </span>
              {cat.required ? (
                <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/50">
                  {t.cookieAlwaysActive}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-xs text-ink/40">
              {cat.legalBasis}
            </p>
          </div>
        </button>
        <Toggle
          checked={value}
          onChange={onChange}
          disabled={cat.required}
          label={cat.label}
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 border-t hairline px-4 py-4">
              <p className="text-xs leading-relaxed text-ink/70">
                {cat.description}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/45">
                <span>
                  <span className="font-medium text-ink/55">{t.cookieExamples}:</span>{" "}
                  {cat.examples}
                </span>
                <span>
                  <span className="font-medium text-ink/55">{t.cookieRetention}:</span>{" "}
                  {cat.retention}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CookieConsent() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [prefs, setPrefs] = useState<Omit<ConsentPrefs, "necessary">>({
    functional: false,
    analytics: false,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) {
        setTimeout(() => setVisible(true), 900);
        return;
      }
      const stored: StoredConsent = JSON.parse(raw);
      if (stored.version !== CONSENT_VER) {
        setTimeout(() => setVisible(true), 900);
      }
    } catch {
      setTimeout(() => setVisible(true), 900);
    }
  }, []);

  function commit(overrides: Partial<Omit<ConsentPrefs, "necessary">>) {
    const final = { ...prefs, ...overrides };
    const record: StoredConsent = {
      necessary: true,
      ...final,
      version: CONSENT_VER,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    } catch {
      /* storage unavailable */
    }
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      setManaging(false);
    }, 420);
  }

  if (!visible) return null;

  const categories = getCategories(t);

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="cookie-consent"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 32, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="fixed bottom-0 left-0 right-0 z-[60] flex justify-center px-3 pb-3 sm:px-6 sm:pb-6"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border hairline bg-paper/95 shadow-[0_32px_80px_-12px_rgba(0,0,0,0.28)] backdrop-blur-2xl">

            {/* Top bar */}
            <div className="flex items-center gap-3 border-b hairline bg-grain px-5 py-3.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
                <IconShield />
              </span>
              <div className="flex-1">
                <p className="font-display text-sm font-semibold leading-tight text-ink">
                  {t.cookieTitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border hairline px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/40">
                  GDPR
                </span>
                <span className="rounded-full border hairline px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/40">
                  LEK
                </span>
                <span className="rounded-full border hairline px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/40">
                  IMY
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pt-5">
              <p className="text-sm leading-relaxed text-ink/70">
                {t.cookieBody}{" "}
                <Link
                  href="/legal/privacy"
                  className="text-nordic-600 underline decoration-dotted transition hover:decoration-solid"
                >
                  {t.cookiePrivacyLink}
                </Link>
                .
              </p>

              {/* Expandable preference manager */}
              <AnimatePresence initial={false}>
                {managing && (
                  <motion.div
                    key="manager"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 pt-4 pb-1">
                      {categories.map((cat) => (
                        <CategoryRow
                          key={cat.id}
                          cat={cat}
                          value={
                            cat.required
                              ? true
                              : prefs[cat.id as keyof typeof prefs]
                          }
                          onChange={(v) =>
                            setPrefs((p) => ({ ...p, [cat.id]: v }))
                          }
                          t={t}
                        />
                      ))}
                    </div>

                    <div className="mt-3 rounded-xl border hairline bg-white/30 px-4 py-3">
                      <p className="text-[11px] leading-relaxed text-ink/50">
                        <span className="font-medium text-ink/60">
                          {t.cookieDataController}:
                        </span>{" "}
                        {t.cookieDataControllerValue}{" "}
                        <span className="font-medium text-ink/60">
                          {t.cookieSupervisory}:
                        </span>{" "}
                        <a
                          href="https://www.imy.se"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-nordic-600 underline decoration-dotted transition hover:decoration-solid"
                        >
                          IMY — Integritetsskyddsmyndigheten
                        </a>
                        . {t.cookieGdprRights}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action row */}
            <div className="flex flex-wrap items-center gap-2 border-t hairline bg-grain px-5 py-4 mt-4">
              {/* Primary */}
              <button
                onClick={() => commit({ functional: true, analytics: true })}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-nordic-900"
              >
                {t.cookieAcceptAll}
              </button>

              {/* Equal-prominence reject — required by IMY guidance */}
              <button
                onClick={() => commit({ functional: false, analytics: false })}
                className="rounded-full border hairline px-5 py-2.5 text-sm font-medium text-ink/75 transition hover:border-ink/30 hover:text-ink"
              >
                {t.cookieRejectAll}
              </button>

              {/* Manage / Save */}
              <AnimatePresence mode="wait" initial={false}>
                {!managing ? (
                  <motion.button
                    key="manage"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => setManaging(true)}
                    className="ml-auto text-sm text-ink/45 underline decoration-dotted transition hover:text-ink hover:decoration-solid"
                  >
                    {t.cookieManage}
                  </motion.button>
                ) : (
                  <motion.button
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => commit({})}
                    className="ml-auto rounded-full border border-nordic-600/40 px-5 py-2.5 text-sm font-medium text-nordic-600 transition hover:border-nordic-600 hover:bg-nordic-600/5"
                  >
                    {t.cookieSave}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
