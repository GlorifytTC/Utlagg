import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nordic palette: warm paper, deep ink, a single cold-blue accent + amber
        paper: "#F4F1EA",
        ink: "#16181D",
        fog: "#E3DFD4",
        nordic: {
          50: "#EAF1F5",
          400: "#5B8AA6",
          600: "#2F6079",
          900: "#13343F",
        },
        amber: "#D98A37",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-schibsted)", "system-ui", "sans-serif"],
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
