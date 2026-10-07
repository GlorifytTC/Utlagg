"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

// Metadata lives in ./layout.tsx (this page is a client component).
const lk =
  "rounded underline underline-offset-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-nordic-600/20";

export default function DpaPage() {
  const sv = useLanguage().lang === "sv";
  // Swedish is the authoritative text; English is a faithful translation.
  const L = (s: ReactNode, e: ReactNode) => (sv ? s : e);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="break-words font-display text-2xl font-semibold tracking-tight hyphens-auto sm:text-3xl">
        {L("Personuppgiftsbiträdesavtal (DPA)", "Data Processing Agreement (DPA)")}
      </h1>
      <p className="mt-4 text-ink/70">
        {L(
          <>
            Detta personuppgiftsbiträdesavtal (&ldquo;DPA&rdquo;) reglerar GlorifyTC:s
            behandling av personuppgifter för din räkning när du använder Kvittino som
            företagskund. DPA:t utgör en integrerad del av användarvillkoren och gäller i
            den utsträckning du via tjänsten behandlar personuppgifter om andra fysiska
            personer än dig själv (t.ex. dina anställda, uppdragstagare, leverantörer eller
            fakturamottagare).
          </>,
          <>
            This data processing agreement (&ldquo;DPA&rdquo;) governs GlorifyTC&apos;s
            processing of personal data on your behalf when you use Kvittino as a business
            customer. The DPA forms an integral part of the terms of service and applies to
            the extent that you, through the service, process personal data about natural
            persons other than yourself (e.g. your employees, contractors, suppliers or
            invoice recipients).
          </>,
        )}
      </p>
      <p className="mt-2 text-sm text-ink/65">
        {L("Senast uppdaterad: 3 oktober 2026", "Last updated: 3 October 2026")}
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">

        <p>
          {L(
            <>
              Vid konflikt mellan detta DPA och{" "}
              <Link className={lk} href="/legal/terms">
                användarvillkoren
              </Link>{" "}
              har detta DPA företräde i frågor som rör behandling av personuppgifter.
            </>,
            <>
              In the event of a conflict between this DPA and the{" "}
              <Link className={lk} href="/legal/terms">
                terms of service
              </Link>
              , this DPA takes precedence in matters concerning the processing of personal data.
            </>,
          )}
        </p>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{L("1. Parter och roller", "1. Parties and roles")}</h2>
          <p>
            {L(
              <>
                <strong>Personuppgiftsansvarig</strong> (&ldquo;du&rdquo; eller
                &ldquo;Kunden&rdquo;): den företagskund som ingått användarvillkoren.
              </>,
              <>
                <strong>Controller</strong> (&ldquo;you&rdquo; or the
                &ldquo;Customer&rdquo;): the business customer that has entered into the terms of service.
              </>,
            )}
          </p>
          <p>
            {L(
              <>
                <strong>Personuppgiftsbiträde</strong> (&ldquo;vi&rdquo; eller
                &ldquo;Kvittino&rdquo;): GlorifyTC (enskild firma, org.nr 840818-1355),{" "}
              </>,
              <>
                <strong>Processor</strong> (&ldquo;we&rdquo; or
                &ldquo;Kvittino&rdquo;): GlorifyTC (sole proprietorship, org. no. 840818-1355),{" "}
              </>,
            )}
            <a className={lk} href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>
            .
          </p>
          <p>
            {L(
              <>
                Du är personuppgiftsansvarig för de personuppgifter du behandlar via
                tjänsten. Vi behandlar dessa uppgifter som ditt personuppgiftsbiträde,
                enbart enligt dina dokumenterade instruktioner så som dessa kommer till
                uttryck i användarvillkoren, detta DPA och tjänstens funktioner och
                inställningar.
              </>,
              <>
                You are the controller of the personal data you process through the
                service. We process this data as your processor, solely in accordance with
                your documented instructions as expressed in the terms of service, this DPA
                and the functions and settings of the service.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">
            {L("2. Föremål, varaktighet, art och ändamål", "2. Subject matter, duration, nature and purpose")}
          </h2>
          <p>
            {L(
              <>
                <strong>Föremål och art:</strong> lagring, strukturering, OCR-behandling,
                tillgängliggörande och radering av bokförings- och utläggsunderlag inom
                ramen för tjänsten.
              </>,
              <>
                <strong>Subject matter and nature:</strong> storage, structuring, OCR
                processing, making available and deletion of accounting and expense
                documentation within the scope of the service.
              </>,
            )}
          </p>
          <p>
            {L(
              <>
                <strong>Ändamål:</strong> att tillhandahålla Kvittino så som beskrivs i
                användarvillkoren.
              </>,
              <>
                <strong>Purpose:</strong> to provide Kvittino as described in the terms of service.
              </>,
            )}
          </p>
          <p>
            {L(
              <>
                <strong>Varaktighet:</strong> så länge användarvillkoren gäller, samt under
                den exportperiod och det raderingsförfarande som anges i punkt 8.
              </>,
              <>
                <strong>Duration:</strong> for as long as the terms of service apply, and during
                the export period and deletion procedure set out in section 8.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">
            {L("3. Kategorier av registrerade och personuppgifter", "3. Categories of data subjects and personal data")}
          </h2>
          <p>
            {L(
              <>
                <strong>Kategorier av registrerade:</strong> Kundens anställda och
                uppdragstagare, redovisningskonsulter och byråpersonal som Kunden ger
                åtkomst, samt fysiska personer som förekommer i uppladdade underlag
                (t.ex. enskilda näringsidkare som leverantörer, kontaktpersoner,
                fakturamottagare).
              </>,
              <>
                <strong>Categories of data subjects:</strong> the Customer&apos;s employees and
                contractors, accountants and firm staff to whom the Customer grants access, and
                natural persons appearing in uploaded documentation (e.g. sole traders as
                suppliers, contact persons, invoice recipients).
              </>,
            )}
          </p>
          <p>
            {L(
              <>
                <strong>Kategorier av personuppgifter:</strong> namn, kontakt- och
                adressuppgifter, uppgifter om utlägg och resor, belopp, samt sådana
                personuppgifter som kan förekomma i kvitto- och fakturabilder. Tjänsten är
                inte avsedd för behandling av särskilda kategorier av personuppgifter
                (art. 9); du ska undvika att ladda upp sådana uppgifter.
              </>,
              <>
                <strong>Categories of personal data:</strong> names, contact and address
                details, information about expenses and travel, amounts, and such personal data
                as may appear in receipt and invoice images. The service is not intended for
                the processing of special categories of personal data (Art. 9); you must avoid
                uploading such data.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{L("4. Kvittinos skyldigheter", "4. Kvittino's obligations")}</h2>
          <p>{L("Vi ska:", "We shall:")}</p>
          <ul className="ml-4 list-[lower-alpha] space-y-2 text-ink/80">
            <li>
              {L(
                <>
                  behandla personuppgifter enbart enligt dina dokumenterade instruktioner,
                  inklusive vad gäller överföring till tredjeland, om vi inte är skyldiga
                  att behandla dem enligt EU-rätt eller svensk rätt (och i så fall informera
                  dig om det rättsliga kravet innan behandlingen, om lagen inte förbjuder
                  det);
                </>,
                <>
                  process personal data only on your documented instructions, including with
                  regard to transfers to third countries, unless we are required to process
                  it under EU law or Swedish law (in which case we shall inform you of that
                  legal requirement before the processing, unless the law prohibits this);
                </>,
              )}
            </li>
            <li>
              {L(
                <>
                  säkerställa att personer med behörighet att behandla personuppgifterna har
                  åtagit sig att iaktta konfidentialitet;
                </>,
                <>
                  ensure that persons authorised to process the personal data have committed
                  themselves to confidentiality;
                </>,
              )}
            </li>
            <li>
              {L(
                <>
                  vidta lämpliga tekniska och organisatoriska säkerhetsåtgärder enligt
                  art. 32 GDPR, så som beskrivs i Bilaga A;
                </>,
                <>
                  implement appropriate technical and organisational security measures under
                  Art. 32 GDPR, as described in Annex A;
                </>,
              )}
            </li>
            <li>
              {L(
                "respektera villkoren för anlitande av underbiträden i punkt 5;",
                "respect the conditions for engaging sub-processors in section 5;",
              )}
            </li>
            <li>
              {L(
                <>
                  i den mån det är möjligt bistå dig med lämpliga åtgärder så att du kan
                  fullgöra din skyldighet att svara på registrerades begäran om att utöva
                  sina rättigheter enligt kapitel III GDPR;
                </>,
                <>
                  to the extent possible, assist you with appropriate measures so that you can
                  fulfil your obligation to respond to data subjects&apos; requests to exercise
                  their rights under Chapter III GDPR;
                </>,
              )}
            </li>
            <li>
              {L(
                <>
                  bistå dig med att fullgöra skyldigheterna enligt art. 32-36 GDPR, med
                  hänsyn till behandlingens art och den information vi har tillgång till;
                </>,
                <>
                  assist you in fulfilling the obligations under Art. 32-36 GDPR, taking into
                  account the nature of the processing and the information available to us;
                </>,
              )}
            </li>
            <li>
              {L(
                <>
                  på ditt val radera eller återlämna personuppgifterna vid tjänstens
                  upphörande, enligt punkt 8;
                </>,
                <>
                  at your choice, delete or return the personal data when the service ends,
                  in accordance with section 8;
                </>,
              )}
            </li>
            <li>
              {L(
                <>
                  ge dig tillgång till den information som krävs för att visa att
                  skyldigheterna enligt art. 28 GDPR fullgjorts, samt möjliggöra och bidra
                  till granskningar enligt punkt 7.
                </>,
                <>
                  make available to you the information necessary to demonstrate compliance
                  with the obligations under Art. 28 GDPR, and allow for and contribute to
                  audits in accordance with section 7.
                </>,
              )}
            </li>
          </ul>
          <p>
            {L(
              <>
                Om vi anser att en instruktion strider mot GDPR eller annan
                dataskyddslagstiftning ska vi informera dig om detta utan dröjsmål.
              </>,
              <>
                If we consider that an instruction infringes the GDPR or other data
                protection legislation, we shall inform you without delay.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{L("5. Underbiträden", "5. Sub-processors")}</h2>
          <p>
            {L(
              <>
                Du ger härmed ett allmänt skriftligt godkännande till att vi anlitar
                underbiträden. En aktuell lista finns på{" "}
              </>,
              <>
                You hereby give general written authorisation for us to engage
                sub-processors. A current list is available at{" "}
              </>,
            )}
            <Link className={lk} href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            .
          </p>
          <p>
            {L(
              <>
                Vi ska underrätta dig minst trettio (30) dagar innan vi anlitar ett nytt
                underbiträde eller ersätter ett befintligt, så att du får möjlighet att
                invända. Om du har sakliga, dataskyddsrelaterade invändningar ska parterna i
                god tro söka en lösning; om ingen lösning nås har du rätt att säga upp de
                delar av tjänsten som förutsätter det aktuella underbiträdet.
              </>,
              <>
                We shall notify you at least thirty (30) days before engaging a new
                sub-processor or replacing an existing one, so that you have the opportunity
                to object. If you have reasonable, data-protection-related objections, the
                parties shall seek a solution in good faith; if no solution is reached, you
                have the right to terminate the parts of the service that depend on the
                sub-processor concerned.
              </>,
            )}
          </p>
          <p>
            {L(
              <>
                Vi ålägger varje underbiträde samma dataskyddsskyldigheter som anges i detta
                DPA genom avtal, och vi ansvarar gentemot dig för underbiträdets fullgörande
                av sina skyldigheter.
              </>,
              <>
                We impose on each sub-processor, by contract, the same data protection
                obligations as set out in this DPA, and we remain liable to you for the
                sub-processor&apos;s performance of its obligations.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{L("6. Överföring till tredjeland", "6. Transfers to third countries")}</h2>
          <p>
            {L(
              <>
                Överföring av personuppgifter till ett land utanför EU/EES sker endast om
                lämpliga skyddsåtgärder enligt kapitel V GDPR finns på plats, t.ex.
                EU-kommissionens standardavtalsklausuler (SCC) eller EU-US Data Privacy
                Framework. OCR av kvitton sker via Google Gemini API (USA); Kunden
                godkänner att kvittobilder skickas dit för detta ändamål. Se{" "}
                <Link className={lk} href="/legal/privacy">
                  integritetspolicyn
                </Link>{" "}
                och underbiträdeslistan för närmare information.
              </>,
              <>
                Personal data is transferred to a country outside the EU/EEA only if
                appropriate safeguards under Chapter V GDPR are in place, e.g. the European
                Commission&apos;s standard contractual clauses (SCC) or the EU-US Data Privacy
                Framework. OCR of receipts is performed via the Google Gemini API (USA); the
                Customer consents to receipt images being sent there for this purpose. See the{" "}
                <Link className={lk} href="/legal/privacy">
                  privacy policy
                </Link>{" "}
                and the sub-processor list for further information.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{L("7. Granskning", "7. Audits")}</h2>
          <p>
            {L(
              <>
                Vi ska på din begäran tillhandahålla den information som rimligen krävs för
                att visa att vi uppfyller detta DPA. Sådan efterlevnad kan visas genom
                aktuella intyg, certifieringar eller granskningsrapporter från oberoende
                tredje part. Om detta inte rimligen är tillräckligt för att styrka
                efterlevnad har du, eller en oberoende granskare som du utser och som inte
                är vår konkurrent, rätt att utföra en granskning med skäligt varsel, högst
                en gång per år, under ordinarie arbetstid och utan att otillbörligt störa
                vår verksamhet.
              </>,
              <>
                Upon your request, we shall provide the information reasonably necessary to
                demonstrate that we comply with this DPA. Such compliance may be demonstrated
                through current attestations, certifications or audit reports from an
                independent third party. If this is not reasonably sufficient to demonstrate
                compliance, you, or an independent auditor appointed by you who is not our
                competitor, have the right to carry out an audit on reasonable notice, at most
                once per year, during normal business hours and without unduly disturbing our
                operations.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">
            {L("8. Radering och återlämnande vid avtalets upphörande", "8. Deletion and return on termination")}
          </h2>
          <p>
            {L(
              <>
                Vid tjänstens upphörande ska vi, enligt ditt val, radera eller återlämna
                samtliga personuppgifter. Din stående instruktion är följande, om du inte
                skriftligen anger annat: du ges tillgång till uppgifterna i läsläge för
                självbetjäningsexport (SIE, CSV, PDF) under en exportperiod om tolv (12)
                månader. Efter exportperioden och efter att vi underrättat dig kan uppgifterna
                raderas permanent. Detta motsvarar § 7 i användarvillkoren. Raderar du hela
                kontot i tjänsten tas dina uppgifter och kvittobilder bort i samband med
                raderingen.
              </>,
              <>
                When the service ends, we shall, at your choice, delete or return all personal
                data. Your standing instruction, unless you specify otherwise in writing, is
                as follows: you are given read-only access to the data for self-service export
                (SIE, CSV, PDF) during an export period of twelve (12) months. After the export
                period, and after we have notified you, the data may be permanently deleted.
                This corresponds to section 7 of the terms of service. If you delete the entire
                account in the service, your data and receipt images are removed in connection
                with the deletion.
              </>,
            )}
          </p>
          <p>
            {L(
              <>
                Vi får bevara personuppgifter i den utsträckning EU-rätt eller svensk rätt
                kräver det, varvid uppgifterna endast behandlas för det ändamål och under
                den tid som lagen föreskriver.
              </>,
              <>
                We may retain personal data to the extent required by EU law or Swedish law,
                in which case the data is processed only for the purpose and for the period
                prescribed by law.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">{L("9. Personuppgiftsincidenter", "9. Personal data breaches")}</h2>
          <p>
            {L(
              <>
                Vi ska underrätta dig utan onödigt dröjsmål efter att vi fått kännedom om en
                personuppgiftsincident som rör de uppgifter vi behandlar för din räkning,
                och bistå dig med sådan information som rimligen krävs för att du ska kunna
                fullgöra dina skyldigheter enligt art. 33-34 GDPR.
              </>,
              <>
                We shall notify you without undue delay after becoming aware of a personal
                data breach concerning the data we process on your behalf, and assist you with
                such information as is reasonably required for you to fulfil your obligations
                under Art. 33-34 GDPR.
              </>,
            )}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">
            {L("10. Tvistlösning, tillämplig lag och ändringar", "10. Dispute resolution, governing law and amendments")}
          </h2>
          <p>
            {L(
              <>
                Detta DPA regleras av svensk rätt. Tvister löses enligt vad som anges i
                användarvillkoren. Ändringar av detta DPA hanteras enligt användarvillkorens
                bestämmelser om ändringar; ändringar som krävs för att uppfylla tvingande
                dataskyddslagstiftning kan dock genomföras med den kortare framförhållning
                som lagstiftningen medför.
              </>,
              <>
                This DPA is governed by Swedish law. Disputes are resolved as set out in the
                terms of service. Amendments to this DPA are handled in accordance with the
                terms of service&apos;s provisions on amendments; however, amendments required
                to comply with mandatory data protection legislation may be implemented on the
                shorter notice that the legislation entails.
              </>,
            )}
          </p>
        </section>

        <div className="rounded-xl border border-ink/10 p-4 space-y-2 text-ink/80">
          <p>
            {L(
              <>
                <strong>Bilaga A - Tekniska och organisatoriska säkerhetsåtgärder:</strong>{" "}
                se{" "}
              </>,
              <>
                <strong>Annex A - Technical and organisational security measures:</strong>{" "}
                see{" "}
              </>,
            )}
            <Link className={lk} href="/security">
              /security
            </Link>
            {L(", som utgör en integrerad del av detta DPA.", ", which forms an integral part of this DPA.")}
          </p>
          <p>
            {L(
              <>
                <strong>Bilaga B - Underbiträden:</strong> se{" "}
              </>,
              <>
                <strong>Annex B - Sub-processors:</strong> see{" "}
              </>,
            )}
            <Link className={lk} href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            .
          </p>
        </div>

      </div>

      <p className="mt-10 text-xs text-ink/65">
        {L(
          "Kontakt: legal@kvittino.se · GlorifyTC (enskild firma, org.nr 840818-1355)",
          "Contact: legal@kvittino.se · GlorifyTC (sole proprietorship, org. no. 840818-1355)",
        )}
      </p>
    </main>
  );
}
