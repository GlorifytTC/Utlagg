"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ChatBox } from "@/components/ChatBox";
import { VatSplitVisual } from "@/components/landing/PageVisuals";
import { CtaLink, CtaPanel } from "@/components/landing/Cta";
import { enter, reveal } from "@/components/landing/motion";
import { cn } from "@/lib/utils";

const COMPARISON_ROWS = [
  {
    labelKey: "featuresCompareOcrLabel",
    utlaggKey: "featuresCompareOcrUtlagg",
    tradKey: "featuresCompareOcrTraditional",
  },
  {
    labelKey: "featuresCompareBasLabel",
    utlaggKey: "featuresCompareBasUtlagg",
    tradKey: "featuresCompareBasTraditional",
  },
  {
    labelKey: "featuresCompareVatLabel",
    utlaggKey: "featuresCompareVatUtlagg",
    tradKey: "featuresCompareVatTraditional",
  },
  {
    labelKey: "featuresCompareFirmLabel",
    utlaggKey: "featuresCompareFirmUtlagg",
    tradKey: "featuresCompareFirmTraditional",
  },
  {
    labelKey: "featuresCompareDataLabel",
    utlaggKey: "featuresCompareDataUtlagg",
    tradKey: "featuresCompareDataTraditional",
  },
] as const;

const COMPARE_COLS = [
  { nameKey: "featuresCompareUtlagg", key: "utlaggKey", ours: true },
  { nameKey: "featuresCompareTraditional", key: "tradKey", ours: false },
] as const;

function FeaturesPageContent() {
  const { t } = useLanguage();
  const rm = useReducedMotion();

  // Grouped by where the receipt is in its life: capture → review → deliver.
  const GROUPS = [
    {
      label: t.featuresGroupCapture,
      items: [
        { title: t.feature1Title, body: t.feature1Body },
        { title: t.feature7Title, body: t.feature7Body },
        { title: t.feature6Title, body: t.feature6Body },
      ],
    },
    {
      label: t.featuresGroupReview,
      items: [
        { title: t.feature2Title, body: t.feature2Body },
        { title: t.feature3Title, body: t.feature3Body },
        { title: t.feature8Title, body: t.feature8Body },
      ],
    },
    {
      label: t.featuresGroupDeliver,
      items: [
        { title: t.feature5Title, body: t.feature5Body },
        { title: t.feature9Title, body: t.feature9Body },
        { title: t.feature4Title, body: t.feature4Body },
      ],
    },
  ];

  return (
    <div className="light-surface relative overflow-x-clip">
      <AmbientBackground />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-12 md:grid-cols-[1fr_1fr] md:pb-28 md:pt-20">
          <div>
            <motion.h1
              {...enter(0, rm)}
              className="max-w-xl font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
            >
              {t.featuresHeadline}
            </motion.h1>
            <motion.p
              {...enter(1, rm)}
              className="mt-6 max-w-lg text-lg leading-relaxed text-ink/65"
            >
              {t.featuresPageSubtitle}
            </motion.p>
            <motion.div {...enter(2, rm)} className="mt-10">
              <CtaLink href="/register">{t.startFree}</CtaLink>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: rm ? 1 : 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 0.9, delay: 0.15 }}
            className="bezel"
          >
            <div className="bezel-core light-surface overflow-hidden bg-[radial-gradient(120%_90%_at_20%_0%,rgb(var(--accent-tint))_0%,#fffdf8_60%)] px-6 pb-12 pt-12">
              <VatSplitVisual />
            </div>
          </motion.div>
        </section>

        {/* The receipt's life in three stages, read left to right */}
        <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid gap-14 md:grid-cols-3 md:gap-10">
            {GROUPS.map((g, gi) => (
              <motion.div key={g.label} {...reveal(gi, rm)} className="border-t-2 border-ink pt-6">
                <h2 className="text-sm font-semibold text-nordic-600">{g.label}</h2>
                <div className="mt-8 space-y-10">
                  {g.items.map((f) => (
                    <div key={f.title}>
                      <h3 className="font-display text-xl font-semibold tracking-tight">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink/65">{f.body}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comparison: two panels instead of a hairline table */}
        <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <h2 className="max-w-xl font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {t.featuresCompareTitle}
          </h2>
          <div className="mt-14 grid gap-5 md:grid-cols-[1.15fr_1fr]">
            {COMPARE_COLS.map((col, ci) => (
              <motion.div key={col.key} {...reveal(ci, rm)} className="bezel">
                <div
                  className={cn(
                    "bezel-core h-full p-8 md:p-10",
                    col.ours ? "light-surface bg-nordic-50" : "bg-transparent shadow-none",
                  )}
                >
                  <p
                    className={cn(
                      "font-display text-2xl font-semibold tracking-tight",
                      !col.ours && "text-ink/50",
                    )}
                  >
                    {t[col.nameKey]}
                  </p>
                  <dl className="mt-8 space-y-6">
                    {COMPARISON_ROWS.map((row) => (
                      <div key={row.labelKey}>
                        <dt className="text-xs font-medium text-ink/50">
                          {t[row.labelKey as keyof typeof t] as string}
                        </dt>
                        <dd
                          className={cn(
                            "mt-1 text-base",
                            col.ours ? "font-medium text-ink" : "text-ink/60",
                          )}
                        >
                          {t[row[col.key] as keyof typeof t] as string}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </motion.div>
            ))}
          </div>
          <Link
            href="/for-accountants"
            className="mt-10 inline-block text-sm font-medium text-nordic-600 transition hover:text-nordic-700"
          >
            {t.featuresFirmLink} →
          </Link>
        </section>

        <CtaPanel
          title={t.featuresCtaTitle}
          body={t.featuresCtaBody}
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

export default function FeaturesPage() {
  return <FeaturesPageContent />;
}
