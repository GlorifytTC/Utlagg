"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, Inbox, Store, LogOut, Moon, Sun, Menu, X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { AccountantAvatarMenu } from "@/components/accountant/AccountantAvatarMenu";

const nav = [
  { key: "navOverview" as const, href: "/accountant", icon: Home },
  { key: "navRequests" as const, href: "/accountant/requests", icon: Inbox },
  { key: "navMarketplace" as const, href: "/accountant/marketplace", icon: Store },
  { key: "navTeam" as const, href: "/accountant/team", icon: Users },
];

function isActive(pathname: string, href: string) {
  return href === "/accountant" ? pathname === href : pathname.startsWith(href);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, toggleLanguage } = useLanguage();
  const at = accountantStrings(lang);
  const dark = theme === "dark";

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <Link href="/" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30 focus-visible:rounded-md">
          <Logo size={26} wordmarkClassName="text-[17px] text-gray-900 dark:text-white" />
        </Link>
        <p className="mt-0.5 text-[9.5px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-400">{at.sidebarSubtitle}</p>
      </div>
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
        <p className="mb-1.5 px-2.5 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-400">{t.navMenu}</p>
        <ul className="space-y-px">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm transition-colors duration-150",
                    active
                      ? "bg-nordic-600/10 text-nordic-600 font-medium dark:bg-nordic-600/[0.16] dark:text-nordic-600"
                      : "text-gray-500 hover:bg-gray-900/[0.04] hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
                  )}
                >
                  <Icon className={cn("h-[15px] w-[15px] shrink-0 transition-opacity", active ? "opacity-90" : "opacity-40 group-hover:opacity-60")} strokeWidth={1.75} />
                  <span className="flex-1">{at[item.key]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-px border-t border-gray-900/[0.06] p-3 dark:border-white/[0.06]">
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => { toggleLanguage(); router.refresh(); }} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm text-gray-500 hover:bg-gray-900/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
          <span className="h-[15px] w-[15px] text-center text-xs font-bold">{lang === "sv" ? "EN" : "SV"}</span>
          <span>{lang === "sv" ? "English" : "Svenska"}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.98 }} onClick={toggleTheme} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm text-gray-500 hover:bg-gray-900/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
          {dark ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
          <span>{dark ? t.btnLightMode : t.btnDarkMode}</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm text-red-600 hover:bg-red-50/70 dark:hover:bg-red-950/25">
          <LogOut className="h-[15px] w-[15px]" />
          <span>{t.navLogout}</span>
        </motion.button>
        <div className="mt-1 border-t border-gray-900/[0.06] pt-2 dark:border-white/[0.06]">
          <SidebarProfile />
        </div>
      </div>
    </div>
  );
}

/**
 * Profile row at the bottom of the desktop sidebar: shows the accountant's
 * picture (their logoUrl) and opens the same profile/logo/settings menu, so the
 * profile picture is visible on desktop, not only in the mobile header.
 */
function SidebarProfile() {
  return (
    <div className="flex items-center gap-2 px-1.5">
      <AccountantAvatarMenu />
    </div>
  );
}

export function AccountantChrome({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLanguage();
  const at = accountantStrings(lang);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-[#F5F4F0] dark:bg-black dark:text-gray-100 print:bg-white print:min-h-0">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] dark:hidden print:hidden" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden dark:hidden">
        <div className="absolute -top-24 left-[22%] h-[440px] w-[440px] rounded-full bg-nordic-600/[0.07] blur-[110px]" />
        <div className="absolute bottom-0 right-[12%] h-80 w-80 rounded-full bg-stone-300/20 blur-[90px]" />
      </div>
      <aside className="fixed left-0 top-0 hidden h-full w-60 border-r border-gray-900/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] lg:block print:hidden">
        <NavList />
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-900/[0.07] bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] lg:hidden print:hidden">
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} aria-label="Öppna meny" className="rounded-lg p-2 hover:bg-gray-900/[0.04] dark:text-white dark:hover:bg-white/[0.04]">
            <Menu className="h-6 w-6" />
          </motion.button>
          <Link href="/" aria-label="Kvittino"><LogoMark size={26} /></Link>
        </div>
        <AccountantAvatarMenu />
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden print:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-xl dark:bg-[#0A0A0A]"
            >
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(false)} aria-label="Stäng meny" className="absolute right-3 top-3 rounded-lg p-2 hover:bg-gray-900/[0.04] dark:text-white dark:hover:bg-white/[0.04]">
                <X className="h-5 w-5" />
              </motion.button>
              <NavList onNavigate={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="min-h-screen p-4 pb-24 sm:p-6 md:pb-8 lg:ml-64 lg:p-8 print:ml-0 print:min-h-0 print:p-0">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t border-gray-900/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] md:hidden print:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <motion.div key={item.href} whileTap={{ scale: 0.95 }}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] transition-colors",
                  active ? "text-nordic-600 dark:text-nordic-600" : "text-gray-500 dark:text-gray-400",
                )}
              >
                <Icon className="h-5 w-5" />
                {at[item.key]}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}
