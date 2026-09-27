// Shared scroll-reveal props for the marketing pages.
// Reduced motion keeps the fade, drops the slide.
export const reveal = (i = 0, reduced: boolean | null = false) =>
  ({
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { type: "spring", bounce: 0, duration: 0.7, delay: i * 0.07 },
  }) as const;

// Same, for elements that animate on mount (above the fold).
export const enter = (i = 0, reduced: boolean | null = false) =>
  ({
    initial: { opacity: 0, y: reduced ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", bounce: 0, duration: 0.7, delay: i * 0.07 },
  }) as const;
