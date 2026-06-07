"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BankIDLogin } from "@/components/auth/BankIDLogin";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) setError("Fel e-post eller lösenord");
    else router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-xl font-semibold">
          Utlagg 
        </Link>
        <h1 className="mt-8 font-display text-3xl">Logga in</h1>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
          />
          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full rounded-lg border hairline bg-white px-4 py-3 text-sm outline-none focus:border-nordic-600"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-nordic-900 disabled:opacity-60"
          >
            {loading ? "Loggar in…" : "Logga in"}
          </button>
          <BankIDLogin callbackUrl="/dashboard" />
        </div>
        <p className="mt-6 text-sm text-ink/60">
          Inget konto?{" "}
          <Link href="/register" className="text-nordic-600 underline">
            Skapa konto
          </Link>
        </p>
        <p className="mt-2 text-sm text-ink/60">
          <Link href="/forgot-password" className="text-nordic-600 underline">
            Glömt lösenord?
          </Link>
        </p>
      </div>
    </main>
  );
}
