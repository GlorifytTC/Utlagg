"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface AccountantRow {
  relationshipId: string;
  name: string | null;
  email: string;
}

/**
 * Compact dashboard summary of accountants with active access to the user's
 * company. Reuses GET /api/company/accountants (owner/admin only, server-
 * scoped). Renders nothing for users who can't manage a company or who fetch
 * a non-200 (e.g. no company / not owner-admin), so it never clutters a solo
 * user's dashboard. Links to the full manage/revoke panel in company settings.
 */
export function DashboardAccountantAccess() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AccountantRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/company/accountants")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setRows(d.accountants ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Not owner/admin, no company, or error → render nothing.
  if (rows === null) return null;

  return (
    <Link
      href="/dashboard/settings/accountants"
      className="panel group flex items-center gap-4 rounded-2xl p-5 transition duration-300 ease-premium hover:border-nordic-600/30 active:scale-[0.99]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nordic-600/10 text-nordic-700 dark:text-nordic-300">
        <Users className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t.caaTitle}</span>
        <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
          {rows.length === 0
            ? t.daaNone
            : rows.length === 1
              ? t.daaOne.replace("{name}", rows[0].name ?? rows[0].email)
              : t.daaMany.replace("{n}", String(rows.length))}
        </span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400 transition duration-300 ease-premium group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:text-nordic-600" strokeWidth={1.75} />
    </Link>
  );
}
