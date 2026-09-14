"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { accountantStrings } from "@/lib/accountant-i18n";

/**
 * Footer logout for the accountant workspace — a clear, always-visible sign-out
 * at the bottom of the dashboard (in addition to the one in the avatar menu).
 * Reuses the app's standard signOut({ callbackUrl: "/" }).
 */
export function AccountantFooter() {
  const { lang } = useLanguage();
  const t = accountantStrings(lang);
  return (
    <footer className="flex justify-center border-t border-gray-900/[0.07] pt-6 dark:border-white/[0.06]">
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50/70 dark:hover:bg-red-950/25"
      >
        <LogOut size={15} />
        {t.menuLogout}
      </button>
    </footer>
  );
}
