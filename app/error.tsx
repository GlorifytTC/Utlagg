"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const sv = useLanguage().lang === "sv";
  return (
    <main className="light-surface flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        {sv ? "Något gick fel" : "Something went wrong"}
      </h1>
      <p className="mt-4 max-w-md text-ink/65">
        {sv ? "Ett oväntat fel uppstod. Försök igen om en stund." : "An unexpected error occurred. Please try again shortly."}
      </p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="min-h-11 rounded-full bg-nordic-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-nordic-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          {sv ? "Försök igen" : "Try again"}
        </button>
        <a href="/" className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          {sv ? "Till startsidan" : "Back to home"}
        </a>
      </div>
    </main>
  );
}
