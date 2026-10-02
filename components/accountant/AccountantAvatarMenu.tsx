"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

/**
 * Avatar menu in the accountant header (replaces the "Till mitt konto" button).
 * Click the avatar → links to settings and the user's account, and Sign out.
 * Picture, firm logo and language live in Settings now.
 */
export function AccountantAvatarMenu() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const initial = (session?.user?.name ?? session?.user?.email ?? "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    fetch("/api/accountant/logo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setLogo(d.logoUrl ?? null))
      .catch(() => {});
    // Settings announces a new picture so the header avatar doesn't go stale
    const onUpdate = (e: Event) => setLogo((e as CustomEvent<string | null>).detail);
    window.addEventListener("accountant-logo-updated", onUpdate);
    return () => window.removeEventListener("accountant-logo-updated", onUpdate);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t.menuProfileLabel}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-900/10 bg-white transition duration-300 ease-premium hover:border-nordic-600/50 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:border-white/[0.15] dark:bg-white/[0.06] dark:hover:border-nordic-600/60"
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt={t.menuProfileLabel} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{initial}</span>
        )}
      </button>

      {open && (
        <div className="panel absolute right-0 z-20 mt-2 max-h-[calc(100dvh-6rem)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl py-1">
          <div className="pt-1">
            <Link
              href="/accountant/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 min-h-11 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-900/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.04]"
            >
              {t.navSettings}
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 min-h-11 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-900/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.04]"
            >
              {t.menuAccount}
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 min-h-11 px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50/70 dark:hover:bg-red-950/25"
            >
              {t.menuLogout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
