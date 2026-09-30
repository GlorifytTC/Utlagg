import { Bug, Database, KeyRound, Lock } from "lucide-react";
import { getT } from "@/lib/i18n-server";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AmbientBackground } from "@/components/landing/AmbientBackground";

export const metadata = { title: "Säkerhet - Kvittino" };

export default function SecurityPage() {
  const t = getT();
  const sections = [
    { icon: Lock, title: t.secEncTitle, body: t.secEncBody },
    { icon: KeyRound, title: t.secAuthTitle, body: t.secAuthBody },
    { icon: Database, title: t.secStorageTitle, body: t.secStorageBody },
    { icon: Bug, title: t.secReportTitle, body: t.secReportBody },
  ];

  return (
    <div className="light-surface relative overflow-x-clip text-ink">
      <AmbientBackground />
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pb-32 md:pt-20">
        <h1 className="max-w-3xl font-display text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl break-words hyphens-auto">
          {t.secTitle}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/65">{t.secIntro}</p>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, body }) => (
            <section key={title} className="bezel">
              <div className="bezel-core h-full p-6 sm:p-8 md:p-10">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/[0.04] text-nordic-600 ring-1 ring-ink/5">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h2 className="mt-6 font-display text-xl font-semibold tracking-tight">{title}</h2>
                <p className="mt-3 text-base leading-relaxed text-ink/65">{body}</p>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-ink/50">{t.secDisclaimer}</p>
      </main>
      <Footer />
    </div>
  );
}
