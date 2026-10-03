"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Receipt, BarChart3, Settings, X, Car, CheckSquare, Lock, FileText, TrainFront, Download, Store, MessageSquare,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { IdleLogout } from "@/components/IdleLogout";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { hasFeature, type Feature } from "@/lib/features";
import type { Tier } from "@/lib/plans";
import { Logo } from "@/components/brand/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { AppShell, NotifBadge, iconBtn, navIconClass, navItemClass } from "@/components/AppShell";
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
      { key: "navStats", href: "/dashboard/stats", icon: BarChart3 },
      { key: "navInvoices", href: "/dashboard/invoices", icon: FileText, feature: "invoicing" as Feature },
      { key: "navMarketplace", href: "/dashboard/marketplace", icon: Store },
    ],
  },
];

const settingsItem = { key: "navSettings", href: "/dashboard/settings", icon: Settings };

// Flat list for the mobile bottom bar, which picks items by href
const nav = [...navGroups.flatMap((g) => g.items), settingsItem];

const bottomNav = nav.filter((n) => ["/dashboard", "/dashboard/receipts", "/dashboard/chats", "/dashboard/stats", "/dashboard/settings"].includes(n.href));

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavList({ onNavigate, onClose, tier }: { onNavigate?: () => void; onClose?: () => void; tier?: Tier }) {
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const { chat, clear } = useNotifications();

  useEffect(() => {
    if (pathname.startsWith("/dashboard/chats")) clear("chat");
  }, [pathname, clear]);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center gap-1 pl-5 pr-3", "lg:[@media(max-height:860px)]:h-12")}>
        <Link href="/dashboard" onClick={onNavigate} className="mr-auto rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={24} wordmarkClassName="text-[16px] text-gray-900 dark:text-white" />
        </Link>
        {onClose && (
          <button onClick={onClose} aria-label={t.navClose} className={iconBtn}>
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
      {/* lg:[@media(max-height:860px)] tightens the rail on short laptop screens (1366×768) so every link fits */}
      <nav className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-3 pt-1 [scrollbar-width:thin]", "lg:[@media(max-height:860px)]:space-y-2 lg:[@media(max-height:860px)]:pb-2")}>
        {navGroups.map((group) => (
          <div key={group.labelEn}>
            <p className={cn("mb-1 px-3 text-xs font-medium text-gray-500 dark:text-gray-400", "lg:[@media(max-height:860px)]:mb-0.5")}>
              {lang === "sv" ? group.labelSv : group.labelEn}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
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
                        {item.href === "/dashboard/chats" && <AnimatePresence><NotifBadge n={chat} /></AnimatePresence>}
                      </span>
                      <span className="flex-1 truncate">{t[item.key as keyof Translations]}</span>
                      {tier && "feature" in item && !hasFeature(tier, (item as { feature: Feature }).feature) && <Lock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" strokeWidth={1.75} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-gray-900/[0.06] px-3 py-2.5 dark:border-white/[0.06] lg:[@media(max-height:860px)]:py-1.5">
        <Link href={settingsItem.href} onClick={onNavigate} aria-current={isActive(pathname, settingsItem.href) ? "page" : undefined} className={navItemClass(isActive(pathname, settingsItem.href))}>
          <Settings className={navIconClass(isActive(pathname, settingsItem.href))} strokeWidth={1.75} />
          <span className="flex-1 truncate">{t.navSettings}</span>
        </Link>
      </div>
    </div>
  );
}

export function DashboardChrome({ children, tier }: { children: React.ReactNode; tier?: Tier }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { chat } = useNotifications();

  return (
    <AppShell
      homeHref="/dashboard"
      renderNav={(p) => <NavList {...p} tier={tier} />}
      headerEnd={<ProfileMenu logoEndpoint="/api/user/logo" settingsHref="/dashboard/settings" />}
      bottomNav={bottomNav.map((item) => ({
        href: item.href,
        label: t[item.key as keyof Translations] as string,
        icon: item.icon,
        active: isActive(pathname, item.href),
        badge: item.href === "/dashboard/chats" ? chat : undefined,
      }))}
    >
      <IdleLogout />
      {children}
    </AppShell>
  );
}
