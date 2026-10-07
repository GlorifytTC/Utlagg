"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/Logo";
import { useFocusTrap } from "@/components/useFocusTrap";

// Shared chrome for the signed-in app: the user dashboard and the accountant
// workspace differ only in their nav contents, so both render through this.

export const iconBtn =
  "grid h-11 w-11 place-items-center rounded-full text-gray-500 transition duration-300 ease-premium hover:bg-gray-900/[0.05] hover:text-gray-900 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-white lg:h-8 lg:w-8";

export function navItemClass(active: boolean) {
  return cn(
    "group flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition duration-300 ease-premium active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 lg:py-1.5 lg:text-sm lg:[@media(max-height:860px)]:py-1",
    active
      ? "bg-nordic-600/[0.09] font-medium text-nordic-700 dark:bg-nordic-600/[0.16] dark:text-nordic-300"
      : "text-gray-600 hover:bg-gray-900/[0.04] hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
  );
}

export function navIconClass(active: boolean) {
  return cn(
    "h-[18px] w-[18px] transition-opacity",
    active ? "opacity-100" : "opacity-55 group-hover:opacity-90",
  );
}

export function NotifBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <motion.span
      key="badge"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
      className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nordic-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#fffefb] dark:ring-[#0d0d0d]"
    >
      {n > 9 ? "9+" : n}
    </motion.span>
  );
}

export type BottomNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
};

export function AppShell({
  homeHref,
  renderNav,
  headerEnd,
  bottomNav,
  children,
}: {
  homeHref: string;
  /** Sidebar contents; rendered in the desktop rail and the mobile drawer. */
  renderNav: (p: { onNavigate?: () => void; onClose?: () => void }) => React.ReactNode;
  headerEnd: React.ReactNode;
  bottomNav: BottomNavItem[];
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  useFocusTrap(open, drawerRef);

  // Drawer: lock page scroll underneath and close on Escape.
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

  return (
    <div className="app-shell relative min-h-dvh bg-[#F5F4F0] dark:bg-black dark:text-gray-100 print:bg-white print:min-h-0">
      {/* Canvas texture + one warm glow; fixed layers, light theme only */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] dark:hidden print:hidden" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden dark:hidden">
        <div className="absolute -top-24 left-[22%] h-[440px] w-[440px] rounded-full bg-nordic-600/[0.07] blur-[110px]" />
        <div className="absolute bottom-0 right-[12%] h-80 w-80 rounded-full bg-stone-300/20 blur-[90px]" />
      </div>

      {/* Desktop rail: a floating panel inset from the viewport edge */}
      <aside className="panel fixed bottom-3 left-3 top-3 z-30 hidden w-60 overflow-hidden rounded-[1.5rem] lg:block print:hidden">
        {renderNav({})}
      </aside>

      {/* Mobile top bar: floating pill */}
      <header className="pointer-events-none sticky top-0 z-30 bg-[#F5F4F0]/80 px-3 pb-2 pt-3 backdrop-blur dark:bg-black/80 lg:hidden print:hidden">
        <div className="panel pointer-events-auto flex h-14 items-center justify-between rounded-full py-2 pl-2 pr-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setOpen(true)} aria-label={t.openMenu} aria-expanded={open} className={iconBtn}>
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <Link href={homeHref} aria-label="Kvittino" className="rounded-full p-1">
              <LogoMark size={26} />
            </Link>
          </div>
          {headerEnd}
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 lg:hidden print:hidden"
          >
            <div aria-hidden="true" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label={t.openMenu}
              initial={{ x: "-105%" }}
              animate={{ x: 0 }}
              exit={{ x: "-105%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.45 }}
              className="panel absolute bottom-3 left-3 top-3 w-72 max-w-[85%] overflow-hidden rounded-[1.5rem]"
            >
              {renderNav({ onNavigate: () => setOpen(false), onClose: () => setOpen(false) })}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop top bar: account menu lives top-right, where people look for it */}
      <div className="relative z-30 hidden h-16 px-6 pt-3 lg:ml-[16.5rem] lg:block xl:px-8 print:hidden"><div className="mx-auto flex h-full max-w-[96rem] items-center justify-end">{headerEnd}</div></div>

      {/* No z-index here: page modals use fixed z-50 and must stack above the rail */}
      <main className="min-h-[calc(100dvh-4.25rem)] p-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-8 lg:ml-[16.5rem] lg:min-h-[calc(100dvh-4rem)] lg:p-6 lg:pt-2 xl:p-8 xl:pt-2 print:ml-0 print:min-h-0 print:p-0">
        <div className="mx-auto max-w-[96rem]">{children}</div>
      </main>

      {/* Mobile bottom bar: floating, clear of the home indicator */}
      <nav className="panel fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-5 rounded-[1.25rem] p-1 md:hidden print:hidden">
        {bottomNav.map(({ href, label, icon: Icon, active, badge }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl px-0.5 py-2 text-xs font-medium leading-tight transition duration-300 ease-premium active:scale-95",
              active ? "bg-nordic-600/[0.09] text-nordic-700 dark:text-nordic-300" : "text-gray-500 dark:text-gray-400",
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <AnimatePresence>{badge ? <NotifBadge n={badge} /> : null}</AnimatePresence>
            </span>
            <span className="max-w-full break-words text-center">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
