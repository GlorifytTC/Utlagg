"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";

// R3F Canvas must run client-side only.
const Hero3D = dynamic(() => import("@/components/landing/Hero3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center text-ink/30 sm:h-[420px] md:h-[520px]">
      Laddar 3D…
    </div>
  ),
});

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-16 pt-14 md:grid-cols-2 md:pt-20">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-sm uppercase tracking-[0.2em] text-nordic-600"
          >
            Kvittohantering · Sverige
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl"
          >
            Fota kvittot.
            <br />
            <span className="text-nordic-600">AI:n sköter resten.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-6 max-w-md text-lg leading-relaxed text-ink/70"
          >
            Skanna, bokför moms automatiskt och exportera till Skatteverket.
            Byggd för svenska regler — från BAS-konton till 7-årig revisionslogg.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link
              href="/register"
              className="rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-paper transition hover:bg-nordic-900"
            >
              Starta gratis
            </Link>
            <Link
              href="#priser"
              className="rounded-full border border-ink/20 px-7 py-3.5 text-sm font-medium transition hover:border-ink/40"
            >
              Se priser
            </Link>
          </motion.div>
          <p className="mt-5 text-xs text-ink/45">
            25 skanningar/mån gratis · inget kort krävs
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-nordic-50 blur-3xl" />
          <Hero3D />
        </div>
      </div>
    </section>
  );
}
