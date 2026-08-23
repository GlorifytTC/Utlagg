import Link from "next/link";

export const metadata = { title: "Integritetspolicy — Kvittino" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">Integritetspolicy</h1>
      <p className="mt-4 text-ink/70">
        Den här policyn beskriver hur GlorifyTC (&ldquo;vi&rdquo;, &ldquo;oss&rdquo;
        eller &ldquo;Kvittino&rdquo;) samlar in, använder och skyddar dina
        personuppgifter när du använder Kvittino. Vi behandlar personuppgifter i
        enlighet med EU:s dataskyddsförordning (GDPR, EU 2016/679) och
        kompletterande svensk dataskyddslagstiftning.
      </p>
      <p className="mt-2 text-sm text-ink/50">Senast uppdaterad: 18 juli 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">

        <section className="space-y-3">
          <h2 className="font-display text-lg">1. Personuppgiftsansvarig</h2>
          <p>
            <strong>GlorifyTC</strong> (org.nr [xxxxxx-xxxx]) är personuppgiftsansvarig
            för behandlingen av dina uppgifter i samband med ditt konto och din
            användning av tjänsten.
          </p>
          <p>
            Kontakt i dataskyddsfrågor:{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>
          </p>
          <p className="text-ink/60">
            När du som företagsanvändare behandlar tredje parts personuppgifter
            (t.ex. dina anställdas utlägg) via Kvittino agerar GlorifyTC som ditt
            personuppgiftsbiträde. Se vårt{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              personuppgiftsbiträdesavtal (DPA)
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">2. Vilka uppgifter vi samlar in</h2>

          <p className="font-medium text-ink/90">Kontoinformation</p>
          <p className="text-ink/80">
            Namn, e-postadress, krypterat lösenord och inloggningsmetod (e-post/
            lösenord eller BankID). Vid inloggning med BankID behandlas ditt
            personnummer vid inloggningstillfället som en del av autentiseringen, men vi
            lagrar det inte; vi bevarar endast en referens till den genomförda
            autentiseringen.
          </p>

          <p className="font-medium text-ink/90">Företagsinformation</p>
          <p className="text-ink/80">
            Företagsnamn, organisationsnummer, momsregistreringsnummer och
            postadress om du registrerar ett företag i tjänsten.
          </p>

          <p className="font-medium text-ink/90">Bokföringsunderlag</p>
          <p className="text-ink/80">
            Kvittobilder och data extraherade via OCR: leverantör, datum, belopp,
            momssats och BAS-konto. Dessa uppgifter kan innehålla personuppgifter
            om leverantören är en enskild firma eller om kvittot innehåller
            personnamn.
          </p>

          <p className="font-medium text-ink/90">Körjournaldata</p>
          <p className="text-ink/80">
            Start- och slutadresser, körsträcka, datum, resans syfte och fordon.
          </p>

          <p className="font-medium text-ink/90">Fakturadata</p>
          <p className="text-ink/80">
            Fakturanummer, kunduppgifter (namn, org.nr, adress), radposter och
            belopp.
          </p>

          <p className="font-medium text-ink/90">Betalningsinformation</p>
          <p className="text-ink/80">
            Prenumerationstyp, faktureringsperiod och betalningsstatus. Kortuppgifter
            hanteras uteslutande av Stripe — vi lagrar dem inte.
          </p>

          <p className="font-medium text-ink/90">Supportärenden</p>
          <p className="text-ink/80">
            Om du kontaktar vår support behandlar vi din korrespondens och de
            uppgifter du lämnar i ärendet.
          </p>

          <p className="font-medium text-ink/90">Loggar och teknisk data</p>
          <p className="text-ink/80">
            IP-adress, tidsstämpel och åtgärdstyp loggas vid inloggning och
            kontoaktivitet. Vi samlar också in webbläsartyp och sessionsdata för
            säkerhet och felsökning.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">3. Ändamål och rättslig grund</h2>

          <div className="rounded-xl border border-ink/10 divide-y divide-ink/10 overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr] gap-4 p-4 text-xs font-medium text-ink/50 uppercase tracking-wide">
              <span>Ändamål</span>
              <span>Rättslig grund (GDPR art. 6)</span>
            </div>
            {[
              ["Tillhandahålla och driva tjänsten, inklusive lagring av dina kvitton och underlag", "Avtalsfullgörelse (6.1.b)"],
              ["Hantera prenumerationer och betalningar", "Avtalsfullgörelse (6.1.b)"],
              ["Bevara vår egen räkenskapsinformation (fakturor till dig, betalningshistorik) i sju år", "Rättslig förpliktelse (6.1.c) — Bokföringslagen och skattelagstiftning"],
              ["Skicka transaktionsmejl (kvitton, lösenordsåterställning, inbjudningar, raderingspåminnelser)", "Avtalsfullgörelse (6.1.b)"],
              ["Hantera supportärenden", "Berättigat intresse (6.1.f) — att kunna ge dig support"],
              ["Förhindra bedrägerier, missbruk och obehörig åtkomst; säkerhets- och ändringsloggar", "Berättigat intresse (6.1.f)"],
              ["Förhindra upprepat utnyttjande av den kostnadsfria provperioden (pseudonymiserad token härledd från e-postadress, bevarad efter kontoradering)", "Berättigat intresse (6.1.f)"],
              ["Förbättra OCR-modellen med hjälp av dina markeringar (uppgifterna avidentifieras före sådan användning)", "Samtycke (6.1.a) — kan återkallas när som helst"],
              ["Uppfylla lagkrav och besvara bindande myndighetsförfrågningar", "Rättslig förpliktelse (6.1.c)"],
            ].map(([purpose, basis]) => (
              <div key={purpose} className="grid grid-cols-[1fr_1fr] gap-4 p-4 text-ink/80">
                <span>{purpose}</span>
                <span className="text-ink/60">{basis}</span>
              </div>
            ))}
          </div>

          <p className="text-ink/80">
            När du som företagskund behandlar dina anställdas eller andra tredje mäns
            personuppgifter via tjänsten agerar vi personuppgiftsbiträde enligt vårt{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              personuppgiftsbiträdesavtal
            </Link>
            ; den rättsliga grunden för sådan behandling fastställs av dig som
            personuppgiftsansvarig.
          </p>

          <p className="text-ink/60">
            Vi förlitar oss på berättigat intresse (art. 6.1.f) enbart där vårt
            intresse av att upprätthålla tjänstens säkerhet och funktionalitet
            väger tyngre än ditt intresse av skydd. Du har alltid rätt att invända
            mot sådan behandling (se avsnitt 7).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">4. Lagringstider</h2>
          <p>
            Vi skiljer mellan innehåll vi lagrar för din räkning som en del av tjänsten
            och uppgifter vi behandlar för egen räkning.
          </p>

          <p className="font-medium text-ink/90">Innehåll vi lagrar för din räkning</p>
          <ul className="ml-4 list-disc space-y-2 text-ink/80">
            <li>
              <strong>Kvitton, verifikationer, körjournaler och fakturor</strong> — under
              aktiv prenumeration samt under en exportperiod om tolv (12) månader
              därefter, i enlighet med § 7 i användarvillkoren. Innan radering sker
              skickar vi påminnelser 90, 30 och 7 dagar i förväg, varefter uppgifterna
              raderas inom 30 dagar. Observera att arkiveringsskyldigheten enligt
              Bokföringslagen (SFS 1999:1078) åvilar dig som bokföringsskyldig —
              exportera dina underlag innan exportperioden löper ut.
            </li>
          </ul>

          <p className="font-medium text-ink/90">Uppgifter vi behandlar för egen räkning</p>
          <ul className="ml-4 list-disc space-y-2 text-ink/80">
            <li>
              <strong>Kontouppgifter</strong> — till dess att du raderar ditt konto,
              varefter uppgifterna tas bort inom 30 dagar, utom där lag kräver längre
              bevarande.
            </li>
            <li>
              <strong>Vår egen räkenskapsinformation</strong> (fakturor till dig,
              betalningshistorik) — sju (7) år enligt Bokföringslagen och
              skattelagstiftningen.
            </li>
            <li>
              <strong>Säkerhetsloggar</strong> (IP-adress, sessioner) — nittio (90) dagar.
            </li>
            <li>
              <strong>Ändringslogg för verifikationer</strong> (vem som ändrat vad, utan
              IP-adress) — så länge det underliggande underlaget lagras.
            </li>
            <li>
              <strong>Supportärenden</strong> — så länge det behövs för att hantera
              ärendet och en rimlig tid därefter, dock längst 24 månader.
            </li>
            <li>
              <strong>Pseudonymiserad provperiodstoken</strong> — efter att du raderat
              ditt konto bevarar vi en envägskrypterad (hashad) token som härletts från
              din normaliserade e-postadress, uteslutande för att förhindra upprepat
              utnyttjande av den kostnadsfria provperioden. Token kan inte återställas
              till din e-postadress och bevaras i högst tjugofyra (24) månader, varefter
              den raderas automatiskt.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">5. Mottagare och underbiträden</h2>
          <p>
            Vi delar personuppgifter enbart med leverantörer som behöver dem för att
            vi ska kunna tillhandahålla tjänsten. En fullständig och uppdaterad lista
            finns på{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            . Exempel på kategorier:
          </p>
          <ul className="ml-4 list-disc space-y-1 text-ink/80">
            <li>Molninfrastruktur och databas (EU)</li>
            <li>Lagring av kvittobilder (EU)</li>
            <li>Betalningshantering (EU/US med lämpliga skyddsåtgärder)</li>
            <li>Transaktionsmejl (US med lämpliga skyddsåtgärder)</li>
            <li>OCR-behandling av kvitton (EU)</li>
          </ul>
          <p>
            Vi säljer aldrig personuppgifter till tredje part och delar dem aldrig
            för marknadsföringsändamål utan ditt uttryckliga samtycke. Vi kan lämna ut
            uppgifter till myndigheter (t.ex. Skatteverket, Polisen) om vi är skyldiga
            att göra det enligt lag.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">6. Överföring till tredjeland</h2>
          <p>
            Vår primära lagring sker i <strong>Sverige och inom EU/EES</strong>.
            Vissa underbiträden är etablerade i USA. Sådana överföringar sker
            uteslutande med stöd av EU-kommissionens standardavtalsklausuler (SCC,
            art. 46.2.c GDPR) och/eller EU–US Data Privacy Framework där leverantören
            är certifierad.
          </p>
          <p>
            Du kan begära information om vilka skyddsåtgärder som gäller för en
            specifik underbiträdare genom att kontakta oss på{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">7. Dina rättigheter</h2>
          <p>
            Under GDPR har du följande rättigheter. Kontakta oss på{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>{" "}
            för att utöva dem. Vi svarar inom en (1) månad.
          </p>
          <ul className="ml-4 list-disc space-y-2 text-ink/80">
            <li>
              <strong>Tillgång (art. 15)</strong> — rätt att få bekräftelse på om
              vi behandlar uppgifter om dig och att få en kopia av dem.
            </li>
            <li>
              <strong>Rättelse (art. 16)</strong> — rätt att få felaktiga eller
              ofullständiga uppgifter korrigerade. Du kan uppdatera de flesta
              uppgifter direkt via profilinställningarna.
            </li>
            <li>
              <strong>Radering (art. 17)</strong> — rätt att begära att vi raderar
              dina uppgifter (&ldquo;rätten att bli bortglömd&rdquo;), under
              förutsättning att vi inte har rättslig skyldighet att bevara dem. När du
              utövar din rätt till radering tar vi bort dina personuppgifter, med undantag
              för den pseudonymiserade provperiodstoken som beskrivs i avsnittet om
              lagringstider och för sådana uppgifter vi är skyldiga att bevara enligt lag.
            </li>
            <li>
              <strong>Begränsning (art. 18)</strong> — rätt att begära att
              behandlingen begränsas i vissa situationer, t.ex. om du bestrider
              uppgifternas riktighet.
            </li>
            <li>
              <strong>Dataportabilitet (art. 20)</strong> — rätt att få ut de
              uppgifter du lämnat i ett strukturerat, maskinläsbart format (CSV, SIE,
              PDF). Exportfunktioner finns direkt i tjänsten.
            </li>
            <li>
              <strong>Invändning (art. 21)</strong> — rätt att invända mot
              behandling som grundar sig på berättigat intresse. Vi upphör med
              behandlingen om vi inte kan påvisa tvingande berättigade skäl.
            </li>
            <li>
              <strong>Återkallelse av samtycke</strong> — om behandlingen grundas
              på samtycke (t.ex. förbättring av OCR-modellen) kan du när som helst
              återkalla det utan att det påverkar lagligheten av tidigare behandling.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">8. Rätt att klaga till tillsynsmyndigheten</h2>
          <p>
            Om du anser att vi behandlar dina personuppgifter i strid med GDPR har
            du rätt att inge ett klagomål till{" "}
            <strong>Integritetsskyddsmyndigheten (IMY)</strong>:
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
          <p>
            Vi ser gärna att du kontaktar oss först så att vi kan lösa eventuella
            problem direkt.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">9. Säkerhet</h2>
          <p>
            Vi vidtar tekniska och organisatoriska åtgärder för att skydda dina
            uppgifter mot obehörig åtkomst, förlust och förstöring. Åtgärderna
            inkluderar kryptering under överföring (TLS/HTTPS), krypterade lösenord
            (bcrypt), tidsbegränsade signerade URL:er för kvittobilder och en
            ändringslogg för kontoåtgärder.
          </p>
          <p>
            Vid en personuppgiftsincident anmäler vi incidenten till
            Integritetsskyddsmyndigheten (IMY) utan onödigt dröjsmål och, där det är
            möjligt, senast 72 timmar efter att vi fått kännedom om den, i enlighet med
            art. 33 GDPR. Om incidenten kan innebära en hög risk för dina rättigheter
            och friheter informerar vi även dig utan onödigt dröjsmål (art. 34). När vi
            agerar personuppgiftsbiträde underrättar vi i stället den
            personuppgiftsansvarige utan onödigt dröjsmål.
          </p>
          <p>
            Mer information finns på{" "}
            <Link className="underline underline-offset-2" href="/security">
              /security
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">10. Cookies och spårning</h2>
          <p>
            Kvittino använder nödvändiga cookies för att hålla dig inloggad och
            skydda din session (CSRF-skydd). Vi använder inte spårningscookies för
            reklam.
          </p>
          <p>
            Om vi i framtiden inför analytiska eller icke-nödvändiga cookies
            inhämtar vi ditt samtycke via ett cookie-meddelande innan de aktiveras.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">11. Automatiserat beslutsfattande</h2>
          <p>
            Vår OCR-funktion extraherar automatiskt data från kvitton och föreslår
            momssats och BAS-konto. Detta är ett beslutsstöd — du granskar och
            godkänner alltid resultatet innan det sparas. Kvittino fattar inte
            automatiserade beslut som producerar rättsliga eller liknande effekter
            för dig i den mening som avses i GDPR art. 22.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">12. Ändringar av policyn</h2>
          <p>
            Vi kan uppdatera denna policy för att spegla förändringar i tjänsten
            eller lagstiftningen. Vid väsentliga ändringar skickar vi ett
            meddelande till din registrerade e-postadress med minst 30 dagars
            varsel. Det aktuella datumet för senaste uppdatering anges alltid
            högst upp på sidan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">13. Kontakt</h2>
          <p>
            Frågor om hur vi behandlar dina personuppgifter besvaras på:{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>
          </p>
          <p>
            Se även vår{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              DPA
            </Link>
            ,{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              listan över underbiträden
            </Link>{" "}
            och{" "}
            <Link className="underline underline-offset-2" href="/legal/terms">
              användarvillkoren
            </Link>
            .
          </p>
        </section>

      </div>

      <p className="mt-10 text-xs text-ink/50">
        Kontakt: legal@kvittino.se · GlorifyTC · Org.nr [xxxxxx-xxxx]
      </p>
    </main>
  );
}
