// components/landing/HeroSection.tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const Hero3D = dynamic(() => import("@/components/landing/Hero3D"), {
  ssr: false,
  loading: function Loading3D() {
    const { t } = useLanguage();
    return (
      <div className="flex h-[320px] items-center justify-center text-ink/30 sm:h-[420px] md:h-[520px]">
        {t.loading3D}
      </div>
    );
  },
});

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-16 pt-14 md:grid-cols-2 md:pt-20">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600"
          >
            {t.heroTagline}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl"
          >
            {t.heroTitleLine1}
            <br />
            <span className="text-nordic-600">{t.heroTitleLine2}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6 max-w-md text-lg leading-relaxed text-ink/70"
          >
            {t.heroDescription}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link
              href="/register"
              className="rounded-full bg-nordic-600 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-nordic-700"
            >
              {t.heroCtaPrimary}
            </Link>
            <Link
              href="#priser"
              className="rounded-full border border-ink/20 px-7 py-3.5 text-sm font-medium transition hover:border-ink/40"
            >
              {t.heroCtaSecondary}
            </Link>
          </motion.div>
          <p className="mt-5 text-xs text-ink/45">{t.heroDisclaimer}</p>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ background: "radial-gradient(circle at center, rgb(var(--accent) / 0.10) 0%, rgb(var(--accent) / 0.05) 45%, transparent 72%)" }}
          />
          <Hero3D />
        </div>
      </div>
    </section>
  );
}