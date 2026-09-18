"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";

/**
 * Shows a link into the accountant workspace only when the signed-in user is
 * an accountant (from /api/me — display only; the workspace itself is gated
 * server-side by requireAccountant()). Renders nothing otherwise, so it's
 * invisible to ordinary users.
 */
export function AccountantEntryLink() {
  const [isAccountant, setIsAccountant] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setIsAccountant(Boolean(d?.isAccountant));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAccountant) return null;

  return (
    <Link
      href="/accountant"
      className="inline-flex items-center gap-2 rounded-full border border-gray-900/[0.12] px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-900/40 dark:border-white/[0.12] dark:text-gray-300 dark:hover:border-white/40"
    >
      <Briefcase size={15} />
      Revisorsvyn
    </Link>
  );
}
