// components/landing/Navbar.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { useFocusTrap } from "@/components/useFocusTrap";

export function Navbar() {
  const { t, lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rm = useReducedMotion();
  const menuRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, menuRef);
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  // While the session is resolving, don't render either auth state to avoid a
  // flash of "Log in" for users who already have a valid session cookie.
  const authResolved = status !== "loading";

  // Full-screen menu: lock page scroll underneath and close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    { href: "/features", label: t.features },
    { href: "/pricing", label: t.pricing },
    { href: "/for-accountants", label: t.forFirms },
    { href: "/about", label: t.about },
    { href: "/contact", label: t.contact },
  ];

  const primary = isAuthed
    ? { href: "/dashboard", label: t.dashboard }
    : { href: "/register", label: t.startFree };

  return (
    <>
      {/* Floating island: the sticky wrapper keeps its space in the flow but lets
          clicks through its transparent margins. */}
      <header className="pointer-events-none sticky top-0 z-50 px-4 pt-4">
        <div className="pointer-events-auto mx-auto flex h-14 max-w-6xl 2xl:max-w-7xl items-center justify-between rounded-full border border-ink/[0.08] bg-paper/75 py-2 pl-5 pr-2 shadow-[0_8px_30px_-12px_rgba(60,40,25,0.18),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl">
          <Link href="/" onClick={() => setOpen(false)} className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
            <Logo size={26} wordmarkClassName="text-lg" adaptive={false} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={cn(
                  "rounded transition-colors duration-300 ease-premium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20",
                  pathname === l.href ? "font-medium text-ink" : "text-ink/65 hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              aria-label={t.navLanguage}
              className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-ink/65 transition hover:bg-ink/5 hover:text-ink lg:block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
            >
              {lang === "sv" ? "SV / EN" : "EN / SV"}
            </button>
            {authResolved && !isAuthed && (
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-1.5 text-sm text-ink/65 transition hover:text-ink lg:block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
              >
                {t.login}
              </Link>
            )}
            {authResolved && (
              <Link
                href={primary.href}
                className="hidden whitespace-nowrap rounded-full bg-nordic-600 px-3.5 py-2.5 text-xs font-medium text-white transition duration-500 ease-premium hover:bg-nordic-700 active:scale-[0.98] min-[380px]:block sm:px-5 sm:text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
              >
                {primary.label}
              </Link>
            )}

            {/* Mobile toggle: two bars morph into an X */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? t.navClose : t.navMenu}
              aria-expanded={open}
              className="relative grid h-11 w-11 place-items-center rounded-full transition hover:bg-ink/5 lg:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
            >
              <span
                className={cn(
                  "absolute h-[1.5px] w-5 rounded-full bg-ink transition duration-500 ease-premium",
                  open ? "rotate-45" : "-translate-y-[4px]",
                )}
              />
              <span
                className={cn(
                  "absolute h-[1.5px] w-5 rounded-full bg-ink transition duration-500 ease-premium",
                  open ? "-rotate-45" : "translate-y-[4px]",
                )}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu: full-screen glass overlay, links rise in sequence */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.navMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-paper/90 px-6 pb-10 pt-28 backdrop-blur-2xl lg:hidden"
          >
            <nav className="mx-auto flex max-w-md flex-col">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: rm ? 0 : 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.7, delay: 0.05 + i * 0.05 }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === l.href ? "page" : undefined}
                    className={cn(
                      "block rounded py-3 font-display text-4xl font-semibold tracking-tight transition active:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20",
                      pathname === l.href ? "text-nordic-700" : "text-ink",
                    )}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: rm ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.7, delay: 0.35 }}
                className="mt-10 flex flex-col gap-3 border-t hairline pt-8"
              >
                {authResolved && (
                  <Link
                    href={primary.href}
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-nordic-600 px-5 py-4 text-center font-medium text-white transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
                  >
                    {primary.label}
                  </Link>
                )}
                <div className="flex items-center justify-between">
                  {authResolved && !isAuthed ? (
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="inline-flex min-h-11 items-center rounded px-1 text-ink/70 transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
                    >
                      {t.login}
                    </Link>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={toggleLanguage}
                    className="min-h-11 rounded-full border hairline px-4 py-2 text-sm text-ink/70 transition hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20"
                  >
                    {lang === "sv" ? "Svenska / English" : "English / Svenska"}
                  </button>
                </div>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
