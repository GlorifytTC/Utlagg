"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/plans";

const NAV_ITEMS = [
  { name: "Översikt", href: "/dashboard", icon: Home },
  { name: "Kvitton", href: "/dashboard/receipts", icon: Receipt },
  { name: "Prenumeration", href: "/dashboard/subscription", icon: CreditCard },
  { name: "Statistik", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Inställningar", href: "/dashboard/settings", icon: Settings },
  { name: "Profil", href: "/dashboard/profile", icon: User },
] as const;

const TIER_LABEL: Partial<Record<Tier, string>> = {
  pro: "Pro",
  business: "Business",
};

export function Sidebar({ tier }: { tier: Tier }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-gray-900/[0.07] bg-white/75 backdrop-blur-xl dark:border-white/[0.07] dark:bg-gray-950/80">
      {/* Brand header */}
      <div className="px-5 pb-5 pt-6">
        <Link 
          href="/" 
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/20 focus-visible:rounded-md"
        >
          <span className="font-display text-[17px] font-semibold tracking-tight text-gray-900 dark:text-white">
            Utlägg
          </span>
        </Link>
        <p className="mt-0.5 text-[9.5px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-600">
          Expense Management
        </p>
        {TIER_LABEL[tier] && (
          <span className="mt-2.5 inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[9.5px] uppercase tracking-widest text-gray-500 dark:border-gray-800 dark:text-gray-500">
            {TIER_LABEL[tier]}
          </span>
        )}
      </div>

      <div className="mx-5 h-px bg-gray-900/[0.06] dark:bg-white/[0.06]" />

      {/* Navigation menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-1.5 px-2.5 text-[9px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-600">
          Menu
        </p>
        <ul className="space-y-px">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard" 
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm transition-colors duration-150",
                    isActive
                      ? "bg-gray-900/[0.07] text-gray-900 dark:bg-white/[0.07] dark:text-white"
                      : "text-gray-500 hover:bg-gray-900/[0.04] hover:text-gray-800 dark:text-gray-500 dark:hover:bg-white/[0.04] dark:hover:text-gray-300",
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-[15px] w-[15px] shrink-0 transition-opacity",
                      isActive ? "opacity-90" : "opacity-40 group-hover:opacity-60",
                    )}
                    strokeWidth={1.75}
                  />
                  <span className={cn("flex-1", isActive ? "font-medium" : "font-normal")}>
                    {item.name}
                  </span>
                  {isActive && (
                    <span className="h-1 w-1 rounded-full bg-gray-600 dark:bg-gray-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4">
        <div className="space-y-px border-t border-gray-900/[0.06] pt-3 dark:border-white/[0.06]">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm text-gray-500 transition-colors hover:bg-gray-900/[0.04] hover:text-gray-800 dark:text-gray-500 dark:hover:bg-white/[0.04] dark:hover:text-gray-300"
          >
            {dark ? (
              <Sun className="h-[15px] w-[15px]" strokeWidth={1.75} />
            ) : (
              <Moon className="h-[15px] w-[15px]" strokeWidth={1.75} />
            )}
            <span>{dark ? "Ljust läge" : "Mörkt läge"}</span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-sm text-gray-400 transition-colors hover:bg-red-50/70 hover:text-red-600 dark:text-gray-600 dark:hover:bg-red-950/25 dark:hover:text-red-400"
          >
            <LogOut className="h-[15px] w-[15px]" strokeWidth={1.75} />
            <span>Logga ut</span>
          </button>
        </div>
      </div>
    </aside>
  );
}