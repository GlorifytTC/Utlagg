"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Field } from "@/components/auth/Field";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
          <div className="w-full max-w-sm space-y-4" aria-hidden="true">
            <div className="skeleton h-8 w-32 rounded-lg" />
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-full" />
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    const verify = searchParams.get("verify");
    if (verify === "success") setNotice(t.authVerifySuccess);
    else if (verify === "invalid") setError(t.authVerifyInvalid);
  }, [searchParams, t]);

  async function handleSubmit() {
    setError(null);
    setNotice(null);
    setUnverified(false);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      // NextAuth v4 collapses every authorize() failure into one generic
      // error, so ask separately why it failed before showing a message.
      try {
        const check = await fetch("/api/auth/check-verified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }).then((r) => r.json());
        if (check.reason === "unverified") {
          setUnverified(true);
          setError(t.authMustVerify);
        } else if (check.reason === "banned") {
          setError(t.authBanned.replace("{date}", new Date(check.bannedUntil).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")));
        } else {
          setError(t.authWrongCredentials);
        }
      } catch {
        setError(t.authWrongCredentials);
      }
      setLoading(false);
    } else {
      setLoading(false);
      router.push("/dashboard");
    }
  }

  async function handleResend() {
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendState(res.ok ? "sent" : "error");
    } catch {
      setResendState("error");
    }
  }

  return (
    <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">{t.login}</h1>
        <div className="mt-6 space-y-4">
          <Field
            id="login-email"
            type="email"
            autoComplete="email"
            label={t.fldEmail}
            value={email}
            error={!!error}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            id="login-password"
            type="password"
            autoComplete="current-password"
            label={t.authPassword}
            value={password}
            error={!!error}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {notice && !error && <p role="status" className="text-sm text-nordic-700">{notice}</p>}
          {error && <p id="form-error" role="alert" className="text-sm text-red-600">{error}</p>}
          {unverified && (
            <div className="rounded-lg bg-nordic-50 px-4 py-3 text-sm text-nordic-900">
              {resendState === "sent" ? (
                <p role="status">{t.authResentTo.replace("{email}", email)}</p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendState === "sending"}
                    className="inline-flex min-h-11 items-center underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20 disabled:opacity-60"
                  >
                    {resendState === "sending" ? t.stSubmitting : t.authResend}
                  </button>
                  {resendState === "error" && <p role="alert" className="text-red-600">{t.regResendError}</p>}
                </>
              )}
            </div>
          )}
          <Button onClick={handleSubmit} disabled={loading} className="w-full dark:!text-white">
            {loading ? t.authLoggingIn : t.login}
          </Button>
        </div>
        <p className="mt-6 text-sm text-ink/65">
          {t.authNoAccount}{" "}
          <Link href="/register" className="inline-block py-2 text-nordic-700 underline">
            {t.authCreateAccount}
          </Link>
        </p>
        <p className="text-sm text-ink/65">
          <Link href="/forgot-password" className="inline-block py-2 text-nordic-700 underline">
            {t.authForgotPassword}
          </Link>
        </p>
      </div>
    </main>
  );
}
