"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Home, Inbox, User, LogOut, Moon, Sun, Menu, X, Users, MessageSquare, ArrowUpRight, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { AccountantAvatarMenu } from "@/components/accountant/AccountantAvatarMenu";
import { useNotifications } from "@/context/NotificationContext";

const nav = [
  { key: "navOverview" as const, href: "/accountant", icon: Home, badge: null as "chat" | "requests" | null },
  { key: "navRequests" as const, href: "/accountant/requests", icon: Inbox, badge: "requests" as const },
  { key: "navChats" as const, href: "/accountant/chats", icon: MessageSquare, badge: "chat" as const },
  { key: "navMarketplace" as const, href: "/accountant/marketplace", icon: User, badge: null },
  { key: "navTeam" as const, href: "/accountant/team", icon: Users, badge: null },
  { key: "navSettings" as const, href: "/accountant/settings", icon: Settings, badge: null },
];

// Mobile bottom bar has 5 slots; settings stays reachable via the drawer and the avatar menu
const bottomNav = nav.slice(0, 5);

function isActive(pathname: string, href: string) {
  return href === "/accountant" ? pathname === href : pathname.startsWith(href);
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
      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-nordic-600 text-[9px] font-bold leading-none text-white ring-2 ring-white dark:ring-[#0A0A0A]"
    >
      {n > 9 ? "9+" : n}
    </motion.span>
  );
}

const iconBtn = "grid h-10 w-10 place-items-center rounded-lg text-gray-500 transition-[color,background-color,transform] duration-150 hover:bg-gray-900/[0.05] hover:text-gray-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30 dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-white lg:h-8 lg:w-8";

function NavList({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, toggleLanguage } = useLanguage();
  const at = accountantStrings(lang);
  const dark = theme === "dark";
  const { chat, requests, clear } = useNotifications();

  useEffect(() => {
    if (pathname.startsWith("/accountant/chats")) clear("chat");
    if (pathname.startsWith("/accountant/requests")) clear("requests");
  }, [pathname, clear]);

  const badgeCounts: Record<string, number> = { chat, requests };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-1 pl-5 pr-3">
        <Link href="/accountant" onClick={onNavigate} className="mr-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30">
          <Logo size={24} wordmarkClassName="text-[16px] text-gray-900 dark:text-white" />
          <span className="mt-0.5 block text-[10px] uppercase tracking-[0.14em] text-gray-400">{at.sidebarSubtitle}</span>
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
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-1">
        <ul>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            const count = item.badge ? badgeCounts[item.badge] : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[15px] transition-[color,background-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30 lg:py-1.5 lg:text-sm",
                    active
                      ? "bg-nordic-600/10 font-medium text-nordic-600 dark:bg-nordic-600/[0.16]"
                      : "text-gray-600 hover:bg-gray-900/[0.04] hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
                  )}
                >
                  <span className="relative shrink-0">
                    <Icon className={cn("h-4 w-4 transition-opacity", active ? "opacity-90" : "opacity-50 group-hover:opacity-80")} strokeWidth={1.75} />
                    <AnimatePresence><NotifBadge n={count} /></AnimatePresence>
                  </span>
                  <span className="flex-1 truncate">{at[item.key]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex shrink-0 items-center justify-between border-t border-gray-900/[0.06] px-3 py-2.5 dark:border-white/[0.06]">
        <div className="flex items-center gap-1">
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
        </div>
        <SidebarProfile label={at.navMarketplace} onNavigate={onNavigate} />
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm text-gray-500 transition-[color,background-color,transform] duration-150 hover:bg-red-50/70 hover:text-red-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 dark:text-gray-400 dark:hover:bg-red-950/25 dark:hover:text-red-400 lg:h-8"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
          <span>{t.navLogout}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Accountant's picture (their logoUrl) in the sidebar footer, linking to their
 * own public marketplace profile — the page companies see.
 */
function SidebarProfile({ label, onNavigate }: { label: string; onNavigate?: () => void }) {
  const { data: session } = useSession();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accountant/logo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setLogo(d.logoUrl ?? null))
      .catch(() => {});
    // Settings page announces a new picture so the sidebar doesn't show a stale one
    const onUpdate = (e: Event) => setLogo((e as CustomEvent<string | null>).detail);
    window.addEventListener("accountant-logo-updated", onUpdate);
    return () => window.removeEventListener("accountant-logo-updated", onUpdate);
  }, []);

  return (
    <Link
      href={session?.user?.id ? `/accountant/marketplace/${session.user.id}` : "/accountant/marketplace"}
      onClick={onNavigate}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-gray-200 bg-white transition-[border-color,transform] duration-150 hover:border-nordic-600/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic-600/30 dark:border-white/[0.15] dark:bg-white/[0.06] dark:hover:border-nordic-600/60 lg:h-8 lg:w-8"
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">R</span>
      )}
    </Link>
  );
}

export function AccountantChrome({ children }: { children: React.ReactNode }) {
  const { t, lang } = useLanguage();
  const at = accountantStrings(lang);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { chat, requests } = useNotifications();
  const badgeCounts: Record<string, number> = { chat, requests };

  return (
    <div className="app-shell relative min-h-screen bg-[#F5F4F0] dark:bg-black dark:text-gray-100 print:bg-white print:min-h-0">
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
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} aria-label={t.openMenu} className="rounded-lg p-2 hover:bg-gray-900/[0.04] dark:text-white dark:hover:bg-white/[0.04]">
            <Menu className="h-6 w-6" />
          </motion.button>
          <Link href="/accountant" aria-label="Kvittino"><LogoMark size={26} /></Link>
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
              <NavList onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="min-h-screen p-4 pb-24 sm:p-6 md:pb-8 lg:ml-64 lg:p-8 print:ml-0 print:min-h-0 print:p-0">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-gray-900/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#0A0A0A] md:hidden print:hidden">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          const count = item.badge ? badgeCounts[item.badge] : 0;
          return (
            <motion.div key={item.href} whileTap={{ scale: 0.95 }}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] transition-colors",
                  active ? "text-nordic-600 dark:text-nordic-600" : "text-gray-500 dark:text-gray-400",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  <AnimatePresence><NotifBadge n={count} /></AnimatePresence>
                </span>
                {at[item.key]}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}
