"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { LogoUploader } from "@/components/dashboard/LogoUploader";

/**
 * Avatar menu in the accountant header (replaces the "Till mitt konto" button).
 * Click the avatar → a panel to set the profile picture and firm logo, a link
 * to the full account, a language toggle, and Sign out at the bottom.
 *
 * Profile pic and firm logo are the accountant's own `logoUrl` split by intent;
 * both use GET/PATCH /api/accountant/logo (own record, server-authorized).
 * (Profile picture reuses the same field for now — a dedicated avatar field is
 * part of the firm-accounts plan.)
 */
export function AccountantAvatarMenu() {
  const { lang, setLanguage } = useLanguage();
  const t = accountantStrings(lang);
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/accountant/logo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setLogo(d.logoUrl ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function saveLogo(dataUrl: string | null) {
    const res = await fetch("/api/accountant/logo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logoUrl: dataUrl }),
    });
    if (res.ok) setLogo(dataUrl);
    else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? t.error);
      throw new Error();
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t.menuProfileLabel}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white transition-colors hover:border-gray-900/40 dark:border-white/[0.15] dark:bg-white/[0.06] dark:hover:border-white/40"
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={t.menuProfileLabel} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">R</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-gray-900/[0.12] bg-white/75 py-1 shadow-lg backdrop-blur-xl dark:border-white/[0.12] dark:bg-[#111]">
          <div className="px-4 py-3">
            <p className="mb-3 text-[9.5px] font-medium uppercase tracking-[0.16em] text-gray-400">
              {t.menuProfile}
            </p>
            <LogoUploader value={logo} label={t.menuProfilePic} onSave={saveLogo} />
          </div>

          <div className="border-t border-gray-900/[0.07] pt-1 dark:border-white/[0.07]">
            <div className="flex gap-1.5 px-4 py-2">
              <button
                onClick={() => setLanguage("sv")}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${lang === "sv" ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900" : "border-gray-900/[0.12] text-gray-500 hover:border-gray-900/30 dark:border-white/[0.12] dark:text-gray-400"}`}
              >
                Svenska
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${lang === "en" ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900" : "border-gray-900/[0.12] text-gray-500 hover:border-gray-900/30 dark:border-white/[0.12] dark:text-gray-400"}`}
              >
                English
              </button>
            </div>

            <Link
              href="/accountant/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-900/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.04]"
            >
              {t.navSettings}
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-900/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.04]"
            >
              {t.menuAccount}
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50/70 dark:hover:bg-red-950/25"
            >
              {t.menuLogout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
