"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home, Receipt, CreditCard, BarChart3, Settings, User, LogOut, Moon, Sun, Menu, X, Car, CheckSquare, Plug, Lock, Building2, FileText, TrainFront, Download, Store, MessageSquare, ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { IdleLogout } from "@/components/IdleLogout";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { hasFeature, type Feature } from "@/lib/features";
import type { Tier } from "@/lib/plans";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { NotifBadge } from "@/components/accountant/AccountantChrome";
import { useNotifications } from "@/context/NotificationContext";

const navGroups = [
  {
    labelSv: "Utgifter",
    labelEn: "Expenses",
    items: [
      { key: "navOverview", href: "/dashboard", icon: Home },
      { key: "navReceipts", href: "/dashboard/receipts", icon: Receipt },
      { key: "navMileage", href: "/dashboard/mileage", icon: Car, feature: "mileage" as Feature },
      { key: "navTransport", href: "/dashboard/transport", icon: TrainFront },
    ],
  },
  {
    labelSv: "Arbetsyta",
    labelEn: "Workspace",
    items: [
      { key: "navApprovals", href: "/dashboard/approvals", icon: CheckSquare, feature: "approvals" as Feature },
      { key: "navChats", href: "/dashboard/chats", icon: MessageSquare },
      { key: "navExport", href: "/dashboard/export", icon: Download },
      { key: "navIntegrations", href: "/dashboard/integrations", icon: Plug, feature: "fortnox" as Feature },
      { key: "navStats", href: "/dashboard/stats", icon: BarChart3 },
      { key: "navInvoices", href: "/dashboard/invoices", icon: FileText, feature: "invoicing" as Feature },
    ],
  },
  {
    labelSv: "Konto",
    labelEn: "Account",
    items: [
      { key: "navMarketplace", href: "/dashboard/marketplace", icon: Store },
      { key: "navCompany", href: "/dashboard/company", icon: Building2 },
      { key: "navSubscription", href: "/dashboard/subscription", icon: CreditCard },
      { key: "navSettings", href: "/dashboard/settings", icon: Settings },
      { key: "navProfile", href: "/dashboard/profile", icon: User },
    ],
  },
];

// Keep this flat array for the mobile bottom nav — it reads by href
const nav = navGroups.flatMap((g) => g.items);

const bottomNav = nav.filter((n) => ["/dashboard", "/dashboard/receipts", "/dashboard/stats", "/dashboard/subscription", "/dashboard/profile"].includes(n.href));

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

// Desktop only: lg:[@media(max-height:800px)] tightens rows on short laptop screens (1366×768) so every link
// fits without scrolling. The mobile drawer keeps touch-sized rows and a native scroll indicator.
const iconBtn = "grid h-10 w-10 place-items-center lg:h-8 lg:w-8 rounded-lg text-gray-500 transition-[color,background-color,transform] duration-150 hover:bg-gray-900/[0.05] hover:text-gray-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30 dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-white";

function NavList({ onNavigate, onClose, tier }: { onNavigate?: () => void; onClose?: () => void; tier?: Tier }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, toggleLanguage } = useLanguage();
  const dark = theme === "dark";
  const { chat, clear } = useNotifications();

  useEffect(() => {
    if (pathname.startsWith("/dashboard/chats")) clear("chat");
  }, [pathname, clear]);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center gap-1 pl-5 pr-3", "lg:[@media(max-height:800px)]:h-14")}>
        <Link href="/dashboard" onClick={onNavigate} className="mr-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30">
          <Logo size={24} wordmarkClassName="text-[16px] text-gray-900 dark:text-white" />
        </Link>
        <Link href="/" aria-label={t.navWebsite} title={t.navWebsite} className={iconBtn}>
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        {onClose && (
          <button onClick={onClose} aria-label={t.navClose} className={iconBtn}>
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
      <nav className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-3 pt-1 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden", "lg:[@media(max-height:800px)]:space-y-2.5")}>
        {navGroups.map((group) => (
          <div key={group.labelEn}>
            <p className={cn("mb-1 px-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400", "lg:[@media(max-height:800px)]:mb-0.5")}>
              {lang === "sv" ? group.labelSv : group.labelEn}
            </p>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[15px] transition-[color,background-color,transform] lg:py-1.5 lg:text-sm duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30",
                        "lg:[@media(max-height:800px)]:py-1",
                        active
                          ? "bg-nordic-600/10 font-medium text-nordic-600 dark:bg-nordic-600/[0.16]"
                          : "text-gray-600 hover:bg-gray-900/[0.04] hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
                      )}
                    >
                      <span className="relative shrink-0">
                        <Icon className={cn("h-4 w-4 transition-opacity", active ? "opacity-90" : "opacity-50 group-hover:opacity-80")} strokeWidth={1.75} />
                        {item.href === "/dashboard/chats" && <AnimatePresence><NotifBadge n={chat} /></AnimatePresence>}
                      </span>
                      <span className="flex-1 truncate">{t[item.key as keyof Translations]}</span>
                      {tier && "feature" in item && !hasFeature(tier, (item as { feature: Feature }).feature) && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-1 border-t border-gray-900/[0.06] px-3 py-2.5 dark:border-white/[0.06]">
        <button
          onClick={() => { toggleLanguage(); router.refresh(); }}
          aria-label={lang === "sv" ? "Switch to English" : "Byt till svenska"}
          title={lang === "sv" ? "English" : "Svenska"}
          className={cn(iconBtn, "text-[11px] font-semibold tracking-wide")}
        >
          {lang === "sv" ? "EN" : "SV"}
        </button>
        <button onClick={toggleTheme} aria-label={dark ? t.btnLightMode : t.btnDarkMode} title={dark ? t.btnLightMode : t.btnDarkMode} className={iconBtn}>
          {dark ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="ml-auto flex h-10 items-center gap-2 lg:h-8 rounded-lg px-2.5 text-sm text-gray-500 transition-[color,background-color,transform] duration-150 hover:bg-red-50/70 hover:text-red-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 dark:text-gray-400 dark:hover:bg-red-950/25 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          <span>{t.navLogout}</span>
        </button>
      </div>
    </div>
  );
}

export function DashboardChrome({ children, tier }: { children: React.ReactNode; tier?: Tier }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="app-shell relative min-h-screen bg-[#F5F4F0] dark:bg-black dark:text-gray-100 print:bg-white print:min-h-0">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] dark:hidden print:hidden" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden dark:hidden">
        <div className="absolute -top-24 left-[22%] h-[440px] w-[440px] rounded-full bg-nordic-600/[0.07] blur-[110px]" />
        <div className="absolute bottom-0 right-[12%] h-80 w-80 rounded-full bg-stone-300/20 blur-[90px]" />
      </div>
      <IdleLogout />
      <aside className="fixed left-0 top-0 hidden h-full w-60 border-r border-gray-900/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] lg:block print:hidden">
        <NavList tier={tier} />
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-900/[0.07] bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] lg:hidden print:hidden">
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} aria-label="Öppna meny" className="rounded-lg p-2 hover:bg-gray-900/[0.04] dark:text-white dark:hover:bg-white/[0.04]">
            <Menu className="h-6 w-6" />
          </motion.button>
          <Link href="/dashboard" aria-label="Kvittino"><LogoMark size={26} /></Link>
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
              <NavList onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} tier={tier} />
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
                  active ? "text-nordic-600 dark:text-nordic-600" : "text-gray-500 dark:text-gray-400",
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