"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";

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
      href="/dashboard/company"
      className="group flex items-center justify-between rounded-2xl border border-gray-900/[0.07] bg-[#F5F4F0] px-6 py-4 transition-colors hover:border-nordic-600/30 hover:bg-nordic-50/40 dark:border-white/[0.08] dark:bg-[#0D0D0D] dark:hover:bg-white/[0.04]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-nordic-600/10 text-nordic-700 dark:bg-nordic-400/10 dark:text-nordic-300">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Revisorsåtkomst</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rows.length === 0
              ? "Ingen revisor har åtkomst"
              : rows.length === 1
                ? `${rows[0].name ?? rows[0].email} har åtkomst`
                : `${rows.length} revisorer har åtkomst`}
          </p>
        </div>
      </div>
      <span className="text-sm font-medium text-nordic-700 transition-transform group-hover:translate-x-0.5 dark:text-nordic-300">
        Hantera →
      </span>
    </Link>
  );
}
