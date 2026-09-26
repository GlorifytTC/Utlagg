"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

// PLACEHOLDER: invented quotes that show the layout before real customer quotes exist.
// They never render in production builds, because made-up reviews shown as real ones
// are misleading marketing. Replace QUOTES with real, approved quotes and then
// delete the NODE_ENV guard and the placeholder label.

type Quote = { quote: { sv: string; en: string }; name: string; role: { sv: string; en: string } };

const QUOTES: Record<"company" | "firm", Quote[]> = {
  company: [
    {
      quote: {
        sv: "Jag vidarebefordrar Kivra-kvittona och glömmer dem. Månadsavstämningen tar en kvart i stället för en eftermiddag.",
        en: "I forward my Kivra receipts and forget about them. Month-end takes fifteen minutes instead of an afternoon.",
      },
      name: "Exempel Exempelsson",
      role: { sv: "Enskild firma, konsult", en: "Sole trader, consultant" },
    },
    {
      quote: {
        sv: "Attesten gick från papperslappar på skrivbordet till en knapp i mobilen.",
        en: "Approvals went from paper slips on my desk to one tap on my phone.",
      },
      name: "Test Testsdotter",
      role: { sv: "Ekonomiansvarig, 8 anställda", en: "Finance lead, 8 employees" },
    },
    {
      quote: {
        sv: "Momsen på hotellkvitton blev rätt från början. Det var där vi alltid slarvade.",
        en: "VAT on hotel receipts is right from the start. That's where we always slipped.",
      },
      name: "Platshållare Persson",
      role: { sv: "VD, byggföretag", en: "CEO, construction company" },
    },
  ],
  firm: [
    {
      quote: {
        sv: "Jag börjar dagen i att-göra-listan. Kvitton som saknar moms hittar jag i mars i stället för vid bokslutet.",
        en: "I start the day in the to-do list. Receipts missing VAT turn up in March instead of at year-end.",
      },
      name: "Exempel Exempelsson",
      role: { sv: "Redovisningskonsult, 40 klienter", en: "Accountant, 40 clients" },
    },
    {
      quote: {
        sv: "Frågan om ett kvitto ställs vid kvittot. Inga fler mejltrådar med bilagor.",
        en: "Questions about a receipt are asked on the receipt. No more email threads with attachments.",
      },
      name: "Test Testsdotter",
      role: { sv: "Byråägare, 5 medarbetare", en: "Firm owner, 5 staff" },
    },
    {
      quote: {
        sv: "Varje medarbetare ser sina kunder och inget annat. Det gjorde det enkelt att släppa in nya kollegor.",
        en: "Everyone sees their own clients and nothing else. That made onboarding new colleagues easy.",
      },
      name: "Platshållare Persson",
      role: { sv: "Administratör, redovisningsbyrå", en: "Admin, accounting firm" },
    },
  ],
};

export function Testimonials({ audience }: { audience: "company" | "firm" }) {
  const { lang } = useLanguage();
  const reduced = useReducedMotion();
  if (process.env.NODE_ENV === "production") return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <p className="inline-block rounded-full border border-dashed border-ink/30 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink/50">
        {lang === "en" ? "Placeholder quotes · hidden in production" : "Platshållare · visas inte i produktion"}
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {QUOTES[audience].map((q, i) => (
          <motion.figure
            key={q.name}
            initial={{ opacity: 0, y: reduced ? 0 : 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0, duration: 0.5, delay: i * 0.06 }}
            className="flex flex-col rounded-2xl border hairline bg-paper p-6"
          >
            <blockquote className="flex-1 text-lg leading-snug text-ink">
              {/* Swedish typesetting uses ” on both sides */}
              {lang === "en" ? "\u201C" : "\u201D"}
              {q.quote[lang] ?? q.quote.sv}
              {"\u201D"}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="light-surface grid h-9 w-9 place-items-center rounded-full bg-nordic-50 text-xs font-semibold text-nordic-700">
                {q.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </span>
              <span className="text-sm">
                <span className="block font-medium text-ink">{q.name}</span>
                <span className="block text-ink/55">{q.role[lang] ?? q.role.sv}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
