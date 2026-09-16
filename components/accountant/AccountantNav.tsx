"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

export function AccountantNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const items = [
    { href: "/accountant", label: t.navOverview, exact: true },
    { href: "/accountant/marketplace", label: t.navMarketplace },
    { href: "/accountant/requests", label: t.navRequests },
  ];
  return (
    <nav className="inline-flex gap-1 rounded-full border border-gray-900/[0.07] bg-white/60 p-1 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-nordic-600 text-white"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
