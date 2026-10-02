"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Home, Inbox, Store, LogOut, Moon, Sun, X, MessageSquare, ArrowUpRight, Settings } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { AccountantAvatarMenu } from "@/components/accountant/AccountantAvatarMenu";
import { AppShell, NotifBadge, iconBtn, navIconClass, navItemClass } from "@/components/AppShell";
import { useNotifications } from "@/context/NotificationContext";

// Re-exported for existing imports; the badge now lives with the shared shell.
export { NotifBadge };

const nav = [
  { key: "navOverview" as const, href: "/accountant", icon: Home, badge: null as "chat" | "requests" | null },
  { key: "navRequests" as const, href: "/accountant/requests", icon: Inbox, badge: "requests" as const },
  { key: "navChats" as const, href: "/accountant/chats", icon: MessageSquare, badge: "chat" as const },
  { key: "navMarketplace" as const, href: "/accountant/marketplace", icon: Store, badge: null },
  { key: "navSettings" as const, href: "/accountant/settings", icon: Settings, badge: null },
];

// Mobile bottom bar has 5 slots; Settings is the 5th
const bottomNav = nav.slice(0, 5);

function isActive(pathname: string, href: string) {
  return href === "/accountant" ? pathname === href : pathname.startsWith(href);
}

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
        <Link href="/accountant" onClick={onNavigate} className="mr-auto rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={24} wordmarkClassName="text-[16px] text-gray-900 dark:text-white" />
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{at.sidebarSubtitle}</span>
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
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-3 [scrollbar-width:thin]">
        <ul className="space-y-0.5">
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
                  className={navItemClass(active)}
                >
                  <span className="relative shrink-0">
                    <Icon className={navIconClass(active)} strokeWidth={1.75} />
                    <AnimatePresence><NotifBadge n={count} /></AnimatePresence>
                  </span>
                  <span className="flex-1 truncate">{at[item.key]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-y-2 border-t border-gray-900/[0.06] px-3 py-2.5 dark:border-white/[0.06]">
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
          className="flex h-10 items-center gap-2 rounded-full px-3 text-sm text-gray-500 transition duration-300 ease-premium hover:bg-red-50/70 hover:text-red-600 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/20 dark:text-gray-400 dark:hover:bg-red-950/25 dark:hover:text-red-400 lg:h-8"
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
 * own public marketplace profile - the page companies see.
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

  // Fallback initial from the signed-in name instead of a fixed letter
  const initial = (session?.user?.name ?? session?.user?.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <Link
      href={session?.user?.id ? `/accountant/marketplace/${session.user.id}` : "/accountant/marketplace"}
      onClick={onNavigate}
      aria-label={label}
      title={label}
      className="grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-gray-900/10 bg-white transition duration-300 ease-premium hover:border-nordic-600/50 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 dark:border-white/[0.15] dark:bg-white/[0.06] dark:hover:border-nordic-600/60 lg:h-8 lg:w-8"
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{initial}</span>
      )}
    </Link>
  );
}

export function AccountantChrome({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const at = accountantStrings(lang);
  const pathname = usePathname();
  const { chat, requests } = useNotifications();
  const badgeCounts: Record<string, number> = { chat, requests };

  return (
    <AppShell
      homeHref="/accountant"
      renderNav={(p) => <NavList {...p} />}
      headerEnd={<AccountantAvatarMenu />}
      bottomNav={bottomNav.map((item) => ({
        href: item.href,
        label: at[item.key],
        icon: item.icon,
        active: isActive(pathname, item.href),
        badge: item.badge ? badgeCounts[item.badge] : 0,
      }))}
    >
      {children}
    </AppShell>
  );
}
