"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", companyName: "", email: "", password: "" });
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
        setCooldown(60); // throttle client-side too; the API is rate-limited
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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Något gick fel");
        return;
      }
      // No auto sign-in: the account isn't active until the email link is
      // clicked, so we show a "check your inbox" screen instead.
      setEmailFailed(data.verificationEmailSent === false);
      setSentTo(form.email);
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
          <h1 className="mt-8 font-display text-3xl">Kolla din inkorg</h1>
          {emailFailed ? (
            <>
              <p className="mt-4 text-sm text-red-600">
                Ditt konto skapades, men vi kunde tyvärr inte skicka bekräftelsemejlet
                till <strong>{sentTo}</strong> just nu. Det är ett tillfälligt problem
                med e-postutskick på vår sida — inte med din adress.
              </p>
              <p className="mt-4 text-sm text-ink/70">
                Du kan skicka mejlet igen här nedan, eller kontakta{" "}
                <a href="mailto:support@utlagg.se" className="text-nordic-600 underline">
                  support@utlagg.se
                </a>{" "}
                om det inte fungerar.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink/70">
              Vi har skickat en bekräftelselänk till <strong>{sentTo}</strong>. Klicka på
              länken i mejlet för att aktivera kontot och komma till din instrumentpanel.
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
                ? "Skickar…"
                : cooldown > 0
                  ? `Skicka igen om ${cooldown}s`
                  : "Skicka mejlet igen"}
            </button>
            {resendState === "sent" && cooldown > 0 && (
              <p className="mt-2 text-sm text-green-700">
                Skickat! Kolla inkorgen (och skräpposten) för <strong>{sentTo}</strong>.
              </p>
            )}
            {resendState === "error" && (
              <p className="mt-2 text-sm text-red-600">
                Kunde inte skicka just nu. Vänta en stund och försök igen.
              </p>
            )}
          </div>
          <p className="mt-6 text-sm text-ink/60">
            Inget mejl efter några minuter? Kolla skräpposten, eller{" "}
            <Link href="/login" className="text-nordic-600 underline">
              logga in
            </Link>{" "}
            när du har klickat på länken.
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
        <h1 className="mt-8 font-display text-3xl">Skapa konto</h1>
        <p className="mt-2 text-sm text-ink/60">25 skanningar/mån gratis.</p>
        <div className="mt-6 space-y-4">
          <input placeholder="Namn" value={form.name} onChange={update("name")}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600" />
          <input placeholder="Företag (valfritt)" value={form.companyName} onChange={update("companyName")}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600" />
          <input type="email" placeholder="E-post" value={form.email} onChange={update("email")}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600" />
          <input type="password" placeholder="Lösenord (min 8 tecken)" value={form.password} onChange={update("password")}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-nordic-900 disabled:opacity-60">
            {loading ? "Skapar konto…" : "Skapa konto"}
          </button>
          <div className="flex items-center gap-3 text-xs text-ink/40">
            <span className="h-px flex-1 bg-ink/10" /> eller <span className="h-px flex-1 bg-ink/10" />
          </div>
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Har du redan konto?{" "}
          <Link href="/login" className="text-nordic-600 underline">Logga in</Link>
        </p>
      </div>
    </main>
  );
}
