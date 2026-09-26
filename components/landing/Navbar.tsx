// components/landing/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

export function Navbar() {
  const { t, lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  // While the session is resolving, don't render either auth state to avoid a
  // flash of "Log in" for users who already have a valid session cookie.
  const authResolved = status !== "loading";

  const links = [
    { href: "/features", label: t.features },
    { href: "/pricing", label: t.pricing },
    { href: "/for-accountants", label: t.forFirms },
    { href: "/about", label: t.about },
    { href: "/contact", label: t.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b hairline bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo size={30} wordmarkClassName="text-xl" adaptive={false} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative transition-colors",
                pathname === l.href ? "text-ink" : "text-ink/60 hover:text-ink",
              )}
            >
              {l.label}
              {pathname === l.href && (
                <span className="absolute -bottom-1.5 left-0 h-px w-full bg-nordic-600" />
              )}
            </Link>
          ))}
          <button
            onClick={toggleLanguage}
            aria-label="Language"
            className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-ink/60 transition hover:border-ink/40 hover:text-ink"
          >
            {lang === "sv" ? "SV / EN" : "EN / SV"}
          </button>
          {authResolved &&
            (isAuthed ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-nordic-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-nordic-700 active:scale-[0.97] active:opacity-90"
              >
                {t.dashboard}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-ink/60 transition hover:text-ink active:opacity-60"
                >
                  {t.login}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-nordic-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-nordic-700 active:scale-[0.97] active:opacity-90"
                >
                  {t.startFree}
                </Link>
              </>
            ))}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t.navClose : t.navMenu}
          aria-expanded={open}
          className="rounded-lg p-2 text-ink transition hover:bg-ink/5 md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            className="border-t hairline bg-paper/95 backdrop-blur-xl md:hidden"
          >
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4 text-base">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-3 transition active:scale-[0.98] active:opacity-80",
                    pathname === l.href ? "bg-ink/5 text-ink" : "text-ink/70 hover:bg-ink/5 hover:text-ink",
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-ink/10" />
              <button
                onClick={() => { toggleLanguage(); setOpen(false); }}
                className="rounded-lg px-3 py-3 text-left text-ink/70 transition hover:bg-ink/5 hover:text-ink active:scale-[0.98] active:opacity-80"
              >
                {lang === "sv" ? "Svenska / English" : "English / Svenska"}
              </button>
              {authResolved &&
                (isAuthed ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="mt-1 rounded-full bg-nordic-600 px-5 py-3 text-center font-medium text-white transition hover:bg-nordic-700 active:scale-[0.97] active:opacity-90"
                  >
                    {t.dashboard}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-ink/70 transition hover:bg-ink/5 hover:text-ink active:scale-[0.98] active:opacity-80"
                    >
                      {t.login}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="mt-1 rounded-full bg-nordic-600 px-5 py-3 text-center font-medium text-white transition hover:bg-nordic-700 active:scale-[0.97] active:opacity-90"
                    >
                      {t.startFree}
                    </Link>
                  </>
                ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
