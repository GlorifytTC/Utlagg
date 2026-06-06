import Link from "next/link";
import { HeroSection } from "@/components/landing/HeroSection";
import { Pricing } from "@/components/landing/Pricing";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { StructuredData } from "@/components/StructuredData";

export default function HomePage() {
  return (
    <main className="bg-paper">
      <StructuredData />
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold">
          Utlagg 
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="#funktioner" className="hidden text-ink/70 hover:text-ink sm:block">
            Funktioner
          </Link>
          <Link href="#priser" className="hidden text-ink/70 hover:text-ink sm:block">
            Priser
          </Link>
          <Link href="/login" className="text-ink/70 hover:text-ink">
            Logga in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-ink px-4 py-2 text-paper hover:bg-nordic-900"
          >
            Starta gratis
          </Link>
        </nav>
      </header>

      <HeroSection />
      <Features />
      <Pricing />
      <Footer />
    </main>
  );
}
