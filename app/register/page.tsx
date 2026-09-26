"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { useLanguage } from "@/context/LanguageContext";

// Cooldown between verification-email sends. Also armed right after signup so
// the button can't be hit instantly — gives the original mail time to arrive.
const RESEND_COOLDOWN = 30;

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  // Renders a sentence with {email} highlighted in <strong>.
  const withEmail = (s: string, email: string) => {
    const [pre, post] = s.split("{email}");
    return <>{pre}<strong>{email}</strong>{post}</>;
  };
  const [form, setForm] = useState({ name: "", companyName: "", email: "", password: "" });
  const [accountType, setAccountType] = useState<"user" | "accountant">(
    searchParams.get("type") === "accountant" ? "accountant" : "user",
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [emailFailed, setEmailFailed] = useState(false);
  // Inline "send it again" so someone who never got the mail can retry right
  // here, instead of being told to go hunt for a button on the login page.
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function resendVerification() {
    if (!sentTo || cooldown > 0 || resendState === "sending") return;
    setResendState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sentTo }),
      });
      if (res.ok) {
        setResendState("sent");
        setEmailFailed(false); // a successful resend clears the failure notice
        setCooldown(RESEND_COOLDOWN); // throttle client-side too; the API is rate-limited
      } else {
        setResendState("error");
      }
    } catch {
      setResendState("error");
    }
  }

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, accountType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t.error);
        return;
      }
      // No auto sign-in: the account isn't active until the email link is
      // clicked, so we show a "check your inbox" screen instead.
      setEmailFailed(data.verificationEmailSent === false);
      setSentTo(form.email);
      // Arm the cooldown immediately so "skicka igen" can't be spammed before
      // the first email has had a chance to land.
      setCooldown(RESEND_COOLDOWN);
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <Link href="/">
            <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
          </Link>
          <h1 className="mt-8 font-display text-3xl">{t.regCheckInbox}</h1>
          {emailFailed ? (
            <>
              <p className="mt-4 text-sm text-red-600">
                {withEmail(t.regEmailFailed, sentTo)}
              </p>
              <p className="mt-4 text-sm text-ink/70">
                {t.regEmailFailedHelpPre}{" "}
                <a href="mailto:support@utlagg.se" className="text-nordic-600 underline">
                  support@utlagg.se
                </a>{" "}
                {t.regEmailFailedHelpPost}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink/70">
              {withEmail(t.regSentTo, sentTo)}
            </p>
          )}

          {/* Resend, available in both cases — whether the first send failed
              outright or the mail simply never turned up. */}
          <div className="mt-6">
            <button
              onClick={resendVerification}
              disabled={cooldown > 0 || resendState === "sending"}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendState === "sending"
                ? t.stSubmitting
                : cooldown > 0
                  ? t.regResendIn.replace("{n}", String(cooldown))
                  : t.regResend}
            </button>
            {resendState === "sent" && cooldown > 0 && (
              <p className="mt-2 text-sm text-green-700">
                {withEmail(t.regResent, sentTo)}
              </p>
            )}
            {resendState === "error" && (
              <p className="mt-2 text-sm text-red-600">
                {t.regResendError}
              </p>
            )}
          </div>
          <p className="mt-6 text-sm text-ink/60">
            {t.regNoMailPre}{" "}
            <Link href="/login" className="text-nordic-600 underline">
              {t.regNoMailLogin}
            </Link>{" "}
            {t.regNoMailPost}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>
        <h1 className="mt-8 font-display text-3xl">{t.authCreateAccount}</h1>
        <p className="mt-2 text-sm text-ink/60">
          {accountType === "accountant"
            ? t.regAccountantSubtitle
            : t.regUserSubtitle}
        </p>

        {/* Account type. The server derives isAccountant from this choice. */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAccountType("user")}
            className={
              "rounded-lg border px-4 py-3 text-left text-sm transition-colors " +
              (accountType === "user"
                ? "border-ink bg-ink/[0.03]"
                : "hairline hover:border-ink/40")
            }
          >
            <span className="block font-medium text-ink">{t.regTypeUser}</span>
            <span className="mt-0.5 block text-xs text-ink/50">{t.regTypeUserDesc}</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountType("accountant")}
            className={
              "rounded-lg border px-4 py-3 text-left text-sm transition-colors " +
              (accountType === "accountant"
                ? "border-ink bg-ink/[0.03]"
                : "hairline hover:border-ink/40")
            }
          >
            <span className="block font-medium text-ink">{t.regTypeAccountant}</span>
            <span className="mt-0.5 block text-xs text-ink/50">{t.regTypeAccountantDesc}</span>
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <input placeholder={t.regName} value={form.name} onChange={update("name")}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none transition focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30" />
          <input placeholder={accountType === "accountant" ? t.regFirmOptional : t.regCompanyOptional} value={form.companyName} onChange={update("companyName")}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none transition focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30" />
          <input type="email" placeholder={t.fldEmail} value={form.email} onChange={update("email")}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none transition focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30" />
          <input type="password" placeholder={t.regPasswordHint} value={form.password} onChange={update("password")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none transition focus-visible:border-nordic-600 focus-visible:ring-2 focus-visible:ring-nordic-600/30" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition hover:bg-nordic-900 active:scale-[0.98] active:opacity-90 disabled:opacity-60">
            {loading ? t.regCreating : t.authCreateAccount}
          </button>
          <div className="flex items-center gap-3 text-xs text-ink/40">
            <span className="h-px flex-1 bg-ink/10" /> {t.regOr} <span className="h-px flex-1 bg-ink/10" />
          </div>
        </div>
        <p className="mt-6 text-sm text-ink/60">
          {t.regHaveAccount}{" "}
          <Link href="/login" className="text-nordic-600 underline">{t.login}</Link>
        </p>
      </div>
    </main>
  );
}
