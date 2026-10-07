"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

/** Shows a moderator warning once, the next time the warned user opens the app. */
export function ModerationWarning() {
  const { status } = useSession();
  const { t } = useLanguage();
  const [warning, setWarning] = useState<string | null>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/me/warning", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // Only ever set, never clear: a second (empty) response must not hide the popup.
        if (data?.warning != null) setWarning(data.warning);
      })
      .catch(() => {});
  }, [status]);

  // Modal behaviour: focus the only button, Escape dismisses, Tab stays on it (single focusable element = trap).
  const open = warning !== null;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWarning(null);
      else if (e.key === "Tab") {
        e.preventDefault();
        okRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open]);

  if (warning === null) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="moderation-warning-title"
        className="panel max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl p-6 text-gray-900 dark:text-white"
      >
        <h2 id="moderation-warning-title" className="font-display text-lg font-semibold">
          {t.moderationWarningTitle}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t.moderationWarningBody}</p>
        {warning && (
          <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-white/[0.04] dark:text-gray-300">
            {warning}
          </p>
        )}
        <Button ref={okRef} onClick={() => setWarning(null)} className="mt-5 w-full">
          {t.moderationWarningOk}
        </Button>
      </div>
    </div>
  );
}
