"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/brand/Logo";
import { Field } from "@/components/auth/Field";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Firm join page. The invitee lands here from the invite email. It validates
 * the token, greets them by name, lets them set a password, then joins the firm
 * and signs them in. No prior account/registration needed.
 */
function FirmJoinInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [state, setState] = useState<"checking" | "form" | "invalid" | "done" | "working">("checking");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const validate = useCallback(async () => {
    if (!token) {
      setState("invalid");
      return;
    }
    try {
      const res = await fetch(`/api/firm/accept-setup?token=${encodeURIComponent(token)}`);
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.valid) {
        setEmail(d.email ?? "");
        setName(d.name ?? "");
        setState("form");
      } else {
        setState("invalid");
      }
    } catch {
      setState("invalid");
    }
  }, [token]);

  useEffect(() => {
    validate();
  }, [validate]);

  async function submit() {
    setError("");
    if (password.length < 8) {
      setError(t.joinPwTooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.rpMismatch);
      return;
    }
    setState("working");
    try {
      const res = await fetch("/api/firm/accept-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? t.somethingWentWrong);
        setState("form");
        return;
      }
      // Sign them in with the credentials they just set.
      const signInRes = await signIn("credentials", {
        email: d.email ?? email,
        password,
        redirect: false,
      });
      setState("done");
      if (signInRes?.ok) {
        router.push("/accountant");
      }
    } catch {
      setError(t.somethingWentWrong);
      setState("form");
    }
  }

  return (
    <main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-block rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
          <Logo size={28} wordmarkClassName="text-xl" adaptive={false} />
        </Link>

        {state === "checking" && <p role="status" className="mt-6 text-sm text-ink/65">{t.loading}</p>}

        {state === "invalid" && (
          <div className="mt-6 space-y-3">
            <h1 className="font-display text-2xl">{t.joinInvalidTitle}</h1>
            <p className="text-sm text-ink/70">
              {t.joinInvalidBody}
            </p>
          </div>
        )}

        {state === "done" && (
          <div className="mt-6 space-y-3">
            <h1 className="font-display text-2xl">{t.joinWelcome}</h1>
            <p className="text-sm text-ink/70">
              {t.joinReady}{" "}
              <Link href="/accountant" className="underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20">
                {t.joinGoToWorkspace}
              </Link>
              .
            </p>
          </div>
        )}

        {(state === "form" || state === "working") && (
          <div className="mt-6 space-y-4">
            <h1 className="font-display text-2xl">{t.joinTitle}</h1>
            <p className="text-sm text-ink/70">
              {name ? t.joinGreeting.replace("{name}", name) : ""}{t.joinIntroFirm}
            </p>
            <Field id="join-email" type="email" autoComplete="email" label={t.fldEmail} value={email} disabled readOnly />
            <Field
              id="join-password"
              type="password"
              autoComplete="new-password"
              label={t.authPassword}
              value={password}
              error={!!error}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.joinPwPlaceholder}
            />
            <Field
              id="join-confirm"
              type="password"
              autoComplete="new-password"
              label={t.rpConfirmPassword}
              value={confirm}
              error={!!error}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && <p id="form-error" role="alert" className="text-sm text-red-600">{error}</p>}
            <Button onClick={submit} disabled={state === "working"} className="w-full dark:!text-white">
              {state === "working" ? t.accAcceptCreating : t.joinSubmit}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function FirmJoinPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<main className="light-surface flex min-h-dvh items-center justify-center bg-paper px-6 py-12"><p role="status" className="text-sm text-ink/65">{t.loading}</p></main>}>
      <FirmJoinInner />
    </Suspense>
  );
}
