// app/page.tsx
"use client";

import Link from "next/link";
import { HeroSection } from "@/components/landing/HeroSection";
import { Pricing } from "@/components/landing/Pricing";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { StructuredData } from "@/components/StructuredData";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";

function HomeContent() {
  const { t, lang, toggleLanguage } = useLanguage();

  return (
    <main className="bg-paper">
      <StructuredData />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold">
          Utlagg
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <button
            onClick={toggleLanguage}
            className="rounded border border-ink/20 px-3 py-1 text-ink/70 hover:border-ink/40 hover:text-ink transition"
          >
            {lang === "sv" ? "SV / EN" : "EN / SV"}
          </button>
          <Link href="#funktioner" className="hidden text-ink/70 hover:text-ink sm:block">
            {t.features}
          </Link>
          <Link href="#priser" className="hidden text-ink/70 hover:text-ink sm:block">
            {t.pricing}
          </Link>
          <Link href="/login" className="text-ink/70 hover:text-ink">
            {t.login}
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-ink px-4 py-2 text-paper hover:bg-nordic-900 transition"
          >
            {t.startFree}
          </Link>
        </nav>
      </header>

      <HeroSection />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}