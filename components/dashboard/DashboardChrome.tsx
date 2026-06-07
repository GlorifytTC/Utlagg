"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home, Receipt, CreditCard, BarChart3, Settings, User,
  LogOut, Moon, Sun, Menu, X, Car, CheckSquare, Plug, Lock, Building2,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { hasFeature, type Feature } from "@/lib/features";
import type { Tier } from "@/lib/plans";

const nav = [
  { name: "Översikt", href: "/dashboard", icon: Home },
  { name: "Kvitton", href: "/dashboard/receipts", icon: Receipt },
  { name: "Milersättning", href: "/dashboard/mileage", icon: Car, feature: "mileage" as Feature },
  { name: "Attest", href: "/dashboard/approvals", icon: CheckSquare, feature: "approvals" as Feature },
  { name: "Integrationer", href: "/dashboard/integrations", icon: Plug, feature: "fortnox" as Feature },
  { name: "Prenumeration", href: "/dashboard/subscription", icon: CreditCard },
  { name: "Statistik", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Företag", href: "/dashboard/company", icon: Building2 },
  { name: "Inställningar", href: "/dashboard/settings", icon: Settings },
  { name: "Profil", href: "/dashboard/profile", icon: User },
];
// Five most-used destinations for the mobile bottom bar.
const bottomNav = nav.filter((n) =>
  ["/dashboard", "/dashboard/receipts", "/dashboard/stats", "/dashboard/subscription", "/dashboard/profile"].includes(n.href),
);

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavList({ onNavigate, tier }: { onNavigate?: () => void; tier?: Tier }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <Link href="/" className="font-display text-xl font-semibold text-gray-900 dark:text-white">
          Utlagg
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400">Expense Management</p>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                active
                  ? "bg-nordic-50 text-nordic-600 dark:bg-nordic-900/30 dark:text-nordic-400"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {tier && "feature" in item && !hasFeature(tier, (item as { feature: Feature }).feature) && (
                <Lock className="h-3.5 w-3.5 text-gray-400" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-800">
        <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{dark ? "Ljust läge" : "Mörkt läge"}</span>
        </button>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut className="h-5 w-5" /> <span>Logga ut</span>
        </button>
      </div>
    </div>
  );
}

export function DashboardChrome({ children, tier }: { children: React.ReactNode; tier?: Tier }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop rail (lg+) */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
        <NavList tier={tier} />
      </aside>

      {/* Top bar with hamburger (below lg) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <Link href="/" className="font-display text-lg font-semibold">Utlagg</Link>
        <button onClick={() => setOpen(true)} aria-label="Öppna meny" className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Off-canvas drawer (below lg) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80%] bg-white shadow-xl dark:bg-gray-900">
            <button onClick={() => setOpen(false)} aria-label="Stäng meny" className="absolute right-3 top-3 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="h-5 w-5" />
            </button>
            <NavList onNavigate={() => setOpen(false)} tier={tier} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="min-h-screen p-4 pb-24 sm:p-6 lg:ml-64 lg:p-8 lg:pb-8">{children}</main>

      {/* Bottom nav (mobile only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[10px]",
                active ? "text-nordic-600 dark:text-nordic-400" : "text-gray-500 dark:text-gray-400",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
