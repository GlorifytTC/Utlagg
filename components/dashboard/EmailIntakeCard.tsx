"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Shows the user's personal receipt-forwarding address (fetched from
 * /api/inbound/address, which mints the token on first view). Hidden when the
 * inbound domain isn't provisioned. Copy button, no scanning involved.
 */
export function EmailIntakeCard() {
  const { t } = useLanguage();
  const [address, setAddress] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/inbound/address")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setEnabled(Boolean(d.enabled && d.address));
        setAddress(d.address ?? null);
      })
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, []);

  // Nothing to show until we know, and skip entirely when not provisioned.
  if (enabled === false || !address) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-900/[0.07] dark:border-white/[0.08]">
      <div className="border-b border-gray-900/[0.07] bg-[#F5F4F0] px-6 py-4 dark:border-white/[0.08] dark:bg-[#0D0D0D]">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{t.setEmailIntakeTitle}</p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t.setEmailIntakeDesc}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 bg-[#F5F4F0] px-6 py-4 dark:bg-[#0D0D0D]">
        <code className="flex-1 truncate rounded-xl border border-gray-900/[0.10] bg-white px-3 py-2 text-sm text-gray-800 dark:border-white/[0.10] dark:bg-black/40 dark:text-gray-200">
          {address}
        </code>
        <button
          onClick={copy}
          className="rounded-xl border border-gray-900/[0.10] px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-900/[0.20] hover:bg-gray-900/[0.04] active:scale-[0.98] active:opacity-80 dark:border-white/[0.10] dark:text-gray-300 dark:hover:bg-white/[0.06]"
        >
          {copied ? t.btnCopied : t.btnCopy}
        </button>
      </div>
    </div>
  );
}
