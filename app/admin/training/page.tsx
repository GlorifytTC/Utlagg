import {
  getTrainingStats,
  MIN_HEAD_TO_HEAD,
  type EngineStats,
  type Field,
  type TrainingStats,
} from "@/lib/admin-training";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatGrid } from "@/components/ui/stat";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Admin · Modellträning" };
export const dynamic = "force-dynamic";

// Internal admin tool: Swedish-only by design, strings are inline (no i18n).

const FIELD_LABEL: Record<Field, string> = {
  vendor: "Leverantör",
  orgNumber: "Org.nummer",
  date: "Datum",
  total: "Totalbelopp",
  vat: "Momsbelopp",
  vatRate: "Momssats",
};

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : null);
const pctOf = (r: number | null) => (r == null ? "-" : `${(r * 100).toFixed(1)} %`);
const pct = (part: number, whole: number) => pctOf(ratio(part, whole));
const int = (v: number) => v.toLocaleString("sv-SE");

function Bar({ value, max, tone = "nordic" }: { value: number; max: number; tone?: "nordic" | "amber" | "gray" }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const color = tone === "amber" ? "bg-amber-500" : tone === "gray" ? "bg-gray-400 dark:bg-gray-500" : "bg-nordic-600";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-900/[0.06] dark:bg-white/[0.08]">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}

function Readiness({ s }: { s: TrainingStats }) {
  const r = s.readiness;
  const h = s.headToHead;
  const gem = ratio(h.gemini.fullCorrect, h.n);
  const own = ratio(h.own.fullCorrect, h.n);

  let tone = "border-gray-900/[0.08] bg-white/70 dark:border-white/[0.08] dark:bg-white/[0.03]";
  let title = "";
  let body: React.ReactNode = null;

  if (r.state === "collecting") {
    title = `Samlar jämförbara kvitton: ${int(r.n)} av ${int(r.needed)}`;
    body = (
      <>
        <div className="mt-3"><Bar value={r.n} max={r.needed} /></div>
        <p className="mt-3">
          Varje skannat kvitto läses nu av både Gemini och din egen modell, och båda jämförs mot det användaren
          bekräftar. Ett omdöme ges först efter {int(MIN_HEAD_TO_HEAD)} kvitton där båda har läst och användaren
          sparat, så att en slump inte avgör.
          {h.n > 0 && ` Hittills: din modell ${pctOf(own)}, Gemini ${pctOf(gem)} helt rätt.`}
        </p>
      </>
    );
  } else if (r.state === "replace") {
    tone = "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200";
    title = "Din modell är lika bra som Gemini";
    body = (
      <p className="mt-2">
        På {int(h.n)} jämförbara kvitton fick din modell {pctOf(own)} helt rätt mot Geminis {pctOf(gem)}. Du kan stänga av
        Gemini. Fortsätt följa siffrorna efteråt.
      </p>
    );
  } else if (r.state === "hybrid") {
    tone = "border-nordic-600/30 bg-nordic-50/70 dark:border-nordic-400/30 dark:bg-nordic-950/30";
    const saved = Math.round(r.skipShare * s.geminiCalls30d);
    title = `Hybrid lönar sig redan: hoppa över Gemini på ${pctOf(r.skipShare)} av kvittona`;
    body = (
      <p className="mt-2">
        Använd din modell när dess säkerhet är minst {r.threshold} %, och Gemini annars. Då blir träffsäkerheten{" "}
        {pctOf(r.blendedAccuracy)} (Gemini ensam: {pctOf(gem)}). Med senaste 30 dagarnas volym motsvarar det cirka{" "}
        {int(saved)} färre Gemini-anrop per månad.
      </p>
    );
  } else {
    tone = "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200";
    title = "Inte redo att ersätta Gemini än";
    body = (
      <p className="mt-2">
        Din modell: {pctOf(own)} helt rätt. Gemini: {pctOf(gem)}. Ingen säkerhetsgräns ger lika bra resultat ännu. Se
        tabellerna nedan för vilka fält som drar ner.
      </p>
    );
  }

  return (
    <section className={`rounded-2xl border p-5 text-sm ${tone}`}>
      <h2 className="text-base font-semibold">{title}</h2>
      {body}
    </section>
  );
}

function CompareTable({ n, gemini, own }: { n: number; gemini: EngineStats; own: EngineStats }) {
  const rows: { key: string; label: string; g: [number, number]; o: [number, number]; note?: string }[] = [
    { key: "full", label: "Hela kvittot rätt", g: [gemini.fullCorrect, gemini.n], o: [own.fullCorrect, own.n] },
    ...gemini.fields.map((gf, i) => {
      const of = own.fields[i];
      return {
        key: gf.field,
        label: FIELD_LABEL[gf.field],
        g: [gf.correct, gf.checked] as [number, number],
        o: [of.correct, of.checked] as [number, number],
        note: gf.field === "orgNumber" && gf.checked === 0 ? "Bekräftas inte, finns inte i formuläret" : undefined,
      };
    }),
  ];
  return (
    <section className="panel overflow-hidden rounded-2xl">
      <div className="p-5 pb-3">
        <h2 className="font-medium">Gemini mot din modell, på samma kvitton ({int(n)})</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bara kvitton som båda har läst och användaren har sparat, så jämförelsen blir rättvis.
        </p>
      </div>
      {n === 0 ? (
        <p className="px-5 pb-5 text-sm text-gray-500 dark:text-gray-400">
          Inga jämförbara kvitton ännu. Nya skanningar läses av båda från och med nu.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-2">Fält</th>
                <th className="px-5 py-2">Gemini</th>
                <th className="px-5 py-2">Din modell</th>
                <th className="px-5 py-2 text-right">Skillnad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((r) => {
                const g = ratio(r.g[0], r.g[1]);
                const o = ratio(r.o[0], r.o[1]);
                const diff = g != null && o != null ? (o - g) * 100 : null;
                return (
                  <tr key={r.key} className={r.key === "full" ? "font-medium" : undefined}>
                    <td className="px-5 py-2.5">
                      {r.label}
                      {r.note && <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">{r.note}</span>}
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-24"><Bar value={r.g[0]} max={r.g[1]} tone="gray" /></div>
                        <span className="tabular-nums">{pctOf(g)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-24"><Bar value={r.o[0]} max={r.o[1]} tone={o != null && g != null && o < g ? "amber" : "nordic"} /></div>
                        <span className="tabular-nums">{pctOf(o)}</span>
                      </div>
                    </td>
                    <td
                      className={`px-5 py-2.5 text-right tabular-nums ${
                        diff == null ? "text-gray-400" : diff < 0 ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {diff == null ? "-" : `${diff > 0 ? "+" : ""}${diff.toFixed(1)} p`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function HybridTable({ s }: { s: TrainingStats }) {
  const n = s.headToHead.n;
  const gem = ratio(s.headToHead.gemini.fullCorrect, n);
  return (
    <section className="panel overflow-hidden rounded-2xl">
      <div className="p-5 pb-3">
        <h2 className="font-medium">Hybrid: din modell när den är säker, Gemini annars</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Så här mycket Gemini du kan spara vid olika säkerhetsgränser, och vad det kostar i träffsäkerhet. Gemini ensam:{" "}
          {pctOf(gem)} helt rätt.
        </p>
      </div>
      {n === 0 ? (
        <p className="px-5 pb-5 text-sm text-gray-500 dark:text-gray-400">Visas när det finns jämförbara kvitton.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-2">Säkerhet minst</th>
                <th className="px-5 py-2">Utan Gemini</th>
                <th className="px-5 py-2">Din modell rätt där</th>
                <th className="px-5 py-2 text-right">Total träffsäkerhet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {s.hybrid.map((h) => {
                const blended = ratio(h.blendedCorrect, n);
                const worse = blended != null && gem != null && blended < gem - 0.01;
                return (
                  <tr key={h.threshold}>
                    <td className="px-5 py-2.5 tabular-nums">{h.threshold} %</td>
                    <td className="px-5 py-2.5 tabular-nums">
                      {pct(h.ownUsed, n)} <span className="text-gray-500 dark:text-gray-400">({int(h.ownUsed)})</span>
                    </td>
                    <td className="px-5 py-2.5 tabular-nums">{pct(h.ownCorrect, h.ownUsed)}</td>
                    <td className={`px-5 py-2.5 text-right tabular-nums ${worse ? "text-amber-700 dark:text-amber-400" : ""}`}>
                      {pctOf(blended)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminTraining() {
  const s = await getTrainingStats();
  const maxDaily = Math.max(1, ...s.daily.map((d) => d.scans));
  const maxVendor = Math.max(1, ...s.vendorCorrections.top.map((v) => v.times));
  const gemAll = ratio(s.engines.gemini.fullCorrect, s.engines.gemini.n);
  const ownAll = ratio(s.engines.own.fullCorrect, s.engines.own.n);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modellträning"
        subtitle="Varje skannat kvitto tränar din modell. Här ser du hur nära Gemini den är, fält för fält."
        actions={
          <div className="flex flex-wrap gap-2">
            <a href="/api/admin/training/export" className={buttonClass("outline")}>Exportera dataset</a>
            <a href="/api/admin/training/export?images=1" className={buttonClass("outline")}>Med bilder</a>
          </div>
        }
      />

      {s.notMigrated && (
        <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">Databasen saknar träningstabellerna eller kolumnerna för din modell.</p>
          <p className="mt-1">
            Kör migreringarna <code>0029_training_tables.sql</code> och <code>0030_own_model_shadow.sql</code> mot
            produktionsdatabasen, till exempel med <code>npm run db:migrate</code>.
          </p>
        </div>
      )}

      <Readiness s={s} />

      <StatGrid
        items={[
          { label: "Insamlade kvitton", value: int(s.total), hint: `${int(s.last7Days)} senaste 7 dagarna` },
          { label: "Märkta exempel", value: int(s.labeled), hint: `${pct(s.labeled, s.total)} bekräftade av användare` },
          { label: "Gemini helt rätt", value: pctOf(gemAll), hint: `${int(s.engines.gemini.n)} märkta kvitton` },
          {
            label: "Din modell helt rätt",
            value: pctOf(ownAll),
            hint: `${int(s.engines.own.n)} märkta kvitton`,
            tone: ownAll != null && gemAll != null && ownAll < gemAll ? "warn" : "default",
          },
        ]}
      />
      <StatGrid
        items={[
          { label: "Gemini-anrop, 30 dagar", value: int(s.geminiCalls30d), hint: "Det du betalar för" },
          {
            label: "Din modell har läst",
            value: pct(s.ownCoverage.withOwn, s.ownCoverage.labeled),
            hint: "av de märkta kvittona",
          },
          { label: "Bara din modell", value: int(s.ownOnly), hint: "Gemini var inte tillgänglig" },
          { label: "Rättade av användare", value: int(s.corrected), hint: "Mest värdefulla exemplen" },
        ]}
      />

      <CompareTable n={s.headToHead.n} gemini={s.headToHead.gemini} own={s.headToHead.own} />
      <HybridTable s={s} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel space-y-4 rounded-2xl p-5">
          <h2 className="font-medium">Senaste 14 dagarna</h2>
          {s.daily.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Inga skanningar de senaste 14 dagarna.</p>
          ) : (
            <ul className="space-y-2">
              {s.daily.map((d) => (
                <li key={d.day} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-3 text-sm">
                  <span className="tabular-nums text-gray-500 dark:text-gray-400">{d.day.slice(5)}</span>
                  <Bar value={d.scans} max={maxDaily} />
                  <span className="text-right tabular-nums">
                    {int(d.scans)}
                    {d.corrected > 0 && <span className="text-amber-600 dark:text-amber-400"> · {d.corrected}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">Skanningar per dag, rättelser i orange.</p>
        </section>

        <section className="panel space-y-4 rounded-2xl p-5">
          <h2 className="font-medium">Datakällor</h2>
          <ul className="space-y-2 text-sm">
            {s.sources.length === 0 && <li className="text-gray-500 dark:text-gray-400">Ingen data ännu.</li>}
            {s.sources.map((src) => (
              <li key={src.source} className="flex items-center justify-between">
                <span>{src.source === "local" ? "Din modell (utan Gemini)" : src.source === "gemini" ? "Gemini" : src.source}</span>
                <span className="tabular-nums text-gray-500 dark:text-gray-400">
                  {int(src.count)} ({pct(src.count, s.total)})
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-900/[0.06] pt-4 dark:border-white/[0.07]">
            <h3 className="text-sm font-medium">Manuella annoteringar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{int(s.ocrSamples.total)} markerade fält</p>
            {s.ocrSamples.byField.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                {s.ocrSamples.byField.map((f) => (
                  <li key={f.field} className="rounded-full bg-gray-900/[0.05] px-2.5 py-1 dark:bg-white/[0.07]">
                    {f.field}: {int(f.count)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="panel space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="font-medium">Inlärda leverantörer ({int(s.vendorCorrections.total)})</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rättade leverantörsnamn som din modell använder direkt, delade mellan alla användare via org.nummer.
          </p>
        </div>
        {s.vendorCorrections.top.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Inga inlärda leverantörer ännu.</p>
        ) : (
          <ul className="space-y-2">
            {s.vendorCorrections.top.map((v) => (
              <li key={`${v.vendor}-${v.orgNumber ?? ""}`} className="grid grid-cols-[1fr_6rem_3rem] items-center gap-3 text-sm sm:grid-cols-[1fr_9rem_8rem_3rem]">
                <span className="truncate">{v.vendor}</span>
                <span className="hidden tabular-nums text-gray-500 dark:text-gray-400 sm:inline">{v.orgNumber ?? "-"}</span>
                <Bar value={v.times} max={maxVendor} />
                <span className="text-right tabular-nums">{int(v.times)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel overflow-hidden rounded-2xl">
        <div className="p-5 pb-3">
          <h2 className="font-medium">Senaste rättelser</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Vad AI:n läste och vad användaren rättade till. Inga bilder visas.</p>
        </div>
        {s.recentMistakes.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-gray-500 dark:text-gray-400">Inga rättelser ännu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-2">Datum</th>
                  <th className="px-5 py-2">Leverantör (AI → rätt)</th>
                  <th className="px-5 py-2">Belopp (AI → rätt)</th>
                  <th className="px-5 py-2">Kvittodatum (AI → rätt)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {s.recentMistakes.map((m) => {
                  const cell = (a: string | null, b: string | null) =>
                    (a ?? "-") !== (b ?? "-") ? (
                      <>
                        <span className="text-gray-400 line-through">{a ?? "-"}</span> → <span>{b ?? "-"}</span>
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">{b ?? "-"}</span>
                    );
                  const totalA = m.aiTotal != null ? Number(m.aiTotal).toFixed(2) : null;
                  const totalB = m.total != null ? Number(m.total).toFixed(2) : null;
                  return (
                    <tr key={m.id}>
                      <td className="px-5 py-2.5 tabular-nums text-gray-500 dark:text-gray-400">{formatDate(new Date(m.createdAt))}</td>
                      <td className="px-5 py-2.5">{cell(m.aiVendor, m.vendor)}</td>
                      <td className="px-5 py-2.5 tabular-nums">{cell(totalA, totalB)}</td>
                      <td className="px-5 py-2.5 tabular-nums">{cell(m.aiDate, m.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
