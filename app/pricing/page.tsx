"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Minus, Plus } from "lucide-react";
import { SELECTABLE_PLANS, planFeatures, planName, planPrice, type Tier } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";
import { ChatBox } from "@/components/ChatBox";
import { TrialVisual } from "@/components/landing/PageVisuals";
import { CtaLink } from "@/components/landing/Cta";
import { enter, reveal } from "@/components/landing/motion";

// Scan quotas + feature matrix. Numbers mirror lib/billing/config.ts (the
// single source of truth) - keep them in sync if the tier table changes.
// Free is a deprecated tombstone (spec §7) - the offerable ladder now starts at
// Starter. SIE/SIE4 export is included on every paid tier (core), so it's a "✓"
// across the board; it is only ever gated in read-only/lapsed state (spec §C).
const PRICING_TABLE_ROWS = [
  { labelKey: "pricingTableReceipts", starter: "100", pro: "500", business: "1 500", max: "5 000", enterprise: "∞" },
  { labelKey: "pricingTableMembers", starter: "1", pro: "1", business: "5-10", max: "∞", enterprise: "∞" },
  { labelKey: "pricingTableOcr", starter: "✓", pro: "✓", business: "✓", max: "✓", enterprise: "✓" },
  { labelKey: "pricingTableBas", starter: "✓", pro: "✓", business: "✓", max: "✓", enterprise: "✓" },
  { labelKey: "pricingTableCurrency", starter: "✓", pro: "✓", business: "✓", max: "✓", enterprise: "✓" },
  { labelKey: "pricingTableSie4", starter: "✓", pro: "✓", business: "✓", max: "✓", enterprise: "✓" },
  { labelKey: "pricingTableRoles", starter: "-", pro: "-", business: "✓", max: "✓", enterprise: "✓" },
  { labelKey: "pricingTableLimits", starter: "-", pro: "-", business: "✓", max: "✓", enterprise: "✓" },
  { labelKey: "pricingTableOnboarding", starter: "-", pro: "-", business: "-", max: "✓", enterprise: "✓" },
  { labelKey: "pricingTableSupport", starter: "-", pro: "-", business: "✓", max: "✓", enterprise: "✓" },
] as const;

const FAQ_KEYS = [
  { q: "pricingFaq1Q" as const, a: "pricingFaq1A" as const },
  { q: "pricingFaq2Q" as const, a: "pricingFaq2A" as const },
  { q: "pricingFaq3Q" as const, a: "pricingFaq3A" as const },
  { q: "pricingFaq4Q" as const, a: "pricingFaq4A" as const },
];

const TIER_ORDER = ["starter", "pro", "business", "max", "enterprise"] as const;

// Rows that are "✓" on every tier say nothing in a matrix; show them once as chips.
const CORE_ROWS = PRICING_TABLE_ROWS.filter((r) => TIER_ORDER.every((tier) => r[tier] === "✓"));
const MATRIX_ROWS = PRICING_TABLE_ROWS.filter((r) => !CORE_ROWS.includes(r));

function PricingPageContent() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const { t } = useLanguage();
  const rm = useReducedMotion();

  async function handleSelect(tier: string) {
    if (tier === "free") {
      router.push("/register");
      return;
    }
    if (tier === "enterprise") {
      window.location.href = "mailto:sales@kvittino.se?subject=Enterprise";
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
      else alert(data.error ?? t.pricingCheckoutError);
    } finally {
      setLoading(null);
    }
  }

  const selfServe = SELECTABLE_PLANS.filter((p) => p.tier !== "enterprise");
  const enterprise = SELECTABLE_PLANS.find((p) => p.tier === "enterprise");

  const planButton = (tier: Tier, highlight: boolean | undefined, className?: string) => (
    <button
      onClick={() => handleSelect(tier)}
      disabled={loading === tier}
      className={cn(
        "min-h-11 whitespace-nowrap rounded-full px-5 py-3 text-sm font-medium transition duration-500 ease-premium active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20",
        highlight
          ? "bg-nordic-600 text-white hover:bg-nordic-700"
          : "border border-ink/15 hover:border-ink/40",
        loading === tier && "opacity-60",
        className,
      )}
    >
      {loading === tier
        ? t.pricingLoading
        : tier === "free"
          ? t.startFree
          : tier === "enterprise"
            ? t.pricingContactUs
            : `${t.pricingChoosePlan} ${planName(t, tier)}`}
    </button>
  );

  return (
    <div className="light-surface relative overflow-x-clip">
      <AmbientBackground />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl 2xl:max-w-7xl px-6 pb-16 pt-12 md:pt-20">
          <motion.h1
            {...enter(0, rm)}
            className="max-w-3xl font-display text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl break-words hyphens-auto"
          >
            {t.pricingTitle}
          </motion.h1>
          <motion.p
            {...enter(1, rm)}
            className="mt-6 max-w-xl text-lg leading-relaxed text-ink/65"
          >
            {t.pricingPageSubtitle}
          </motion.p>
        </section>

        {/* Plan cards: four self-serve plans in an even grid, Enterprise as a strip below */}
        <section className="mx-auto max-w-6xl 2xl:max-w-7xl px-6 pb-24 md:pb-32">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {selfServe.map((plan, i) => (
              <motion.div key={plan.tier} {...reveal(i, rm)} className="bezel">
                <div
                  className={cn(
                    "bezel-core flex h-full flex-col p-6",
                    plan.highlight && "bg-ink text-paper",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-semibold tracking-tight">
                      {planName(t, plan.tier)}
                    </h2>
                    {plan.highlight && (
                      <span className="rounded-full bg-nordic-600 px-2.5 py-1 text-[11px] font-medium text-white">
                        {t.pricingPopular}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-nowrap text-2xl font-semibold tracking-tight">{planPrice(t, plan)}</p>
                  <ul
                    className={cn(
                      "mt-6 flex-1 space-y-2.5 text-sm",
                      plan.highlight ? "text-paper/80" : "text-ink/75",
                    )}
                  >
                    {planFeatures(t, plan.tier).map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <Check
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            plan.highlight ? "text-nordic-300" : "text-nordic-600",
                          )}
                          strokeWidth={1.75}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {planButton(plan.tier, plan.highlight, "mt-8")}
                </div>
              </motion.div>
            ))}
          </div>
          {enterprise && (
            <motion.div {...reveal(selfServe.length, rm)} className="bezel mt-4">
              <div className="bezel-core flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    {planName(t, enterprise.tier)}
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink/75">
                    {planFeatures(t, enterprise.tier).map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-nordic-600" strokeWidth={1.75} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-6 md:justify-end">
                  <p className="whitespace-nowrap text-2xl font-semibold tracking-tight">{planPrice(t, enterprise)}</p>
                  {planButton(enterprise.tier, false)}
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Feature comparison: shared features as chips, only differences in the matrix */}
        <section className="mx-auto max-w-6xl 2xl:max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-xl font-display text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {t.pricingComparisonTitle}
          </h2>

          <div className="mt-12 flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-medium text-ink/65">{t.pricingIncludedAll}</span>
            {CORE_ROWS.map((row) => (
              <span
                key={row.labelKey}
                className="light-surface inline-flex items-center gap-1.5 rounded-full bg-nordic-50 px-3.5 py-1.5 text-sm text-nordic-700"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                {t[row.labelKey as keyof typeof t] as string}
              </span>
            ))}
          </div>

          <p className="mt-10 text-xs text-ink/65 md:hidden">{t.pricingScrollHint}</p>
          <div className="bezel mt-3 md:mt-10">
            <div className="bezel-core overflow-x-auto p-2 md:p-4">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-[#fffdf8] px-4 pb-4 pt-3 font-medium text-ink/65" />
                    {TIER_ORDER.map((tier) => (
                      <th key={tier} className="px-4 pb-4 pt-3 font-semibold text-ink">
                        {planName(t, tier)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_ROWS.map((row) => (
                    <tr key={row.labelKey} className="group odd:bg-ink/[0.025]">
                      <td className="sticky left-0 z-10 rounded-l-xl bg-[#fffdf8] group-odd:bg-[#f7f7f2] px-4 py-3.5 text-ink/75">
                        {t[row.labelKey as keyof typeof t] as string}
                      </td>
                      {TIER_ORDER.map((tier, ti) => (
                        <td
                          key={tier}
                          className={cn(
                            "px-4 py-3.5 tabular-nums",
                            ti === TIER_ORDER.length - 1 && "rounded-r-xl",
                          )}
                        >
                          {row[tier] === "✓" ? (
                            <>
                              <Check className="h-4 w-4 text-nordic-600" strokeWidth={2} aria-hidden />
                              <span className="sr-only">{t.pricingIncluded}</span>
                            </>
                          ) : row[tier] === "-" ? (
                            <>
                              <Minus className="h-4 w-4 text-ink/25" strokeWidth={1.5} aria-hidden />
                              <span className="sr-only">{t.pricingNotIncluded}</span>
                            </>
                          ) : row[tier] === "∞" ? (
                            t.unlimited
                          ) : (
                            row[tier]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ: native disclosure */}
        <section className="mx-auto grid max-w-6xl 2xl:max-w-7xl gap-12 px-6 py-24 md:grid-cols-[1fr_1.6fr] md:gap-20 md:py-32">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {t.pricingFaqTitle}
          </h2>
          <div className="border-t hairline">
            {FAQ_KEYS.map((item) => (
              <details key={item.q} className="group border-b hairline">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-lg font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                  {t[item.q as keyof typeof t] as string}
                  <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 transition duration-500 ease-premium group-open:rotate-45"
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </summary>
                <p className="max-w-xl pb-6 text-base leading-relaxed text-ink/65">
                  {t[item.a as keyof typeof t] as string}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA with the trial visual */}
        <section className="mx-auto max-w-6xl 2xl:max-w-7xl px-6 pb-24 md:pb-32">
          <motion.div {...reveal(0, rm)} className="bezel">
            <div className="bezel-core light-surface grid items-center gap-12 overflow-hidden bg-[radial-gradient(120%_100%_at_100%_100%,rgb(var(--accent-tint))_0%,#fffdf8_60%)] p-6 sm:p-8 md:grid-cols-2 md:p-14">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-[1.1] tracking-tight">
                  {t.pricingBottomTitle}
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-ink/65">
                  {t.pricingBottomSubtitle}
                </p>
                <CtaLink href="/register" className="mt-10">
                  {t.startFree}
                </CtaLink>
              </div>
              <div className="flex px-2 pb-6 md:justify-end md:px-0 md:pb-0">
                <TrialVisual />
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
      <ChatBox />
    </div>
  );
}

export default function PricingPage() {
  return <PricingPageContent />;
}