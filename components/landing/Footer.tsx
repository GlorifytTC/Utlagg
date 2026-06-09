export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-8 border-t hairline pt-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-2xl">Kvitto</p>
          <p className="mt-2 max-w-sm text-sm text-ink/60">
            AI-driven kvittohantering byggd för svenska moms- och
            bokföringsregler.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-ink/70">
          <span className="rounded-full border hairline px-3 py-1">
            GDPR-säker
          </span>
          <span className="rounded-full border hairline px-3 py-1">
            7-årig revisionslogg
          </span>
          <span className="rounded-full border hairline px-3 py-1">
            BankID-redo
          </span>
        </div>
      </div>
      <p className="mt-8 text-xs text-ink/40">
        © {new Date().getFullYear()} GlorifyTC.
        <br />
        Detta är en startmall — verifiera moms- och bokföringsregler med din revisor innan produktion.
      </p>
    </footer>
  );
}
