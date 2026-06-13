"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ChatBox } from "@/components/ChatBox";

const PRICING_TABLE_ROWS = [
  { labelKey: "pricingTableReceipts", free: "50", pro: "500", business: "2,500", enterprise: "∞" },
  { labelKey: "pricingTableMembers", free: "1", pro: "1", business: "Upp till 20", enterprise: "∞" },
  { labelKey: "pricingTableOcr", free: "✓", pro: "✓", business: "✓", enterprise: "✓" },
  { labelKey: "pricingTableBas", free: "✓", pro: "✓", business: "✓", enterprise: "✓" },
  { labelKey: "pricingTableCurrency", free: "✓", pro: "✓", business: "✓", enterprise: "✓" },
  { labelKey: "pricingTableSie4", free: "✓", pro: "✓", business: "✓", enterprise: "✓" },
  {
    labelKey: "pricingTableSync",
    free: "—",
    pro: "✓",
    business: "✓",
    enterprise: "✓",
  },
  { labelKey: "pricingTableBankid", free: "✓", pro: "✓", business: "✓", enterprise: "✓" },
  { labelKey: "pricingTableRoles", free: "—", pro: "—", business: "✓", enterprise: "✓" },
  { labelKey: "pricingTableLimits", free: "—", pro: "—", business: "✓", enterprise: "✓" },
  { labelKey: "pricingTableOnboarding", free: "—", pro: "—", business: "—", enterprise: "✓" },
  { labelKey: "pricingTableSupport", free: "—", pro: "—", business: "✓", enterprise: "✓" },
] as const;

const FAQ_KEYS = [
  { q: "pricingFaq1Q" as const, a: "pricingFaq1A" as const },
  { q: "pricingFaq2Q" as const, a: "pricingFaq2A" as const },
  { q: "pricingFaq3Q" as const, a: "pricingFaq3A" as const },
  { q: "pricingFaq4Q" as const, a: "pricingFaq4A" as const },
];

const TIER_ORDER = ["free", "pro", "business", "enterprise"] as const;

function PricingPageContent() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { t } = useLanguage();

  async function handleSelect(tier: string) {
    if (tier === "free") {
      router.push("/register");
      return;
    }
    if (tier === "enterprise") {
      window.location.href = "mailto:sales@Utlagg.se?subject=Enterprise";
      return;
    }
    if (status !== "authenticated") {
      router.push(`/register?plan=${tier}`);
      return;
    }
    try {
      setLoading(tier);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Kunde inte starta betalning");
    } finally {
      setLoading(null);
    }
  }

  const getPlanName = (tier: string) =>
    t[
      `plan${tier.charAt(0).toUpperCase() + tier.slice(1)}` as keyof typeof t
    ] as string;

  const getFeatures = (tier: string) =>
    t[
      `plan${tier.charAt(0).toUpperCase() + tier.slice(1)}Features` as keyof typeof t
    ] as string[];

  return (
    <div className="bg-paper">
      <Navbar />

      <main>
        {/* Hero strip */}
        <section className="border-b hairline bg-grain">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
              {t.pricingTagline}
            </p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 max-w-2xl font-display text-5xl leading-[1.05] md:text-6xl"
            >
              {t.pricingTitle}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70"
            >
              {t.pricingPageSubtitle}
            </motion.p>
          </div>
        </section>

        {/* Plan cards */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.tier}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={cn(
                  "flex flex-col rounded-2xl border bg-white/60 p-6 backdrop-blur",
                  plan.highlight
                    ? "border-nordic-600 shadow-[0_20px_60px_-30px_rgba(47,96,121,0.6)]"
                    : "hairline",
                )}
              >
                {plan.highlight && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-nordic-600 px-3 py-1 text-xs font-medium text-white">
                    {t.pricingPopular}
                  </span>
                )}
                <h3 className="font-display text-2xl">
                  {getPlanName(plan.tier)}
                </h3>
                <p className="mt-2 font-sans text-3xl font-semibold">
                  {plan.priceLabel}
                </p>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-ink/80">
                  {getFeatures(plan.tier).map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-nordic-600">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelect(plan.tier)}
                  disabled={loading === plan.tier}
                  className={cn(
                    "mt-7 rounded-full px-5 py-3 text-sm font-medium transition",
                    plan.highlight
                      ? "bg-ink text-paper hover:bg-nordic-900"
                      : "border border-ink/20 hover:border-ink/40",
                    loading === plan.tier && "opacity-60",
                  )}
                >
                  {loading === plan.tier
                    ? t.pricingLoading
                    : plan.tier === "free"
                      ? t.startFree
                      : plan.tier === "enterprise"
                        ? t.pricingContactUs
                        : `${t.pricingChoosePlan} ${getPlanName(plan.tier)}`}
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feature comparison */}
        <section className="border-t hairline bg-grain">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="mb-10 font-display text-3xl md:text-4xl">
              {t.pricingComparisonTitle}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b hairline">
                    <th className="pb-4 pr-8 font-medium text-ink/60" />
                    {TIER_ORDER.map((tier) => (
                      <th key={tier} className="pb-4 pr-8 font-medium text-ink">
                        {getPlanName(tier)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y hairline">
                  {PRICING_TABLE_ROWS.map((row) => (
                    <tr key={row.labelKey}>
                      <td className="py-4 pr-8">
                        {t[row.labelKey as keyof typeof t] as string}
                      </td>
                      {TIER_ORDER.map((tier) => (
                        <td
                          key={tier}
                          className={cn(
                            "py-4 pr-8",
                            row[tier] === "—" && "text-ink/40",
                          )}
                        >
                          {row[tier] === "∞" ? t.unlimited : row[tier]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="mb-10 font-display text-3xl md:text-4xl">
            {t.pricingFaqTitle}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {FAQ_KEYS.map((item, i) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border hairline bg-paper p-6"
              >
                <h3 className="font-display text-lg">
                  {t[item.q as keyof typeof t] as string}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {t[item.a as keyof typeof t] as string}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t hairline bg-grain">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <h2 className="font-display text-3xl md:text-4xl">
              {t.pricingBottomTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-ink/70">
              {t.pricingBottomSubtitle}
            </p>
            <Link
              href="/register"
              className="mt-8 inline-block rounded-full bg-ink px-8 py-3.5 text-sm font-medium text-paper transition hover:bg-nordic-900"
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

export default function PricingPage() {
  return (
    <LanguageProvider>
      <PricingPageContent />
    </LanguageProvider>
  );
}