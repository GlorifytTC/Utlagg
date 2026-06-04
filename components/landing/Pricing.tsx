"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function Pricing() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelect(tier: string) {
    if (tier === "free") {
      router.push("/register");
      return;
    }
    if (tier === "enterprise") {
      window.location.href = "mailto:sales@Utlagg .se?subject=Enterprise";
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

  return (
    <section id="priser" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mb-14 max-w-xl">
        <p className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600">
          Priser
        </p>
        <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
          Enkelt. Per företag, inte per användare.
        </h2>
      </div>

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
                Populärast
              </span>
            )}
            <h3 className="font-display text-2xl">{plan.name}</h3>
            <p className="mt-2 font-sans text-3xl font-semibold">
              {plan.priceLabel}
            </p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-ink/80">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-amber">✓</span>
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
                ? "Laddar…"
                : plan.tier === "free"
                  ? "Börja gratis"
                  : plan.tier === "enterprise"
                    ? "Kontakta oss"
                    : "Välj " + plan.name}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
