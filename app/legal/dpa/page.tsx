import Link from "next/link";

export const metadata = { title: "Personuppgiftsbiträdesavtal — Kvittino" };

export default function DpaPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">Personuppgiftsbiträdesavtal (DPA)</h1>
      <p className="mt-4 text-ink/70">
        Detta personuppgiftsbiträdesavtal (&ldquo;DPA&rdquo;) reglerar GlorifyTC:s
        behandling av personuppgifter för din räkning när du använder Kvittino som
        företagskund. DPA:t utgör en integrerad del av användarvillkoren och gäller i
        den utsträckning du via tjänsten behandlar personuppgifter om andra fysiska
        personer än dig själv (t.ex. dina anställda, uppdragstagare, leverantörer eller
        fakturamottagare).
      </p>
      <p className="mt-2 text-sm text-ink/50">Senast uppdaterad: 18 juli 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">

        <p>
          Vid konflikt mellan detta DPA och{" "}
          <Link className="underline underline-offset-2" href="/legal/terms">
            användarvillkoren
          </Link>{" "}
          har detta DPA företräde i frågor som rör behandling av personuppgifter.
        </p>

        <section className="space-y-3">
          <h2 className="font-display text-lg">1. Parter och roller</h2>
          <p>
            <strong>Personuppgiftsansvarig</strong> (&ldquo;du&rdquo; eller
            &ldquo;Kunden&rdquo;): den företagskund som ingått användarvillkoren.
          </p>
          <p>
            <strong>Personuppgiftsbiträde</strong> (&ldquo;vi&rdquo; eller
            &ldquo;Kvittino&rdquo;): GlorifyTC, org.nr [xxxxxx-xxxx],{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>
            .
          </p>
          <p>
            Du är personuppgiftsansvarig för de personuppgifter du behandlar via
            tjänsten. Vi behandlar dessa uppgifter som ditt personuppgiftsbiträde,
            enbart enligt dina dokumenterade instruktioner så som dessa kommer till
            uttryck i användarvillkoren, detta DPA och tjänstens funktioner och
            inställningar.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">2. Föremål, varaktighet, art och ändamål</h2>
          <p>
            <strong>Föremål och art:</strong> lagring, strukturering, OCR-behandling,
            tillgängliggörande och radering av bokförings- och utläggsunderlag inom
            ramen för tjänsten.
          </p>
          <p>
            <strong>Ändamål:</strong> att tillhandahålla Kvittino så som beskrivs i
            användarvillkoren.
          </p>
          <p>
            <strong>Varaktighet:</strong> så länge användarvillkoren gäller, samt under
            den exportperiod och det raderingsförfarande som anges i punkt 8.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">3. Kategorier av registrerade och personuppgifter</h2>
          <p>
            <strong>Kategorier av registrerade:</strong> Kundens anställda och
            uppdragstagare, samt fysiska personer som förekommer i uppladdade underlag
            (t.ex. enskilda näringsidkare som leverantörer, kontaktpersoner,
            fakturamottagare).
          </p>
          <p>
            <strong>Kategorier av personuppgifter:</strong> namn, kontakt- och
            adressuppgifter, uppgifter om utlägg och resor, belopp, samt sådana
            personuppgifter som kan förekomma i kvitto- och fakturabilder. Tjänsten är
            inte avsedd för behandling av särskilda kategorier av personuppgifter
            (art. 9); du ska undvika att ladda upp sådana uppgifter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">4. Kvittinos skyldigheter</h2>
          <p>Vi ska:</p>
          <ul className="ml-4 list-[lower-alpha] space-y-2 text-ink/80">
            <li>
              behandla personuppgifter enbart enligt dina dokumenterade instruktioner,
              inklusive vad gäller överföring till tredjeland, om vi inte är skyldiga
              att behandla dem enligt EU-rätt eller svensk rätt (och i så fall informera
              dig om det rättsliga kravet innan behandlingen, om lagen inte förbjuder
              det);
            </li>
            <li>
              säkerställa att personer med behörighet att behandla personuppgifterna har
              åtagit sig att iaktta konfidentialitet;
            </li>
            <li>
              vidta lämpliga tekniska och organisatoriska säkerhetsåtgärder enligt
              art. 32 GDPR, så som beskrivs i Bilaga A;
            </li>
            <li>respektera villkoren för anlitande av underbiträden i punkt 5;</li>
            <li>
              i den mån det är möjligt bistå dig med lämpliga åtgärder så att du kan
              fullgöra din skyldighet att svara på registrerades begäran om att utöva
              sina rättigheter enligt kapitel III GDPR;
            </li>
            <li>
              bistå dig med att fullgöra skyldigheterna enligt art. 32–36 GDPR, med
              hänsyn till behandlingens art och den information vi har tillgång till;
            </li>
            <li>
              på ditt val radera eller återlämna personuppgifterna vid tjänstens
              upphörande, enligt punkt 8;
            </li>
            <li>
              ge dig tillgång till den information som krävs för att visa att
              skyldigheterna enligt art. 28 GDPR fullgjorts, samt möjliggöra och bidra
              till granskningar enligt punkt 7.
            </li>
          </ul>
          <p>
            Om vi anser att en instruktion strider mot GDPR eller annan
            dataskyddslagstiftning ska vi informera dig om detta utan dröjsmål.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">5. Underbiträden</h2>
          <p>
            Du ger härmed ett allmänt skriftligt godkännande till att vi anlitar
            underbiträden. En aktuell lista finns på{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            .
          </p>
          <p>
            Vi ska underrätta dig minst trettio (30) dagar innan vi anlitar ett nytt
            underbiträde eller ersätter ett befintligt, så att du får möjlighet att
            invända. Om du har sakliga, dataskyddsrelaterade invändningar ska parterna i
            god tro söka en lösning; om ingen lösning nås har du rätt att säga upp de
            delar av tjänsten som förutsätter det aktuella underbiträdet.
          </p>
          <p>
            Vi ålägger varje underbiträde samma dataskyddsskyldigheter som anges i detta
            DPA genom avtal, och vi ansvarar gentemot dig för underbiträdets fullgörande
            av sina skyldigheter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">6. Överföring till tredjeland</h2>
          <p>
            Överföring av personuppgifter till ett land utanför EU/EES sker endast om
            lämpliga skyddsåtgärder enligt kapitel V GDPR finns på plats, t.ex.
            EU-kommissionens standardavtalsklausuler (SCC) eller EU–US Data Privacy
            Framework. Se{" "}
            <Link className="underline underline-offset-2" href="/legal/privacy">
              integritetspolicyn
            </Link>{" "}
            och underbiträdeslistan för närmare information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">7. Granskning</h2>
          <p>
            Vi ska på din begäran tillhandahålla den information som rimligen krävs för
            att visa att vi uppfyller detta DPA. Sådan efterlevnad kan visas genom
            aktuella intyg, certifieringar eller granskningsrapporter från oberoende
            tredje part. Om detta inte rimligen är tillräckligt för att styrka
            efterlevnad har du, eller en oberoende granskare som du utser och som inte
            är vår konkurrent, rätt att utföra en granskning med skäligt varsel, högst
            en gång per år, under ordinarie arbetstid och utan att otillbörligt störa
            vår verksamhet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">8. Radering och återlämnande vid avtalets upphörande</h2>
          <p>
            Vid tjänstens upphörande ska vi, enligt ditt val, radera eller återlämna
            samtliga personuppgifter. Din stående instruktion är följande, om du inte
            skriftligen anger annat: du ges tillgång till uppgifterna i läsläge för
            självbetjäningsexport (SIE, CSV, PDF) under en exportperiod om tolv (12)
            månader, med påminnelser 90, 30 och 7 dagar före periodens utgång, varefter
            uppgifterna raderas permanent inom trettio (30) dagar. Detta motsvarar § 7 i
            användarvillkoren.
          </p>
          <p>
            Vi får bevara personuppgifter i den utsträckning EU-rätt eller svensk rätt
            kräver det, varvid uppgifterna endast behandlas för det ändamål och under
            den tid som lagen föreskriver.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">9. Personuppgiftsincidenter</h2>
          <p>
            Vi ska underrätta dig utan onödigt dröjsmål efter att vi fått kännedom om en
            personuppgiftsincident som rör de uppgifter vi behandlar för din räkning,
            och bistå dig med sådan information som rimligen krävs för att du ska kunna
            fullgöra dina skyldigheter enligt art. 33–34 GDPR.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">10. Tvistlösning, tillämplig lag och ändringar</h2>
          <p>
            Detta DPA regleras av svensk rätt. Tvister löses enligt vad som anges i
            användarvillkoren. Ändringar av detta DPA hanteras enligt användarvillkorens
            bestämmelser om ändringar; ändringar som krävs för att uppfylla tvingande
            dataskyddslagstiftning kan dock genomföras med den kortare framförhållning
            som lagstiftningen medför.
          </p>
        </section>

        <div className="rounded-xl border border-ink/10 p-4 space-y-2 text-ink/80">
          <p>
            <strong>Bilaga A — Tekniska och organisatoriska säkerhetsåtgärder:</strong>{" "}
            se{" "}
            <Link className="underline underline-offset-2" href="/security">
              /security
            </Link>
            , som utgör en integrerad del av detta DPA.
          </p>
          <p>
            <strong>Bilaga B — Underbiträden:</strong> se{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            .
          </p>
        </div>

      </div>

      <p className="mt-10 text-xs text-ink/50">
        Kontakt: legal@kvittino.se · GlorifyTC · Org.nr [xxxxxx-xxxx]
      </p>
    </main>
  );
}
