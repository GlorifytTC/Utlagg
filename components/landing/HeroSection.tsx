// components/landing/HeroSection.tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { HeroVisual, HeroVisualMobile } from "./HeroVisual";
import { CtaLink } from "./Cta";
import { enter } from "./motion";

export function HeroSection() {
  const { t } = useLanguage();
  const rm = useReducedMotion();

  return (
    <section className="relative">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-12 md:grid-cols-[1fr_1.05fr] md:pb-24 md:pt-20">
        <div>
          <motion.p
            {...enter(0, rm)}
            className="text-sm font-medium text-nordic-600"
          >
            {t.heroTagline}
          </motion.p>
          <motion.h1
            {...enter(1, rm)}
            className="mt-5 font-display text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl md:text-[2.75rem] lg:text-5xl xl:text-6xl"
          >
            {t.heroTitleLine1}
            <br />
            <span className="text-nordic-600">{t.heroTitleLine2}</span>
          </motion.h1>
          <motion.p
            {...enter(2, rm)}
            className="mt-6 max-w-md text-lg leading-relaxed text-ink/65"
          >
            {t.heroDescription}
          </motion.p>
          <motion.div {...enter(3, rm)} className="mt-10 flex flex-wrap items-center gap-3">
            <CtaLink href="/register">{t.heroCtaPrimary}</CtaLink>
            <CtaLink href="/pricing" variant="ghost">
              {t.heroCtaSecondary}
            </CtaLink>
          </motion.div>
          <HeroVisualMobile />
        </div>

        {/* Product stage: the live visual sits in a bezel tray instead of floating on the page */}
        <motion.div
          initial={{ opacity: 0, scale: rm ? 1 : 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0, duration: 0.9, delay: 0.15 }}
          className="bezel hidden md:block"
        >
          <div className="bezel-core light-surface relative overflow-hidden bg-[radial-gradient(120%_90%_at_80%_10%,rgb(var(--accent-tint))_0%,#fffdf8_60%)] px-6">
            <HeroVisual />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
