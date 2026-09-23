"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ChatBox } from "@/components/ChatBox";
import { Testimonials } from "@/components/landing/Testimonials";
import { WorkQueueVisual } from "@/components/landing/PageVisuals";

const SIGNUP = "/register?type=accountant";

// Reduced motion keeps the fade, drops the slide.
const reveal = (i = 0, reduced: boolean | null = false) =>
  ({
    initial: { opacity: 0, y: reduced ? 0 : 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { type: "spring", bounce: 0, duration: 0.5, delay: i * 0.06 },
  }) as const;

function ForAccountantsContent() {
  const { t } = useLanguage();
  const rm = useReducedMotion();

  const queue = [
    { title: t.fbQueue1Title, body: t.fbQueue1Body },
    { title: t.fbQueue2Title, body: t.fbQueue2Body },
    { title: t.fbQueue3Title, body: t.fbQueue3Body },
    { title: t.fbQueue4Title, body: t.fbQueue4Body },
  ];
  const work = [
    { title: t.fbWork1Title, body: t.fbWork1Body },
    { title: t.fbWork2Title, body: t.fbWork2Body },
    { title: t.fbWork3Title, body: t.fbWork3Body },
    { title: t.fbWork4Title, body: t.fbWork4Body },
    { title: t.fbWork5Title, body: t.fbWork5Body },
    { title: t.fbWork6Title, body: t.fbWork6Body },
  ];
  const grow = [
    { title: t.fbGrow1Title, body: t.fbGrow1Body },
    { title: t.fbGrow2Title, body: t.fbGrow2Body },
    { title: t.fbGrow3Title, body: t.fbGrow3Body },
  ];
  const steps = [
    { title: t.fbStep1Title, body: t.fbStep1Body },
    { title: t.fbStep2Title, body: t.fbStep2Body },
    { title: t.fbStep3Title, body: t.fbStep3Body },
    { title: t.fbStep4Title, body: t.fbStep4Body },
  ];

  return (
    <div className="relative">
      <AmbientBackground />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="border-b hairline bg-grain">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
                {t.fbKicker}
              </p>
              <motion.h1
                initial={{ opacity: 0, y: rm ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="mt-4 max-w-2xl font-display text-5xl leading-[1.05] md:text-6xl"
              >
                {t.fbTitle}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: rm ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.08 }}
                className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70"
              >
                {t.fbSubtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: rm ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.5, delay: 0.14 }}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                <Link
                  href={SIGNUP}
                  className="inline-block rounded-full bg-nordic-600 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-nordic-700 active:scale-[0.97] active:opacity-90"
                >
                  {t.fbCta}
                </Link>
                <a
                  href="#how"
                  className="rounded-full border hairline px-6 py-3.5 text-sm font-medium transition hover:border-ink/40 active:scale-[0.97] active:opacity-80"
                >
                  {t.fbCtaSecondary}
                </a>
              </motion.div>
              <p className="mt-4 text-xs text-ink/45">{t.fbDisclaimer}</p>
            </div>
            <WorkQueueVisual />
          </div>
        </section>

        {/* What the queue catches */}
        <section className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
              {t.fbQueueKicker}
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{t.fbQueueTitle}</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/65">{t.fbQueueBody}</p>
          </div>
          <ul className="divide-y hairline border-y hairline">
            {queue.map((q, i) => (
              <motion.li key={q.title} {...reveal(i, rm)} className="flex gap-4 py-5">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-nordic-600" />
                <div>
                  <h3 className="font-display text-xl">{q.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/65">{q.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* Workspace */}
        <section className="border-y hairline bg-grain">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="max-w-xl font-display text-3xl md:text-4xl">{t.fbWorkTitle}</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border hairline bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
              {work.map((w, i) => (
                <motion.div
                  key={w.title}
                  {...reveal(i, rm)}
                  className="bg-paper p-8 transition-colors hover:bg-ink/[0.02]"
                >
                  <h3 className="font-display text-xl">{w.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">{w.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Testimonials audience="firm" />

        {/* Getting clients */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
            {t.fbGrowKicker}
          </p>
          <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight md:text-5xl">
            {t.fbGrowTitle}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/65">{t.fbGrowBody}</p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {grow.map((g, i) => (
              <motion.div key={g.title} {...reveal(i, rm)} className="rounded-2xl border hairline bg-paper p-6">
                <h3 className="font-display text-xl">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{g.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works: a real sequence, so the numbers carry meaning */}
        <section id="how" className="scroll-mt-24 border-t hairline bg-grain">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
              {t.fbHowKicker}
            </p>
            <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight md:text-5xl">
              {t.fbHowTitle}
            </h2>
            <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {steps.map((s, i) => (
                <motion.li key={s.title} {...reveal(i, rm)} className="border-t-2 border-ink pt-6">
                  <span className="font-display text-5xl text-nordic-600/90">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-2xl">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/65">{s.body}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA strip */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <motion.div
            {...reveal(0, rm)}
            className="flex flex-col gap-6 rounded-3xl border hairline bg-paper p-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-display text-2xl">{t.fbCtaTitle}</h2>
              <p className="mt-1 text-sm text-ink/60">{t.fbCtaBody}</p>
            </div>
            <Link
              href={SIGNUP}
              className="shrink-0 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition hover:bg-nordic-900 active:scale-[0.97] active:opacity-90"
            >
              {t.fbCta}
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
      <ChatBox />
    </div>
  );
}

export default function ForAccountantsPage() {
  return <ForAccountantsContent />;
}
