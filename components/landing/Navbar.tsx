// components/landing/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t, lang, toggleLanguage } = useLanguage();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b hairline bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-xl font-semibold">
          Utlagg
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <button
            onClick={toggleLanguage}
            className="rounded border border-ink/20 px-3 py-1 text-ink/70 transition hover:border-ink/40 hover:text-ink"
          >
            {lang === "sv" ? "SV / EN" : "EN / SV"}
          </button>
          <Link
            href="/features"
            className={cn(
              "hidden transition sm:block",
              pathname === "/features"
                ? "text-ink"
                : "text-ink/70 hover:text-ink",
            )}
          >
            {t.features}
          </Link>
          <Link
            href="/pricing"
            className={cn(
              "hidden transition sm:block",
              pathname === "/pricing"
                ? "text-ink"
                : "text-ink/70 hover:text-ink",
            )}
          >
            {t.pricing}
          </Link>
          <Link
            href="/login"
            className="text-ink/70 transition hover:text-ink"
          >
            {t.login}
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-ink px-4 py-2 text-paper transition hover:bg-nordic-900"
          >
            {t.startFree}
          </Link>
        </nav>
      </div>
    </header>
  );
}