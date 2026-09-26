"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-semibold">
          Kvittino
        </Link>
        <h1 className="mt-8 font-display text-3xl">{t.fpTitle}</h1>
        {sent ? (
          <p className="mt-6 text-sm text-ink/70">
            {t.fpSent}
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-ink/70">
              {t.fpIntro}
            </p>
            <input
              type="email"
              placeholder={t.fldEmail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none transition focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30"
            />
            <button
              onClick={submit}
              disabled={loading || !email}
              className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-nordic-900 active:scale-[0.98] active:opacity-90 disabled:opacity-60"
            >
              {loading ? t.stSubmitting : t.fpSend}
            </button>
          </div>
        )}
        <p className="mt-6 text-sm text-ink/60">
          <Link href="/login" className="underline">
            {t.fpBackToLogin}
          </Link>
        </p>
      </div>
    </main>
  );
}
