"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home, Receipt, CreditCard, BarChart3, Settings, User, LogOut, Moon, Sun, X, Car, CheckSquare, Plug, Lock, Building2, FileText, TrainFront, Download, Store, MessageSquare, ArrowUpRight,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { IdleLogout } from "@/components/IdleLogout";
import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { hasFeature, type Feature } from "@/lib/features";
import type { Tier } from "@/lib/plans";
import { Logo } from "@/components/brand/Logo";
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

// Flat list for the mobile bottom bar, which picks items by href
const nav = navGroups.flatMap((g) => g.items);

const bottomNav = nav.filter((n) => ["/dashboard", "/dashboard/receipts", "/dashboard/stats", "/dashboard/subscription", "/dashboard/profile"].includes(n.href));

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavList({ onNavigate, onClose, tier }: { onNavigate?: () => void; onClose?: () => void; tier?: Tier }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, toggleLanguage } = useLanguage();
  const dark = theme === "dark";
  const { chat, clear } = useNotifications();

  // Subscription is owner-only: hide it for admins/members of a company.
  const [companyRole, setCompanyRole] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setCompanyRole(d?.role ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const hideSubscription = companyRole !== null && companyRole !== "owner";

  useEffect(() => {
    if (pathname.startsWith("/dashboard/chats")) clear("chat");
  }, [pathname, clear]);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center gap-1 pl-5 pr-3", "lg:[@media(max-height:860px)]:h-12")}>
        <Link href="/dashboard" onClick={onNavigate} className="mr-auto rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
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
      {/* lg:[@media(max-height:860px)] tightens the rail on short laptop screens (1366×768) so every link fits */}
      <nav className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-3 pt-1 [scrollbar-width:thin]", "lg:[@media(max-height:860px)]:space-y-2 lg:[@media(max-height:860px)]:pb-2")}>
        {navGroups.map((group) => (
          <div key={group.labelEn}>
            <p className={cn("mb-1 px-3 text-xs font-medium text-gray-500 dark:text-gray-400", "lg:[@media(max-height:860px)]:mb-0.5")}>
              {lang === "sv" ? group.labelSv : group.labelEn}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                if (item.href === "/dashboard/subscription" && hideSubscription) return null;
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
                      {tier && "feature" in item && !hasFeature(tier, (item as { feature: Feature }).feature) && <Lock className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.75} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-1 border-t border-gray-900/[0.06] px-3 py-2.5 dark:border-white/[0.06] lg:[@media(max-height:860px)]:py-1.5">
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
          className="ml-auto flex h-10 items-center gap-2 rounded-full px-3 text-sm text-gray-500 transition duration-300 ease-premium hover:bg-red-50/70 hover:text-red-600 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/20 dark:text-gray-400 dark:hover:bg-red-950/25 dark:hover:text-red-400 lg:h-8"
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
  const pathname = usePathname();

  return (
    <AppShell
      homeHref="/dashboard"
      renderNav={(p) => <NavList {...p} tier={tier} />}
      headerEnd={
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label={t.navLogout}
          className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-red-600 transition hover:bg-red-50/70 active:scale-95 dark:text-red-400 dark:hover:bg-red-950/25"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="hidden sm:inline">{t.navLogout}</span>
        </button>
      }
      bottomNav={bottomNav.map((item) => ({
        href: item.href,
        label: t[item.key as keyof Translations] as string,
        icon: item.icon,
        active: isActive(pathname, item.href),
      }))}
    >
      <IdleLogout />
      {children}
    </AppShell>
  );
}
