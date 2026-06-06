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

const navItems = [
  { name: "Översikt", href: "/dashboard", icon: Home },
  { name: "Kvitton", href: "/dashboard/receipts", icon: Receipt },
  { name: "Prenumeration", href: "/dashboard/subscription", icon: CreditCard },
  { name: "Statistik", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Inställningar", href: "/dashboard/settings", icon: Settings },
  { name: "Profil", href: "/dashboard/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <aside className="fixed left-0 top-0 flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="p-6">
        <Link href="/" className="font-display text-xl font-semibold text-gray-900 dark:text-white">
          Utlagg
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400">Expense Management</p>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                isActive
                  ? "bg-nordic-50 text-nordic-600 dark:bg-nordic-900/30 dark:text-nordic-400"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-gray-200 p-4 dark:border-gray-800">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{dark ? "Ljust läge" : "Mörkt läge"}</span>
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5" />
          <span>Logga ut</span>
        </button>
      </div>
    </aside>
  );
}
