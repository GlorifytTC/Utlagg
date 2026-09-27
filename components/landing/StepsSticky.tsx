"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { reveal } from "./motion";

/** "How it works": the heading stays pinned on the left while the steps scroll
 *  past on the right. A progress rail fills as the reader moves through the
 *  sequence, so the order is shown without numbering the steps. */
export function StepsSticky({
  id,
  title,
  body,
  steps,
}: {
  id?: string;
  title: string;
  body?: string;
  steps: { title: string; body: string }[];
}) {
  const rm = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 75%", "end 55%"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  return (
    <section id={id} className="scroll-mt-24 mx-auto max-w-6xl px-6 py-24 md:py-32">
      <div className="grid gap-12 md:grid-cols-[1fr_1.25fr] md:gap-20">
        <div className="md:sticky md:top-32 md:self-start">
          <h2 className="max-w-md font-display text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            {title}
          </h2>
          {body && <p className="mt-5 max-w-sm text-base leading-relaxed text-ink/65">{body}</p>}
        </div>

        <div className="relative pl-8">
          {/* Rail + fill */}
          <span aria-hidden className="absolute bottom-2 left-0 top-2 w-px bg-ink/10" />
          <motion.span
            aria-hidden
            style={{ scaleY: rm ? 1 : fill }}
            className="absolute bottom-2 left-0 top-2 w-px origin-top bg-nordic-600"
          />
          <ol ref={listRef} className="space-y-14 md:space-y-24">
            {steps.map((s) => (
              <motion.li key={s.title} {...reveal(0, rm)} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-8 top-2.5 h-px w-4 bg-nordic-600"
                />
                <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                  {s.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-ink/65">{s.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
