import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kvittino palette: warm off-white paper, near-black ink, one terracotta accent.
        paper: "#FAF8F3",
        ink: "#1A1A1A",
        fog: "#F1ECE0",
        // The former "nordic" blue scale is repointed to the terracotta accent so
        // every existing `nordic-*` usage becomes the brand accent and picks up the
        // light/dark value automatically via the CSS variables in globals.css.
        nordic: {
          50: "rgb(var(--accent-tint) / <alpha-value>)",
          300: "rgb(var(--accent) / <alpha-value>)",
          400: "rgb(var(--accent) / <alpha-value>)",
          500: "rgb(var(--accent) / <alpha-value>)",
          600: "rgb(var(--accent) / <alpha-value>)",
          700: "rgb(var(--accent-strong) / <alpha-value>)",
          900: "rgb(var(--accent-strong) / <alpha-value>)",
        },
        // Semantic alias for new code — same accent token.
        accent: "rgb(var(--accent) / <alpha-value>)",
        amber: "#D98A37",
      },
      fontFamily: {
        // All-sans system per the rebrand — Plus Jakarta Sans replaces the old
        // serif-display / sans-body pairing. `display` kept as an alias so the
        // ~100 existing `font-display` headings render in the new sans.
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
