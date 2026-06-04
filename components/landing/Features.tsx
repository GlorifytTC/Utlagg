"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "AI-skanning",
    body: "Fota kvittot — AI:n läser leverantör, datum, belopp och moms på sekunder.",
  },
  {
    title: "Svensk moms",
    body: "6/12/25 % hanteras automatiskt, inklusive den tillfälliga matmomsen 2026–2027.",
  },
  {
    title: "BAS-konton",
    body: "Sökbar BAS-kontoplan så varje utlägg hamnar på rätt konto direkt.",
  },
  {
    title: "7-årig revisionslogg",
    body: "Varje åtgärd loggas med tidsstämpel och IP enligt bokföringslagen.",
  },
  {
    title: "Export till Skatteverket",
    body: "Ladda ner som CSV eller PDF — redo för din revisor eller bokföring.",
  },
  {
    title: "BankID-redo",
    body: "Förberedd för inloggning och attest med BankID (lanseras i fas 2).",
  },
];

export function Features() {
  return (
    <section id="funktioner" className="border-y hairline bg-grain">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-14 max-w-xl font-display text-4xl md:text-5xl">
          Allt för svensk kvittohantering — på ett ställe.
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
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
