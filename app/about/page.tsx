"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ChatBox } from "@/components/ChatBox";
import { CtaPanel } from "@/components/landing/Cta";
import { enter, reveal } from "@/components/landing/motion";
import { cn } from "@/lib/utils";

function AboutContent() {
  const { t } = useLanguage();
  const rm = useReducedMotion();

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
    <div className="light-surface relative overflow-x-clip">
      <AmbientBackground />
      <Navbar />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pb-28 md:pt-20">
          <motion.p {...enter(0, rm)} className="text-sm font-medium text-nordic-600">
            {t.aboutKicker}
          </motion.p>
          <motion.h1
            {...enter(1, rm)}
            className="mt-5 max-w-4xl font-display text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl break-words hyphens-auto"
          >
            {t.aboutTitle}
          </motion.h1>
          <motion.p
            {...enter(2, rm)}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/65 md:text-xl"
          >
            {t.aboutLead}
          </motion.p>
        </section>

        {/* Story */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <motion.div
            {...reveal(0, rm)}
            className="grid gap-10 border-t-2 border-ink pt-10 md:grid-cols-[1fr_1.4fr] md:gap-20"
          >
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {t.aboutStoryTitle}
            </h2>
            <p className="text-base leading-relaxed text-ink/70 md:text-lg">{t.aboutStoryBody}</p>
          </motion.div>
        </section>

        {/* Stats: large type on a tinted band, no cards */}
        <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <h2 className="sr-only">{t.aboutStatsTitle}</h2>
          <div className="light-surface grid divide-y divide-ink/10 rounded-[2rem] bg-nordic-50 px-8 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-0 md:py-14">
            {stats.map((s, i) => (
              <motion.div key={i} {...reveal(i, rm)} className="py-10 md:px-10 md:py-0">
                <p className="font-display text-4xl font-semibold tracking-tight text-nordic-700 md:text-5xl">
                  {s.val}
                </p>
                <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-ink/65">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Values: asymmetric trio */}
        <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <h2 className="max-w-md font-display text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {t.aboutValuesTitle}
          </h2>
          <div className="mt-14 grid grid-flow-dense gap-5 md:grid-cols-2">
            {values.map((v, i) => (
              <motion.div
                key={i}
                {...reveal(i, rm)}
                className={cn("bezel", i === 0 && "md:row-span-2")}
              >
                <div
                  className={cn(
                    "bezel-core flex h-full flex-col p-6 sm:p-8 md:p-10",
                    i === 0 &&
                      "light-surface justify-end bg-[radial-gradient(130%_100%_at_0%_0%,rgb(var(--accent-tint))_0%,#fffdf8_70%)] md:min-h-[22rem]",
                  )}
                >
                  <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                    {v.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-ink/65">
                    {v.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <CtaPanel
          title={t.aboutCtaTitle}
          body={t.aboutCtaBody}
          href="/register"
          label={t.startFree}
          note={t.heroDisclaimer}
        />
      </main>
      <Footer />
      <ChatBox />
    </div>
  );
}

export default function AboutPage() {
  return <AboutContent />;
}
