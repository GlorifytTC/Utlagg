"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", companyName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      // Auto sign-in after registration.
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-semibold">
          Kvitto
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
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Har du redan konto?{" "}
          <Link href="/login" className="text-nordic-600 underline">Logga in</Link>
        </p>
      </div>
    </main>
  );
}
