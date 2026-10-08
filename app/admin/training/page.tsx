import { getTrainingStats, type FieldAccuracy } from "@/lib/admin-training";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatGrid } from "@/components/ui/stat";

export const metadata = { title: "Admin · Modellträning" };
export const dynamic = "force-dynamic";

// Internal admin tool: Swedish-only by design, strings are inline (no i18n).

const FIELD_LABEL: Record<FieldAccuracy["field"], string> = {
  vendor: "Leverantör",
  orgNumber: "Org.nummer",
  date: "Datum",
  total: "Totalbelopp",
  vat: "Momsbelopp",
  vatRate: "Momssats",
};

const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)} %` : "-");
const int = (v: number) => v.toLocaleString("sv-SE");

function Bar({ value, max, tone = "default" }: { value: number; max: number; tone?: "default" | "warn" }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-900/[0.06] dark:bg-white/[0.08]">
      <div
        className={tone === "warn" ? "h-full rounded-full bg-amber-500" : "h-full rounded-full bg-nordic-600"}
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

export default async function AdminTraining() {
  const s = await getTrainingStats();
  const accuracy = s.labeled > 0 ? (s.labeled - s.corrected) / s.labeled : null;
  const maxDaily = Math.max(1, ...s.daily.map((d) => d.scans));
  const maxVendor = Math.max(1, ...s.vendorCorrections.top.map((v) => v.times));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modellträning"
        subtitle="Träningsdata som samlas in när kvitton skannas: vad AI:n läste och vad användaren bekräftade."
      />

      {s.notMigrated && (
        <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">Träningstabellerna finns inte i databasen ännu.</p>
          <p className="mt-1">
            Ingen träningsdata kan sparas förrän migreringen <code>0029_training_tables.sql</code> körts mot
            produktionsdatabasen, till exempel med <code>npm run db:migrate</code>.
          </p>
        </div>
      )}

      <StatGrid
        items={[
          { label: "Insamlade skanningar", value: int(s.total), hint: `${int(s.last7Days)} senaste 7 dagarna` },
          { label: "Märkta exempel", value: int(s.labeled), hint: `${pct(s.labeled, s.total)} bekräftade av användare` },
          {
            label: "AI-träffsäkerhet",
            value: accuracy == null ? "-" : `${(accuracy * 100).toFixed(1)} %`,
            hint: "Märkta kvitton utan rättelse",
          },
          {
            label: "AI-misstag",
            value: int(s.corrected),
            hint: "Rättade av användare, mest värdefulla exemplen",
            tone: s.corrected > 0 ? "warn" : "default",
          },
        ]}
      />
      <StatGrid
        items={[
          { label: "Senaste 30 dagarna", value: int(s.last30Days) },
          { label: "Omärkta", value: int(s.unlabeled), hint: "AI läste men användaren sparade inte" },
          { label: "Med bild sparad", value: int(s.withImage), hint: pct(s.withImage, s.total) },
          {
            label: "Insamling sedan",
            value: s.firstAt ? formatDate(new Date(s.firstAt)) : "-",
            hint: s.lastAt ? `Senast ${formatDate(new Date(s.lastAt))}` : undefined,
          },
        ]}
      />

      <section className="panel space-y-4 rounded-2xl p-5">
        <div>
          <h2 className="font-medium">Träffsäkerhet per fält</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI:ns råa svar jämfört med det användaren bekräftade, bara där fältet bekräftats.
          </p>
        </div>
        <ul className="space-y-3">
          {s.fields.map((f) => {
            const ratio = f.checked > 0 ? f.correct / f.checked : 0;
            return (
              <li key={f.field} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[9rem_1fr_9rem]">
                <span>{FIELD_LABEL[f.field]}</span>
                <Bar value={f.correct} max={f.checked} tone={f.checked > 0 && ratio < 0.8 ? "warn" : "default"} />
                <span className="text-right tabular-nums text-gray-500 dark:text-gray-400">
                  {pct(f.correct, f.checked)}
                  <span className="hidden sm:inline"> ({int(f.correct)}/{int(f.checked)})</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

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
                <span className="capitalize">{src.source}</span>
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
            Rättade leverantörsnamn som delas mellan alla användare via org.nummer.
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
          <h2 className="font-medium">Senaste AI-misstag</h2>
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
                  const diff = (a: string | null, b: string | null) => (a ?? "-") !== (b ?? "-");
                  const cell = (a: string | null, b: string | null) =>
                    diff(a, b) ? (
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
