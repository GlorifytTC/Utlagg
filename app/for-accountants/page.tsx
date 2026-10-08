"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ClipboardCheck, Clock, FileWarning, ScanLine } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ChatBox } from "@/components/ChatBox";
import { Testimonials } from "@/components/landing/Testimonials";
import { WorkQueueVisual } from "@/components/landing/PageVisuals";
import { CtaLink, CtaPanel } from "@/components/landing/Cta";
import { StepsSticky } from "@/components/landing/StepsSticky";
import { enter, reveal } from "@/components/landing/motion";
import { cn } from "@/lib/utils";

const SIGNUP = "/register?type=accountant";

// Workspace bento on a 6-column grid: 4+2, 2+2+2, 6. Exactly six cells, two tinted.
const WORK_CELLS = [
  { span: "md:col-span-4", bg: "light-surface bg-nordic-50" },
  { span: "md:col-span-2", bg: "" },
  { span: "md:col-span-2", bg: "" },
  { span: "md:col-span-2", bg: "" },
  { span: "md:col-span-2", bg: "" },
  { span: "md:col-span-6", bg: "bg-grain bg-paper" },
];

function ForAccountantsContent() {
  const { t } = useLanguage();
  const rm = useReducedMotion();

  const queue = [
    { icon: ClipboardCheck, title: t.fbQueue1Title, body: t.fbQueue1Body },
    { icon: FileWarning, title: t.fbQueue2Title, body: t.fbQueue2Body },
    { icon: ScanLine, title: t.fbQueue3Title, body: t.fbQueue3Body },
    { icon: Clock, title: t.fbQueue4Title, body: t.fbQueue4Body },
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
    <div className="light-surface relative overflow-x-clip">
      <AmbientBackground />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl 2xl:max-w-7xl items-center gap-12 px-6 pb-20 pt-12 md:grid-cols-2 md:pb-28 md:pt-20">
          <div>
            <motion.p {...enter(0, rm)} className="text-sm font-medium text-nordic-700">
              {t.fbKicker}
            </motion.p>
            <motion.h1
              {...enter(1, rm)}
              className="mt-5 max-w-xl font-display text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl break-words hyphens-auto"
            >
              {t.fbTitle}
            </motion.h1>
            <motion.p
              {...enter(2, rm)}
              className="mt-6 max-w-lg text-lg leading-relaxed text-ink/65"
            >
              {t.fbSubtitle}
            </motion.p>
            <motion.div {...enter(3, rm)} className="mt-10 flex flex-wrap items-center gap-3">
              <CtaLink href={SIGNUP}>{t.fbCta}</CtaLink>
              <CtaLink href="#how" variant="ghost">
                {t.fbCtaSecondary}
              </CtaLink>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: rm ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 0.9, delay: 0.15 }}
            className="bezel"
          >
            <div className="bezel-core light-surface overflow-hidden bg-[radial-gradient(120%_90%_at_80%_0%,rgb(var(--accent-tint))_0%,#fffdf8_60%)] px-3 pb-12 sm:px-6 pt-14">
              <WorkQueueVisual />
            </div>
          </motion.div>
        </section>

        {/* What the queue catches: pinned heading, list scrolls past */}
        <section className="mx-auto grid max-w-6xl 2xl:max-w-7xl gap-12 px-6 py-24 md:grid-cols-[1fr_1.3fr] md:gap-20 md:py-32">
          <div className="md:sticky md:top-32 md:self-start">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              {t.fbQueueTitle}
            </h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/65">{t.fbQueueBody}</p>
          </div>
          <ul className="space-y-10">
            {queue.map(({ icon: Icon, title, body }, i) => (
              <motion.li key={title} {...reveal(i, rm)} className="flex gap-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/[0.04] text-nordic-600 ring-1 ring-ink/5">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-md text-base leading-relaxed text-ink/65">{body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* Workspace */}
        <section className="mx-auto max-w-6xl 2xl:max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-xl font-display text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {t.fbWorkTitle}
          </h2>
          <div className="mt-14 grid grid-flow-dense gap-5 md:grid-cols-6">
            {work.map((w, i) => (
              <motion.div
                key={w.title}
                {...reveal(i % 3, rm)}
                className={cn("bezel", WORK_CELLS[i].span)}
              >
                <div className={cn("bezel-core h-full p-6 sm:p-8", WORK_CELLS[i].bg)}>
                  <h3 className="font-display text-xl font-semibold tracking-tight">{w.title}</h3>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink/65">{w.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <Testimonials audience="firm" />

        {/* Getting clients: plain columns, no cards */}
        <section className="mx-auto max-w-6xl 2xl:max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-xl font-display text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {t.fbGrowTitle}
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/65">{t.fbGrowBody}</p>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {grow.map((g, i) => (
              <motion.div key={g.title} {...reveal(i, rm)}>
                <span aria-hidden className="block h-px w-10 bg-nordic-600" />
                <h3 className="mt-6 font-display text-xl font-semibold tracking-tight">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{g.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <StepsSticky id="how" title={t.fbHowTitle} steps={steps} />

        <CtaPanel
          title={t.fbCtaTitle}
          body={t.fbCtaBody}
          href={SIGNUP}
          label={t.fbCta}
          note={t.fbDisclaimer}
        />
      </main>

      <Footer />
      <ChatBox />
    </div>
  );
}

export default function ForAccountantsPage() {
  return <ForAccountantsContent />;
}
