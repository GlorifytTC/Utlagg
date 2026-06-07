export const metadata = { title: "Säkerhet — Utlagg" };

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">Säkerhet</h1>
      <p className="mt-4 text-ink/70">Så skyddar vi dina data i Utlagg.</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-display text-lg">Kryptering</h2>
          <p>All trafik sker över TLS (HTTPS). Lösenord lagras hashade med bcrypt. Känsliga
          värden kan krypteras i vila med AES-256-GCM.</p>
        </section>
        <section>
          <h2 className="font-display text-lg">Åtkomst & autentisering</h2>
          <p>Inloggning via e-post/lösenord eller BankID. Säkerhetsrubriker (CSP, HSTS,
          X-Frame-Options m.fl.) sätts på alla svar. Känsliga åtgärder loggas i en
          revisionslogg som bevaras i sju år.</p>
        </section>
        <section>
          <h2 className="font-display text-lg">Kvittolagring & integritet</h2>
          <p>Kvittobilder lagras i privat objektlagring och nås via tidsbegränsade
          signerade länkar. Varje bild får en SHA-256-summa vid uppladdning för att kunna
          upptäcka förändring (i linje med Bokföringslagens krav på oföränderlig digital
          kopia).</p>
        </section>
        <section>
          <h2 className="font-display text-lg">Rapportera sårbarhet</h2>
          <p>Hittar du ett säkerhetsproblem? Hör av dig till security@utlagg.se.</p>
        </section>
        <p className="text-xs text-ink/50">
          Detta beskriver nuvarande tekniska rutiner och är inte en certifiering. Formella
          ramverk (t.ex. ISO 27001) kräver separat granskning.
        </p>
      </div>
    </main>
  );
}
