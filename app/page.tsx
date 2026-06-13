// app/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/landing/HeroSection";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { StructuredData } from "@/components/StructuredData";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ChatBox } from "@/components/ChatBox";

const TEASER_FEATURES = [
  { key: "feature1" },
  { key: "feature2" },
  { key: "feature3" },
] as const;

function HomeContent() {
  const { t } = useLanguage();

  return (
    <div className="relative">
      <AmbientBackground />
      <StructuredData />
      <Navbar />

      <main>
        <HeroSection />

        {/* Feature teaser */}
        <section className="border-y hairline bg-grain">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-sm font-display text-4xl md:text-5xl">
                {t.featuresHeadline}
              </h2>
              <Link
                href="/features"
                className="hidden text-sm text-nordic-600 transition hover:underline sm:block"
              >
                {t.features} →
              </Link>
            </div>

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border hairline bg-ink/10 sm:grid-cols-3">
              {TEASER_FEATURES.map(({ key }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-paper p-8"
                >
                  <h3 className="font-display text-xl">
                    {t[`${key}Title` as keyof typeof t] as string}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">
                    {t[`${key}Body` as keyof typeof t] as string}
                  </p>
                </motion.div>
              ))}
            </div>

            <Link
              href="/features"
              className="mt-6 block text-sm text-nordic-600 transition hover:underline sm:hidden"
            >
              {t.features} →
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
            {t.howKicker}
          </p>
          <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight md:text-5xl">
            {t.howTitle}
          </h2>

          <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              { n: "01", title: t.howStep1Title, body: t.howStep1Body },
              { n: "02", title: t.howStep2Title, body: t.howStep2Body },
              { n: "03", title: t.howStep3Title, body: t.howStep3Body },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative border-t-2 border-ink pt-6"
              >
                <span className="font-display text-5xl text-nordic-600/90">{s.n}</span>
                <h3 className="mt-4 font-display text-2xl">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing callout */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6 rounded-3xl border hairline bg-paper p-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
                {t.pricingTagline}
              </p>
              <h2 className="mt-2 font-display text-3xl">{t.pricingTitle}</h2>
              <p className="mt-1 text-sm text-ink/60">
                {t.pricingCalloutSubtitle}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-nordic-900"
              >
                {t.startFree}
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border hairline px-6 py-3 text-sm font-medium transition hover:border-ink/40"
              >
                {t.pricing} →
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
      <ChatBox />
    </div>
  );
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  );
}