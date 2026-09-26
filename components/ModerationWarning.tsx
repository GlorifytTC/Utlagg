"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";

/** Shows a moderator warning once, the next time the warned user opens the app. */
export function ModerationWarning() {
  const { status } = useSession();
  const { t } = useLanguage();
  const [warning, setWarning] = useState<string | null>(null);

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

  if (warning === null) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="moderation-warning-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-[#111]"
      >
        <h2 id="moderation-warning-title" className="font-display text-lg font-semibold text-gray-900 dark:text-white">
          {t.moderationWarningTitle}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t.moderationWarningBody}</p>
        {warning && (
          <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-white/[0.04] dark:text-gray-300">
            {warning}
          </p>
        )}
        <button
          autoFocus
          onClick={() => setWarning(null)}
          className="mt-5 w-full rounded-lg bg-nordic-600 px-4 py-2 text-sm font-medium text-white hover:bg-nordic-700"
        >
          {t.moderationWarningOk}
        </button>
      </div>
    </div>
  );
}
