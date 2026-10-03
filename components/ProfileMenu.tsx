"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Globe, LogOut, Moon, Settings, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";

const itemClass =
  "flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-900/[0.04] focus-visible:bg-gray-900/[0.04] focus-visible:outline-none dark:text-gray-300 dark:hover:bg-white/[0.05] dark:focus-visible:bg-white/[0.05]";

/**
 * Top-right account menu shared by the user dashboard and the accountant
 * workspace: avatar -> name/email, settings, language, theme, sign out.
 * `logoEndpoint` is the role's own GET `{ logoUrl }` route; ProfileCard
 * dispatches "accountant-logo-updated" after a save so the avatar stays fresh.
 */
export function ProfileMenu({
  logoEndpoint,
  settingsHref,
  links = [],
}: {
  logoEndpoint: string;
  settingsHref: string;
  links?: { href: string; label: string; icon: LucideIcon }[];
}) {
  const { t, lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dark = theme === "dark";
  const name = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    fetch(logoEndpoint)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setLogo(d.logoUrl ?? null))
      .catch(() => {});
    const onUpdate = (e: Event) => setLogo((e as CustomEvent<string | null>).detail);
    window.addEventListener("accountant-logo-updated", onUpdate);
    return () => window.removeEventListener("accountant-logo-updated", onUpdate);
  }, [logoEndpoint]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={name || t.menuProfile}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-gray-900/10 bg-white transition duration-300 ease-premium hover:border-nordic-600/50 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:border-white/[0.15] dark:bg-white/[0.06] dark:hover:border-nordic-600/60"
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{initial}</span>
        )}
      </button>

      {open && (
        <div role="menu" className="panel absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl py-1">
          {(name || email) && (
            <div className="border-b border-gray-900/[0.06] px-4 py-3 dark:border-white/[0.06]">
              {name && <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{name}</p>}
              {email && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{email}</p>}
            </div>
          )}
          <Link href={settingsHref} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <Settings className="h-4 w-4 opacity-60" strokeWidth={1.75} />
            {t.navSettings}
          </Link>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <Icon className="h-4 w-4 opacity-60" strokeWidth={1.75} />
              {label}
            </Link>
          ))}
          <div className="my-1 border-t border-gray-900/[0.06] dark:border-white/[0.06]" />
          <button role="menuitem" onClick={() => { toggleLanguage(); router.refresh(); }} className={itemClass}>
            <Globe className="h-4 w-4 opacity-60" strokeWidth={1.75} />
            {lang === "sv" ? "English" : "Svenska"}
          </button>
          <button role="menuitem" onClick={toggleTheme} className={itemClass}>
            {dark ? <Sun className="h-4 w-4 opacity-60" strokeWidth={1.75} /> : <Moon className="h-4 w-4 opacity-60" strokeWidth={1.75} />}
            {dark ? t.btnLightMode : t.btnDarkMode}
          </button>
          <div className="my-1 border-t border-gray-900/[0.06] dark:border-white/[0.06]" />
          <button
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50/70 focus-visible:bg-red-50/70 focus-visible:outline-none dark:text-red-400 dark:hover:bg-red-950/25"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {t.navLogout}
          </button>
        </div>
      )}
    </div>
  );
}
