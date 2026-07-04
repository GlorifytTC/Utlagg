export const metadata = { title: "Personuppgiftsbiträdesavtal — Kvittino" };

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <div className="mb-8 rounded-lg border border-amber/40 bg-amber/10 p-4 text-sm">
        <strong>Utkast – ej juridiskt granskat.</strong> Detta är en mall som måste
        granskas och färdigställas av jurist innan den publiceras eller används. Texten
        nedan är platshållare.
      </div>
      <h1 className="font-display text-3xl">Personuppgiftsbiträdesavtal</h1>
      <p className="mt-4 text-sm text-ink/60">Senast uppdaterad: [datum]</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink/80">
        <p>[Inledning och omfattning – beskriv tjänsten Kvittino och vem avtalet gäller.]</p>
        <p>[Parternas åtaganden, behandlade uppgifter, lagringstid (7 år enligt
        Bokföringslagen för bokföringsunderlag), rättslig grund (GDPR), och kontaktuppgifter
        till personuppgiftsansvarig.]</p>
        <p>[Underbiträden: se <a className="underline" href="/legal/subprocessors">listan över underbiträden</a>.]</p>
        <p>[Tvistlösning, tillämplig lag (svensk rätt), och ändringar av villkoren.]</p>
      </div>
      <p className="mt-8 text-xs text-ink/50">
        Kontakt: legal@utlagg.se · Org.nr [xxxxxx-xxxx]
      </p>
    </main>
  );
}
