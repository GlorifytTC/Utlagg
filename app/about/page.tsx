"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ChatBox } from "@/components/ChatBox";

function AboutContent() {
  const { t } = useLanguage();

  const values = [
    { title: t.aboutVal1Title, body: t.aboutVal1Body },
    { title: t.aboutVal2Title, body: t.aboutVal2Body },
    { title: t.aboutVal3Title, body: t.aboutVal3Body },
  ];
  const stats = [
    { val: t.aboutStat1Val, label: t.aboutStat1Label },
    { val: t.aboutStat2Val, label: t.aboutStat2Label },
    { val: t.aboutStat3Val, label: t.aboutStat3Label },
  ];

  return (
    <div className="relative">
      <AmbientBackground />
      <Navbar />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 md:pt-24">
          <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
            {t.aboutKicker}
          </p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 max-w-3xl font-display text-5xl leading-[1.05] md:text-6xl"
          >
            {t.aboutTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/70"
          >
            {t.aboutLead}
          </motion.p>
        </section>

        {/* Story */}
        <section className="mx-auto mt-20 max-w-6xl px-6 md:mt-28">
          <div className="grid gap-10 border-t-2 border-ink pt-10 md:grid-cols-[1fr_1.4fr]">
            <h2 className="font-display text-3xl leading-tight md:text-4xl">
              {t.aboutStoryTitle}
            </h2>
            <p className="text-base leading-relaxed text-ink/70 md:text-lg">
              {t.aboutStoryBody}
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-20 border-y hairline bg-grain md:mt-28">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
              {t.aboutStatsTitle}
            </p>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border hairline bg-ink/10 sm:grid-cols-3">
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-paper p-8"
                >
                  <p className="font-display text-4xl text-ink">{s.val}</p>
                  <p className="mt-2 text-sm text-ink/60">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <h2 className="max-w-md font-display text-4xl md:text-5xl">{t.aboutValuesTitle}</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border-t-2 border-ink pt-6"
              >
                <h3 className="font-display text-2xl">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="flex flex-col gap-6 rounded-3xl border hairline bg-ink px-8 py-12 text-paper sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl">{t.aboutCtaTitle}</h2>
              <p className="mt-2 text-sm text-paper/70">{t.aboutCtaBody}</p>
            </div>
            <Link
              href="/register"
              className="shrink-0 rounded-full bg-paper px-7 py-3.5 text-sm font-medium text-ink transition hover:bg-paper/90"
            >
              {t.startFree}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <ChatBox />
    </div>
  );
}

export default function AboutPage() {
  return <AboutContent />;
}
