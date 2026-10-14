"use client";

import { useId, useState } from "react";
import { HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Tiny inline "what does this mean?" explainer: a focusable icon button that
 * toggles a one-sentence popover (also on hover). Esc / blur closes it.
 */
export function Hint({ text }: { text: string }) {
  const { t } = useLanguage();
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={t.hintWhat}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="rounded-full text-gray-400 transition hover:text-gray-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:hover:text-gray-200"
      >
        <HelpCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-1.5 w-56 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-left text-xs font-normal leading-snug text-white shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
