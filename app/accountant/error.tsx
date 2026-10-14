"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const sv = useLanguage().lang === "sv";
  return (
    <div role="alert" className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
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
        <a href="/accountant" className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          {sv ? "Till översikten" : "Back to overview"}
        </a>
      </div>
    </div>
  );
}
