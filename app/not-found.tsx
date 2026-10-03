import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getServerLang } from "@/lib/i18n-server";

export const metadata = { title: "404" };

export default function NotFound() {
  const sv = getServerLang() === "sv";
  return (
    <div className="light-surface relative min-h-screen overflow-x-clip bg-paper">
      <Navbar />
      <main className="mx-auto max-w-xl px-6 py-32 text-center">
        <p className="text-sm font-medium text-nordic-600">404</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
          {sv ? "Sidan hittades inte" : "Page not found"}
        </h1>
        <p className="mt-4 text-ink/65">
          {sv ? "Sidan finns inte eller har flyttats." : "This page doesn't exist or has moved."}
        </p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-nordic-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-nordic-700">
          {sv ? "Till startsidan" : "Back to home"}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
