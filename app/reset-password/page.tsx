"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Field } from "@/components/auth/Field";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

function ResetForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (password.length < 8) {
      setError(t.joinPwTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.rpMismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        router.push("/login?reset=success");
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e.error ?? e.message ?? t.rpError);
      }
    } catch {
      setError(t.rpError);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-6 space-y-2">
        <p role="alert" className="text-sm text-red-600">{t.rpInvalidLink}</p>
        <Link href="/forgot-password" className="inline-block py-2 text-sm text-nordic-700 underline">
          {t.rpRequestNew}
        </Link>
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Field
        id="rp-password"
        type="password"
        autoComplete="new-password"
        label={t.rpNewPassword}
        value={password}
        error={!!error}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        id="rp-confirm"
        type="password"
        autoComplete="new-password"
        label={t.rpConfirmPassword}
        value={confirm}
        error={!!error}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && (
        <div>
          <p id="form-error" role="alert" className="text-sm text-red-600">{error}</p>
          <Link href="/forgot-password" className="inline-block py-2 text-sm text-nordic-700 underline">
            {t.rpRequestNew}
          </Link>
        </div>
      )}
      <Button type="submit" disabled={loading} className="w-full dark:!text-white">
        {loading ? t.stSaving : t.rpSave}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  return (
    <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">{t.rpTitle}</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-ink/65">{t.loading}</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
