"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
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
        <h1 className="mt-8 font-display text-3xl">Glömt lösenord</h1>
        {sent ? (
          <p className="mt-6 text-sm text-ink/70">
            Om e-postadressen finns hos oss har vi skickat en återställningslänk.
            Kontrollera din inkorg.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-ink/70">
              Ange din e-postadress så skickar vi en länk för att återställa lösenordet.
            </p>
            <input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
            />
            <button
              onClick={submit}
              disabled={loading || !email}
              className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-nordic-900 disabled:opacity-60"
            >
              {loading ? "Skickar…" : "Skicka återställningslänk"}
            </button>
          </div>
        )}
        <p className="mt-6 text-sm text-ink/60">
          <Link href="/login" className="underline">
            Tillbaka till inloggning
          </Link>
        </p>
      </div>
    </main>
  );
}
