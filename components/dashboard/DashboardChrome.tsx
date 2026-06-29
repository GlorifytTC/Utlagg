"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home, Receipt, CreditCard, BarChart3, Settings, User, LogOut, Moon, Sun, Menu, X, Car, CheckSquare, Plug, Lock, Building2, FileText, TrainFront, Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { IdleLogout } from "@/components/IdleLogout";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { hasFeature, type Feature } from "@/lib/features";
import type { Tier } from "@/lib/plans";

const nav = [
  { key: "navOverview", href: "/dashboard", icon: Home },
  { key: "navReceipts", href: "/dashboard/receipts", icon: Receipt },
  { key: "navMileage", href: "/dashboard/mileage", icon: Car, feature: "mileage" as Feature },
  { key: "navTransport", href: "/dashboard/transport", icon: TrainFront },
  { key: "navApprovals", href: "/dashboard/approvals", icon: CheckSquare, feature: "approvals" as Feature },
  { key: "navExport", href: "/dashboard/export", icon: Download },
  { key: "navIntegrations", href: "/dashboard/integrations", icon: Plug, feature: "fortnox" as Feature },
  { key: "navSubscription", href: "/dashboard/subscription", icon: CreditCard },
  { key: "navStats", href: "/dashboard/stats", icon: BarChart3 },
  { key: "navInvoices", href: "/dashboard/invoices", icon: FileText, feature: "invoicing" as Feature },
  { key: "navCompany", href: "/dashboard/company", icon: Building2 },
  { key: "navSettings", href: "/dashboard/settings", icon: Settings },
  { key: "navProfile", href: "/dashboard/profile", icon: User },
];

const bottomNav = nav.filter((n) => ["/dashboard", "/dashboard/receipts", "/dashboard/stats", "/dashboard/subscription", "/dashboard/profile"].includes(n.href));

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavList({ onNavigate, tier }: { onNavigate?: () => void; tier?: Tier }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, toggleLanguage } = useLanguage();
  const dark = theme === "dark";

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-5 pt-6">
        <Link href="/" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 focus-visible:rounded-md">
          <span className="font-display text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">Utlägg</span>
        </Link>
        <p className="mt-0.5 text-[9.5px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">Expense Management</p>
      </div>
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
        <p className="mb-1.5 px-2.5 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Menu</p>
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
                      ? "bg-gray-900/[0.07] text-gray-900 dark:bg-white/[0.07] dark:text-white"
                      : "text-gray-500 hover:bg-gray-900/[0.04] hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
                  )}
                >
                  <Icon className={cn("h-[15px] w-[15px] shrink-0 transition-opacity", active ? "opacity-90" : "opacity-40 group-hover:opacity-60")} strokeWidth={1.75} />
                  <span className="flex-1">{t[item.key as keyof Translations]}</span>
                  {tier && "feature" in item && !hasFeature(tier, (item as { feature: Feature }).feature) && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-px border-t border-gray-900/[0.06] p-3 dark:border-white/[0.06]">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { toggleLanguage(); router.refresh(); }} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm text-gray-500 hover:bg-gray-900/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
          <span className="h-[15px] w-[15px] text-center text-xs font-bold">{lang === "sv" ? "EN" : "SV"}</span>
          <span>{lang === "sv" ? "English" : "Svenska"}</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={toggleTheme} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm text-gray-500 hover:bg-gray-900/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white">
          {dark ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
          <span>{dark ? t.btnLightMode : t.btnDarkMode}</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm text-red-600 hover:bg-red-50/70 dark:hover:bg-red-950/25">
          <LogOut className="h-[15px] w-[15px]" />
          <span>{t.navLogout}</span>
        </motion.button>
      </div>
    </div>
  );
}

export function DashboardChrome({ children, tier }: { children: React.ReactNode; tier?: Tier }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-[#F5F4F0] dark:bg-black print:bg-white print:min-h-0">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] dark:hidden print:hidden" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden dark:hidden">
        <div className="absolute -top-24 left-[22%] h-[440px] w-[440px] rounded-full bg-sky-200/20 blur-[110px]" />
        <div className="absolute bottom-0 right-[12%] h-80 w-80 rounded-full bg-stone-300/20 blur-[90px]" />
      </div>
      <IdleLogout />
      <aside className="fixed left-0 top-0 hidden h-full w-60 border-r border-gray-900/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] lg:block print:hidden">
        <NavList tier={tier} />
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-900/[0.07] bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] lg:hidden print:hidden">
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} aria-label="Öppna meny" className="rounded-lg p-2 hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.04]">
            <Menu className="h-6 w-6" />
          </motion.button>
          <Link href="/" className="font-display text-lg font-semibold">Utlägg</Link>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => signOut({ callbackUrl: "/" })} aria-label={t.navLogout} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50/70 dark:hover:bg-red-950/25">
          <LogOut className="h-5 w-5" />
          <span className="hidden sm:inline">{t.navLogout}</span>
        </motion.button>
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
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(false)} aria-label="Stäng meny" className="absolute right-3 top-3 rounded-lg p-2 hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.04]">
                <X className="h-5 w-5" />
              </motion.button>
              <NavList onNavigate={() => setOpen(false)} tier={tier} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="min-h-screen p-4 pb-24 sm:p-6 md:pb-8 lg:ml-64 lg:p-8 print:ml-0 print:min-h-0 print:p-0">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-gray-900/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] md:hidden print:hidden">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <motion.div key={item.href} whileTap={{ scale: 0.95 }}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] transition-colors",
                  active ? "text-sky-600 dark:text-sky-300" : "text-gray-500 dark:text-gray-500",
                )}
              >
                <Icon className="h-5 w-5" />
                {t[item.key as keyof Translations]}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}