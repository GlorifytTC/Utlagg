"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Accountant workspace nav. Uses the app's existing pill/hairline link
 * vocabulary rather than introducing a new navigation style.
 */
const items = [
  { href: "/accountant", label: "Översikt", exact: true },
  { href: "/accountant/discover", label: "Upptäck företag" },
  { href: "/accountant/requests", label: "Förfrågningar" },
];

export function AccountantNav() {
  const pathname = usePathname();
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
