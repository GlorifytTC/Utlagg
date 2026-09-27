// app/page.tsx
"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ScrollText, Server, ShieldCheck } from "lucide-react";
import { HeroSection } from "@/components/landing/HeroSection";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { StructuredData } from "@/components/StructuredData";
import { useLanguage } from "@/context/LanguageContext";
import { ChatBox } from "@/components/ChatBox";
import { Testimonials } from "@/components/landing/Testimonials";
import { WorkQueueVisual } from "@/components/landing/PageVisuals";
import { CtaPanel } from "@/components/landing/Cta";
import { StepsSticky } from "@/components/landing/StepsSticky";
import { reveal } from "@/components/landing/motion";
import { cn } from "@/lib/utils";

function HomeContent() {
  const { t } = useLanguage();
  const rm = useReducedMotion();

  const trust = [
    { icon: ShieldCheck, label: t.trustBankid },
    { icon: ScrollText, label: t.trustAudit },
    { icon: Server, label: t.trustEu },
  ];

  // Businesses and accounting firms are both buyers: asymmetric 7/5 split.
  const audiences = [
    {
      href: "/features",
      title: t.audienceCompanyTitle,
      body: t.audienceCompanyBody,
      cta: t.audienceCompanyCta,
      span: "md:col-span-7",
      tint: false,
    },
    {
      href: "/for-accountants",
      title: t.audienceFirmTitle,
      body: t.audienceFirmBody,
      cta: t.audienceFirmCta,
      tag: t.audienceFree,
      span: "md:col-span-5",
      tint: true,
    },
  ];

  return (
    <div className="light-surface relative overflow-x-clip">
      <AmbientBackground />
      <StructuredData />
      <Navbar />

      <main>
        <HeroSection />

        {/* Trust row: what a finance buyer checks first */}
        <section className="mx-auto max-w-6xl px-6">
          <ul className="grid gap-6 border-y hairline py-8 sm:grid-cols-3">
            {trust.map(({ icon: Icon, label }, i) => (
              <motion.li
                key={label}
                {...reveal(i, rm)}
                className="flex items-center gap-3 text-sm text-ink/70"
              >
                <Icon className="h-5 w-5 shrink-0 text-nordic-600" strokeWidth={1.5} />
                {label}
              </motion.li>
            ))}
          </ul>
        </section>

        {/* Audience split */}
        <section className="mx-auto grid max-w-6xl gap-5 px-6 py-24 md:grid-cols-12 md:py-32">
          {audiences.map((a, i) => (
            <motion.div key={a.href} {...reveal(i, rm)} className={cn("bezel", a.span)}>
              <Link
                href={a.href}
                className={cn(
                  "bezel-core group flex h-full flex-col p-8 md:p-10",
                  a.tint && "light-surface bg-nordic-50",
                )}
              >
                {a.tag && (
                  <span className="mb-6 w-fit rounded-full bg-nordic-600 px-3 py-1 text-xs font-medium text-white">
                    {a.tag}
                  </span>
                )}
                <h2 className="max-w-md font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                  {a.title}
                </h2>
                <p className="mt-4 max-w-md flex-1 text-base leading-relaxed text-ink/65">
                  {a.body}
                </p>
                <span className="mt-10 inline-flex items-center gap-3 text-sm font-medium text-ink">
                  {a.cta}
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/5 transition duration-500 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:bg-ink group-hover:text-paper">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </section>

        <Testimonials audience="company" />

        {/* Feature teaser: 3-cell bento, one tall cell with a live visual */}
        <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-xl font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
              {t.featuresHeadline}
            </h2>
            <Link
              href="/features"
              className="shrink-0 text-sm font-medium text-nordic-600 transition hover:text-nordic-700"
            >
              {t.features} →
            </Link>
          </div>

          <div className="mt-14 grid grid-flow-dense gap-5 md:grid-cols-12">
            <motion.div {...reveal(0, rm)} className="bezel md:col-span-7 md:row-span-2">
              <div className="bezel-core flex h-full flex-col overflow-hidden p-8 md:p-10">
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  {t.feature9Title}
                </h3>
                <p className="mt-3 max-w-sm text-base leading-relaxed text-ink/65">
                  {t.feature9Body}
                </p>
                <div className="mt-10 flex flex-1 items-end">
                  <WorkQueueVisual />
                </div>
              </div>
            </motion.div>
            <motion.div {...reveal(1, rm)} className="bezel md:col-span-5">
              <div className="bezel-core light-surface h-full bg-nordic-50 p-8 md:p-10">
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  {t.feature7Title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-ink/65">{t.feature7Body}</p>
              </div>
            </motion.div>
            <motion.div {...reveal(2, rm)} className="bezel md:col-span-5">
              <div className="bezel-core h-full p-8 md:p-10">
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  {t.feature8Title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-ink/65">{t.feature8Body}</p>
              </div>
            </motion.div>
          </div>
        </section>

        <StepsSticky
          title={t.howTitle}
          steps={[
            { title: t.howStep1Title, body: t.howStep1Body },
            { title: t.howStep2Title, body: t.howStep2Body },
            { title: t.howStep3Title, body: t.howStep3Body },
          ]}
        />

        <CtaPanel
          title={t.pricingTitle}
          body={t.pricingCalloutSubtitle}
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

export default function HomePage() {
  return <HomeContent />;
}
