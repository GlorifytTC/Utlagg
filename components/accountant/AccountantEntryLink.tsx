"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";
import { buttonClass } from "@/components/ui/button";

/**
 * Shows a link into the accountant workspace only when the signed-in user is
 * an accountant (from /api/me - display only; the workspace itself is gated
 * server-side by requireAccountant()). Renders nothing otherwise, so it's
 * invisible to ordinary users.
 */
export function AccountantEntryLink() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
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
      className={buttonClass("outline")}
    >
      <Briefcase size={15} />
      {t.entryLink}
    </Link>
  );
}
