// components/landing/Features.tsx
"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function Features() {
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
    <section id="funktioner" className="border-y hairline bg-grain">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-14 max-w-xl font-display text-4xl md:text-5xl">
          {t.featuresHeadline}
        </h2>
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
      </div>
    </section>
  );
}