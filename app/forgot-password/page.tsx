"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Field } from "@/components/auth/Field";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function submit() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">{t.fpTitle}</h1>
        {sent ? (
          <p role="status" className="mt-6 text-sm text-ink/70">
            {t.fpSent}
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-ink/70">
              {t.fpIntro}
            </p>
            <Field
              id="fp-email"
              type="email"
              autoComplete="email"
              label={t.fldEmail}
              value={email}
              error={error}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && <p id="form-error" role="alert" className="text-sm text-red-600">{t.somethingWentWrong}</p>}
            <Button onClick={submit} disabled={loading || !email} className="w-full dark:!text-white">
              {loading ? t.stSubmitting : t.fpSend}
            </Button>
          </div>
        )}
        <p className="mt-6 text-sm text-ink/65">
          <Link href="/login" className="inline-flex min-h-11 items-center underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
            {t.fpBackToLogin}
          </Link>
        </p>
      </div>
    </main>
  );
}
