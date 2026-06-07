export const metadata = { title: "Underbiträden — Utlagg" };

const rows: [string, string, string][] = [
  ["Railway", "Drift & PostgreSQL-databas", "EU"],
  ["Cloudflare R2", "Lagring av kvittobilder", "EU"],
  ["Stripe", "Betalningar & prenumerationer", "EU/US (SCC)"],
  ["Resend", "Transaktionsmejl", "US (SCC)"],
  ["Upstash", "Redis & kö (rate limiting/OCR)", "EU"],
  ["Google Cloud Vision", "OCR av kvitton", "EU/US (SCC)"],
];

export default function SubprocessorsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">Underbiträden</h1>
      <p className="mt-4 text-ink/70">
        Tredjepartstjänster som kan behandla personuppgifter för Utlaggs räkning.
      </p>
      <table className="mt-8 w-full text-sm">
        <thead className="text-left text-ink/50">
          <tr><th className="py-2">Leverantör</th><th>Syfte</th><th>Region</th></tr>
        </thead>
        <tbody>
          {rows.map(([n, p, r]) => (
            <tr key={n} className="border-t border-ink/10">
              <td className="py-2 font-medium">{n}</td><td>{p}</td><td className="text-ink/60">{r}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-xs text-ink/50">
        Listan speglar de tjänster appen är byggd för att använda. Bekräfta faktiska
        leverantörer och teckna personuppgiftsbiträdesavtal (DPA) med var och en innan
        lansering. Detta är inte juridisk rådgivning.
      </p>
    </main>
  );
}
