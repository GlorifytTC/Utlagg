import Link from "next/link";

export const metadata = { title: "Underbiträden — Kvittino" };

const rows: [string, string, string, string][] = [
  ["Railway", "Drift & PostgreSQL-databas", "EU", "—"],
  ["Cloudflare R2", "Lagring av kvittobilder", "EU", "—"],
  ["Stripe", "Betalningar & prenumerationer", "EU/US", "SCC / DPF"],
  ["Resend", "Transaktionsmejl", "US", "SCC / DPF"],
  ["Upstash", "Redis & kö (rate limiting/OCR)", "EU", "—"],
  ["Google Cloud Vision", "OCR av kvitton", "EU", "— (EU-region)"],
];

export default function SubprocessorsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">Underbiträden</h1>
      <p className="mt-4 text-ink/70">
        Tredjepartstjänster som kan behandla personuppgifter för Kvittinos räkning.
        Denna lista utgör Bilaga B till vårt{" "}
        <Link className="underline underline-offset-2" href="/legal/dpa">
          personuppgiftsbiträdesavtal
        </Link>
        .
      </p>
      <p className="mt-2 text-sm text-ink/50">Senast uppdaterad: 18 juli 2026</p>

      <table className="mt-8 w-full text-sm">
        <thead className="text-left text-ink/50">
          <tr>
            <th className="py-2">Leverantör</th>
            <th>Syfte</th>
            <th>Region</th>
            <th>Skyddsåtgärd vid tredjelandsöverföring</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([n, p, r, s]) => (
            <tr key={n} className="border-t border-ink/10 align-top">
              <td className="py-2 font-medium">{n}</td>
              <td>{p}</td>
              <td className="text-ink/60">{r}</td>
              <td className="text-ink/60">{s}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-sm text-ink/70">
        Vi underrättar företagskunder minst trettio (30) dagar innan vi lägger till
        eller byter ut ett underbiträde, i enlighet med DPA:ts punkt 5. Vill du få
        sådana underrättelser, kontakta{" "}
        <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
          legal@kvittino.se
        </a>
        .
      </p>
    </main>
  );
}
