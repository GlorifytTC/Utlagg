"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

/**
 * Accountant workspace nav. Uses the app's existing pill/hairline link
 * vocabulary rather than introducing a new navigation style. Bilingual.
 */
export function AccountantNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  const items = [
    { href: "/accountant", label: t.navOverview, exact: true },
    { href: "/accountant/discover", label: t.navDiscover },
    { href: "/accountant/requests", label: t.navRequests },
  ];
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-ink/40 bg-ink text-paper"
                : "hairline text-ink/70 hover:border-ink/40",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
