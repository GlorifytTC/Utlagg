"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";

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
    labelKey: "featuresCompareBankidLabel",
    utlaggKey: "featuresCompareBankidUtlagg",
    tradKey: "featuresCompareBankidTraditional",
  },
  {
    labelKey: "featuresCompareDataLabel",
    utlaggKey: "featuresCompareDataUtlagg",
    tradKey: "featuresCompareDataTraditional",
  },
] as const;

function FeaturesPageContent() {
  const { t } = useLanguage();

  const FEATURES = [
    { title: t.feature1Title, body: t.feature1Body },
    { title: t.feature2Title, body: t.feature2Body },
    { title: t.feature3Title, body: t.feature3Body },
    { title: t.feature4Title, body: t.feature4Body },
    { title: t.feature5Title, body: t.feature5Body },
    { title: t.feature6Title, body: t.feature6Body },
  ];

  return (
    <div className="relative">
      <AmbientBackground />
      <Navbar />

      <main>
        {/* Hero strip */}
        <section className="border-b hairline bg-grain">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
              {t.features}
            </p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 max-w-2xl font-display text-5xl leading-[1.05] md:text-6xl"
            >
              {t.featuresHeadline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70"
            >
              {t.featuresPageSubtitle}
            </motion.p>
          </div>
        </section>

        {/* Grid */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-px overflow-hidden rounded-2xl border hairline bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-paper p-8"
              >
                <h3 className="font-display text-xl">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comparison table */}
        <section className="border-t hairline bg-grain">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="mb-10 max-w-xl font-display text-3xl md:text-4xl">
              {t.featuresCompareTitle}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b hairline">
                    <th className="pb-4 pr-8 font-medium text-ink/60">
                      {t.featuresCompareCapability}
                    </th>
                    <th className="pb-4 pr-8 font-medium text-ink">
                      {t.featuresCompareUtlagg}
                    </th>
                    <th className="pb-4 pr-8 font-medium text-ink/60">
                      {t.featuresCompareTraditional}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y hairline">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.labelKey}>
                      <td className="py-4 pr-8">
                        {t[row.labelKey as keyof typeof t] as string}
                      </td>
                      <td className="py-4 pr-8 font-medium text-nordic-600">
                        {t[row.utlaggKey as keyof typeof t] as string}
                      </td>
                      <td className="py-4 pr-8 text-ink/60">
                        {t[row.tradKey as keyof typeof t] as string}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6 rounded-3xl border hairline bg-paper p-8 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="font-display text-2xl">
                {t.featuresCtaTitle}
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {t.featuresCtaBody}
              </p>
            </div>
            <Link
              href="/register"
              className="shrink-0 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition hover:bg-nordic-900"
            >
              {t.startFree}
            </Link>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <LanguageProvider>
      <FeaturesPageContent />
    </LanguageProvider>
  );
}