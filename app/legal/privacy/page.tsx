"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLanguage();

  const tableRows = [
    [t.priv3R1P, t.priv3R1B],
    [t.priv3R2P, t.priv3R2B],
    [t.priv3R3P, t.priv3R3B],
    [t.priv3R4P, t.priv3R4B],
    [t.priv3R5P, t.priv3R5B],
    [t.priv3R6P, t.priv3R6B],
    [t.priv3R7P, t.priv3R7B],
    [t.priv3R8P, t.priv3R8B],
    [t.priv3R9P, t.priv3R9B],
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">{t.privTitle}</h1>
      <p className="mt-4 text-ink/70">{t.privIntro}</p>
      <p className="mt-2 text-sm text-ink/50">{t.privUpdated}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv1Title}</h2>
          <p>
            <strong>GlorifyTC</strong> {t.priv1P1}
          </p>
          <p>
            {t.priv1ContactLabel}{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>
          </p>
          <p className="text-ink/60">
            {t.priv1P3}{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              {t.priv1DpaLink}
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv2Title}</h2>

          <p className="font-medium text-ink/90">{t.priv2AccountLabel}</p>
          <p className="text-ink/80">{t.priv2AccountDesc}</p>

          <p className="font-medium text-ink/90">{t.priv2CompanyLabel}</p>
          <p className="text-ink/80">{t.priv2CompanyDesc}</p>

          <p className="font-medium text-ink/90">{t.priv2BookLabel}</p>
          <p className="text-ink/80">{t.priv2BookDesc}</p>

          <p className="font-medium text-ink/90">{t.priv2MileageLabel}</p>
          <p className="text-ink/80">{t.priv2MileageDesc}</p>

          <p className="font-medium text-ink/90">{t.priv2InvoiceLabel}</p>
          <p className="text-ink/80">{t.priv2InvoiceDesc}</p>

          <p className="font-medium text-ink/90">{t.priv2PaymentLabel}</p>
          <p className="text-ink/80">{t.priv2PaymentDesc}</p>

          <p className="font-medium text-ink/90">{t.priv2SupportLabel}</p>
          <p className="text-ink/80">{t.priv2SupportDesc}</p>

          <p className="font-medium text-ink/90">{t.priv2LogsLabel}</p>
          <p className="text-ink/80">{t.priv2LogsDesc}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv3Title}</h2>

          <div className="rounded-xl border border-ink/10 divide-y divide-ink/10 overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr] gap-4 p-4 text-xs font-medium text-ink/50 uppercase tracking-wide">
              <span>{t.priv3Col1}</span>
              <span>{t.priv3Col2}</span>
            </div>
            {tableRows.map(([purpose, basis]) => (
              <div key={purpose} className="grid grid-cols-[1fr_1fr] gap-4 p-4 text-ink/80">
                <span>{purpose}</span>
                <span className="text-ink/60">{basis}</span>
              </div>
            ))}
          </div>

          <p className="text-ink/80">
            {t.priv3P1Pre}{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              {t.priv3DpaLink}
            </Link>
            {t.priv3P1Post}
          </p>

          <p className="text-ink/60">{t.priv3P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv4Title}</h2>
          <p>{t.priv4Intro}</p>

          <p className="font-medium text-ink/90">{t.priv4OwnLabel}</p>
          <ul className="ml-4 list-disc space-y-2 text-ink/80">
            <li>
              <strong>{t.priv4Li1Strong}</strong> {t.priv4Li1Rest}
            </li>
          </ul>

          <p className="font-medium text-ink/90">{t.priv4OurLabel}</p>
          <ul className="ml-4 list-disc space-y-2 text-ink/80">
            <li><strong>{t.priv4Li2Strong}</strong> {t.priv4Li2Rest}</li>
            <li><strong>{t.priv4Li3Strong}</strong> {t.priv4Li3Rest}</li>
            <li><strong>{t.priv4Li4Strong}</strong> {t.priv4Li4Rest}</li>
            <li><strong>{t.priv4Li5Strong}</strong> {t.priv4Li5Rest}</li>
            <li><strong>{t.priv4Li6Strong}</strong> {t.priv4Li6Rest}</li>
            <li><strong>{t.priv4Li7Strong}</strong> {t.priv4Li7Rest}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv5Title}</h2>
          <p>
            {t.priv5P1Pre}{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            {t.priv5P1Post}
          </p>
          <ul className="ml-4 list-disc space-y-1 text-ink/80">
            <li>{t.priv5Li1}</li>
            <li>{t.priv5Li2}</li>
            <li>{t.priv5Li3}</li>
            <li>{t.priv5Li4}</li>
            <li>{t.priv5Li5}</li>
          </ul>
          <p>{t.priv5P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv6Title}</h2>
          <p>{t.priv6P1}</p>
          <p>
            {t.priv6P2Pre}{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv7Title}</h2>
          <p>
            {t.priv7P1Pre}{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>{" "}
            {t.priv7P1Post}
          </p>
          <ul className="ml-4 list-disc space-y-2 text-ink/80">
            <li><strong>{t.priv7Li1Strong}</strong> {t.priv7Li1Rest}</li>
            <li><strong>{t.priv7Li2Strong}</strong> {t.priv7Li2Rest}</li>
            <li><strong>{t.priv7Li3Strong}</strong> {t.priv7Li3Rest}</li>
            <li><strong>{t.priv7Li4Strong}</strong> {t.priv7Li4Rest}</li>
            <li><strong>{t.priv7Li5Strong}</strong> {t.priv7Li5Rest}</li>
            <li><strong>{t.priv7Li6Strong}</strong> {t.priv7Li6Rest}</li>
            <li><strong>{t.priv7Li7Strong}</strong> {t.priv7Li7Rest}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv8Title}</h2>
          <p>
            {t.priv8P1Pre}{" "}
            <strong>{t.priv8ImyStrong}</strong>:
          </p>
          <p className="text-ink/70">
            IMY · Box 8114 · 104 20 Stockholm ·{" "}
            <a
              className="underline underline-offset-2"
              href="https://www.imy.se"
              target="_blank"
              rel="noopener noreferrer"
            >
              imy.se
            </a>
          </p>
          <p>{t.priv8P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv9Title}</h2>
          <p>{t.priv9P1}</p>
          <p>{t.priv9P2}</p>
          <p>
            {t.priv9MoreInfo}{" "}
            <Link className="underline underline-offset-2" href="/security">
              /security
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv10Title}</h2>
          <p>{t.priv10P1}</p>
          <p>{t.priv10P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv11Title}</h2>
          <p>{t.priv11P1}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv12Title}</h2>
          <p>{t.priv12P1}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.priv13Title}</h2>
          <p>
            {t.priv13P1Pre}{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>
          </p>
          <p>
            {t.priv13P2Pre}{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              {t.priv13DpaLink}
            </Link>
            ,{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              {t.priv13SubprocessorsLink}
            </Link>{" "}
            {t.priv13And}{" "}
            <Link className="underline underline-offset-2" href="/legal/terms">
              {t.priv13TermsLink}
            </Link>
            .
          </p>
        </section>

      </div>

      <p className="mt-10 text-xs text-ink/50">{t.privFooter}</p>
    </main>
  );
}
