"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, Banknote, BrainCircuit, Activity, ShieldCheck, Flag, BadgeCheck, ArrowLeft, X,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Logo } from "@/components/brand/Logo";
import { AppShell, iconBtn, navIconClass, navItemClass } from "@/components/AppShell";
import { buttonClass } from "@/components/ui/button";

// Admin is an internal, Swedish-only tool: strings stay inline (no i18n by design).
const nav: { name: string; href: string; icon: LucideIcon }[] = [
  { name: "Översikt", href: "/admin", icon: LayoutDashboard },
  { name: "Användare", href: "/admin/users", icon: Users },
  { name: "Företag", href: "/admin/companies", icon: Building2 },
  { name: "Intäkter", href: "/admin/revenue", icon: Banknote },
  { name: "Modellträning", href: "/admin/training", icon: BrainCircuit },
  { name: "Systemhälsa", href: "/admin/health", icon: Activity },
  { name: "Efterlevnad", href: "/admin/compliance", icon: ShieldCheck },
  { name: "Chatrapporter", href: "/admin/chat-reports", icon: Flag },
  { name: "Verifieringar", href: "/admin/verifications", icon: BadgeCheck },
];

// Bottom bar has 5 slots; the drawer lists everything. Picked by href so
// adding nav items never silently shifts the bottom bar.
const BOTTOM = ["/admin", "/admin/users", "/admin/revenue", "/admin/chat-reports", "/admin/verifications"];
const bottomNav = BOTTOM.map((h) => nav.find((n) => n.href === h)!);

const isActive = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname.startsWith(href);

function NavList({ email, onNavigate, onClose }: { email?: string | null; onNavigate?: () => void; onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-1 pl-5 pr-3">
        <Link href="/admin" onClick={onNavigate} className="mr-auto min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={24} wordmarkClassName="text-[16px] text-gray-900 dark:text-white" />
          <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">Admin{email ? ` · ${email}` : ""}</span>
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
            return (
              <li key={item.href}>
                <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={navItemClass(active)}>
                  <Icon className={navIconClass(active)} strokeWidth={1.75} />
                  <span className="flex-1 truncate">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function AdminChrome({ email, children }: { email?: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AppShell
      homeHref="/admin"
      renderNav={(p) => <NavList email={email} {...p} />}
      headerEnd={
        <Link href="/dashboard" className={buttonClass("outline")}>
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Till appen
        </Link>
      }
      bottomNav={bottomNav.map((i) => ({ href: i.href, label: i.name, icon: i.icon, active: isActive(pathname, i.href) }))}
    >
      {children}
    </AppShell>
  );
}
