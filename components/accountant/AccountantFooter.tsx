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
    <footer className="mt-10 flex justify-center border-t border-gray-100 pt-8 dark:border-white/[0.06]">
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50/70 dark:border-white/10 dark:hover:bg-red-950/25"
      >
        <LogOut size={16} />
        {t.menuLogout}
      </button>
    </footer>
  );
}
