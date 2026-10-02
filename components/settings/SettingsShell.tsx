"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { navIconClass, navItemClass } from "@/components/AppShell";

export type SettingsGroup = {
  label: string;
  items: { href: string; label: string; icon: LucideIcon }[];
};

/**
 * One settings area, two scopes: each group is a scope (personal vs company/firm).
 * Desktop: sticky left nav. Mobile: each group is a labelled, scrollable pill row.
 */
export function SettingsShell({
  title,
  subtitle,
  groups,
  children,
}: {
  title: string;
  subtitle?: string;
  groups: SettingsGroup[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <nav aria-label={title} className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-1.5 px-1 text-xs font-medium text-gray-500 dark:text-gray-400 lg:px-3">{g.label}</p>
              <ul className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
                {g.items.map(({ href, label, icon: Icon }) => {
                  const on = active(href);
                  return (
                    <li key={href} className="shrink-0 snap-start">
                      <Link
                        href={href}
                        aria-current={on ? "page" : undefined}
                        className={cn(navItemClass(on), "min-h-11 whitespace-nowrap max-lg:rounded-full max-lg:border max-lg:border-gray-900/10 max-lg:py-2 dark:max-lg:border-white/10")}
                      >
                        <Icon className={navIconClass(on)} strokeWidth={1.75} />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="max-w-3xl min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}

/** Heading for one settings section (the shell owns the page h1). */
export function SectionHeader({ title, subtitle }: { title: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h2 className="break-words font-display text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}
