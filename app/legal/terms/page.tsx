"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">{t.termsTitle}</h1>
      <p className="mt-4 text-ink/70">{t.termsIntro}</p>
      <p className="mt-2 text-sm text-ink/50">{t.termsUpdated}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms1Title}</h2>
          <p>
            <strong>GlorifyTC</strong> {t.terms1P1}
          </p>
          <p>{t.terms1P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms2Title}</h2>
          <p>{t.terms2P1}</p>
          <p>{t.terms2P2}</p>
          <p>{t.terms2P3}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms3Title}</h2>
          <p>{t.terms3P1}</p>
          <p>{t.terms3P2}</p>
          <p>{t.terms3P3}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms4Title}</h2>
          <p>{t.terms4P1}</p>
          <p>{t.terms4P2}</p>
          <p>{t.terms4P3}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms5Title}</h2>
          <p>
            {t.terms5P1Pre}{" "}
            <strong>Stripe, Inc.</strong>{" "}
            {t.terms5P1Post}
          </p>
          <p>{t.terms5P2}</p>
          <p>{t.terms5P3}</p>
          <p>{t.terms5P4}</p>
          <p>
            <strong>{t.terms5P5Strong}</strong> {t.terms5P5Rest}
          </p>
          <p>
            <strong>{t.terms5P6Strong}</strong> {t.terms5P6Rest}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms6Title}</h2>
          <p>
            {t.terms6P1}
          </p>
          <p>{t.terms6P2}</p>
          <p>
            {t.terms6P3Pre}{" "}
            <Link className="underline underline-offset-2" href="/legal/angerblankett">
              {t.terms6AngerLink}
            </Link>
            {t.terms6P3Mid}{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>{" "}
            {t.terms6P3Post}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms7Title}</h2>
          <p>{t.terms7P1}</p>
          <p>{t.terms7P2}</p>
          <p>{t.terms7P3}</p>
          <p>{t.terms7P4}</p>
          <p>{t.terms7P5}</p>
          <p>{t.terms7P6}</p>
          <p>
            <strong>{t.terms7P7Strong}</strong> {t.terms7P7Rest}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms8Title}</h2>
          <p>{t.terms8P1}</p>
          <p>
            {t.terms8P2Pre}{" "}
            <Link className="underline underline-offset-2" href="/legal/privacy">
              {t.terms8PrivacyLink}
            </Link>{" "}
            {t.terms8P2Post}
          </p>
          <p>{t.terms8P3}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms9Title}</h2>
          <p>{t.terms9P1}</p>
          <p>{t.terms9P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms10Title}</h2>
          <p>{t.terms10Intro}</p>
          <ul className="ml-4 list-disc space-y-1 text-ink/80">
            <li>{t.terms10Li1}</li>
            <li>{t.terms10Li2}</li>
            <li>{t.terms10Li3}</li>
            <li>{t.terms10Li4}</li>
            <li>{t.terms10Li5}</li>
          </ul>
          <p>{t.terms10P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms11Title}</h2>
          <p>{t.terms11P1}</p>
          <p>{t.terms11P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms12Title}</h2>
          <p>
            {t.terms12P1Pre}{" "}
            <Link className="underline underline-offset-2" href="/legal/privacy">
              {t.terms12PrivacyLink}
            </Link>{" "}
            {t.terms12P1Mid}{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              {t.terms12DpaLink}
            </Link>
            {t.terms12P1Post}
          </p>
          <p>
            {t.terms12P2Pre}{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            {t.terms12P2Post}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms13Title}</h2>
          <p>{t.terms13P1}</p>
          <p>{t.terms13P2}</p>
          <p>{t.terms13P3}</p>
          <p>{t.terms13P4}</p>
          <p className="text-ink/60">{t.terms13P5}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms14Title}</h2>
          <p>{t.terms14P1}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms15Title}</h2>
          <p>{t.terms15P1}</p>
          <p>{t.terms15P2}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms16Title}</h2>
          <p>{t.terms16P1}</p>
          <p>{t.terms16P2}</p>
          <p>{t.terms16P3}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms17Title}</h2>
          <p>{t.terms17P1}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms18Title}</h2>
          <p>
            {t.terms18P1}
          </p>
          <p>{t.terms18P2}</p>
          <p>
            {t.terms18P3Pre}{" "}
            <strong>{t.terms18ArnStrong}</strong>,{" "}
            <a
              className="underline underline-offset-2"
              href="https://www.arn.se"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.arn.se
            </a>
            {t.terms18P3Mid}{" "}
            <a
              className="underline underline-offset-2"
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">{t.terms19Title}</h2>
          <p>{t.terms19P1}</p>
          <p>{t.terms19P2}</p>
        </section>

      </div>

      <p className="mt-10 text-xs text-ink/50">{t.termsFooter}</p>
    </main>
  );
}
