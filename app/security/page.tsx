import { getT } from "@/lib/i18n-server";

export const metadata = { title: "Säkerhet — Kvittino" };

export default function SecurityPage() {
  const t = getT();
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">{t.secTitle}</h1>
      <p className="mt-4 text-ink/70">{t.secIntro}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg">{t.secEncTitle}</h2>
          <p>{t.secEncBody}</p>
        </section>
        <section>
          <h2 className="font-display text-lg">{t.secAuthTitle}</h2>
          <p>{t.secAuthBody}</p>
        </section>
        <section>
          <h2 className="font-display text-lg">{t.secStorageTitle}</h2>
          <p>{t.secStorageBody}</p>
        </section>
        <section>
          <h2 className="font-display text-lg">{t.secReportTitle}</h2>
          <p>{t.secReportBody}</p>
        </section>
        <p className="text-xs text-ink/50">{t.secDisclaimer}</p>
      </div>
    </main>
  );
}
