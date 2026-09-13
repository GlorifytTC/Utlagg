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
        aria-label="Profil"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white hover:border-ink/40 dark:border-white/15 dark:bg-white/[0.06]"
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="Profil" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-ink/60">R</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-gray-200 bg-paper p-4 shadow-lg dark:border-white/10 dark:bg-[#111]">
          <p className="mb-3 text-sm font-semibold text-ink">{t.menuProfile}</p>

          <div className="space-y-4">
            <LogoUploader value={logo} label={t.menuFirmLogo} onSave={saveLogo} />
          </div>

          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-white/[0.07]">
            <div className="mb-2 flex gap-2">
              <button
                onClick={() => setLanguage("sv")}
                className={`rounded-full border px-3 py-1 text-xs ${lang === "sv" ? "border-ink bg-ink text-paper" : "border-gray-200 text-ink/60 dark:border-white/10"}`}
              >
                Svenska
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`rounded-full border px-3 py-1 text-xs ${lang === "en" ? "border-ink bg-ink text-paper" : "border-gray-200 text-ink/60 dark:border-white/10"}`}
              >
                English
              </button>
            </div>

            <Link
              href="/dashboard"
              className="block rounded-lg px-2 py-2 text-sm text-ink/80 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            >
              {t.menuAccount}
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-1 block w-full rounded-lg px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50/70 dark:hover:bg-red-950/25"
            >
              {t.menuLogout}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
