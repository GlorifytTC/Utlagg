"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, Store, X, MessageSquare, Settings, UserRound } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { Logo } from "@/components/brand/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
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
  const { t, lang } = useLanguage();
  const at = accountantStrings(lang);
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
    </div>
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
      headerEnd={<ProfileMenu logoEndpoint="/api/accountant/logo" settingsHref="/accountant/settings" links={[{ href: "/dashboard", label: at.menuAccount, icon: UserRound }]} />}
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
