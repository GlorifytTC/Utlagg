import Link from "next/link";

export const metadata = { title: "Användarvillkor — Kvittino" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-ink">
      <h1 className="font-display text-3xl">Användarvillkor</h1>
      <p className="mt-4 text-ink/70">
        Dessa villkor reglerar din användning av Kvittino — en AI-driven tjänst för
        kvittohantering, utläggsredovisning och bokföringsexport anpassad för
        svenska moms- och bokföringsregler.
      </p>
      <p className="mt-2 text-sm text-ink/50">Senast uppdaterad: 28 juni 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed">

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 1 Parter</h2>
          <p>
            Tjänsten tillhandahålls av <strong>GlorifyTC</strong> (org.nr [xxxxxx-xxxx]),
            nedan kallat &ldquo;vi&rdquo;, &ldquo;oss&rdquo; eller &ldquo;Kvittino&rdquo;.
          </p>
          <p>
            Den fysiska eller juridiska person som registrerar ett konto och godkänner
            dessa villkor kallas &ldquo;du&rdquo;, &ldquo;Kunden&rdquo; eller
            &ldquo;Användaren&rdquo;. Om du accepterar villkoren å ett företags vägnar
            intygar du att du har befogenhet att binda det företaget.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 2 Avtalets ingående</h2>
          <p>
            Avtalet träder i kraft när du skapar ett konto och markerar att du
            accepterar dessa villkor. Fortsatt användning av tjänsten efter att
            villkoren uppdaterats innebär att du godkänner de nya villkoren.
          </p>
          <p>
            Dessa villkor gäller för samtliga planer — Gratis, Pro, Företag och
            Enterprise — om inget annat skriftligen avtalats.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 3 Tjänstens omfattning</h2>
          <p>
            Kvittino är en webbaserad SaaS-tjänst (Software as a Service) för
            skanning och hantering av kvitton, körjournalföring, utläggsattest,
            kollektivtrafikregistrering och fakturahantering — anpassad för
            svenska momssatser (6/12/25&nbsp;%), BAS-kontoplanen och
            Bokföringslagens krav.
          </p>
          <p>
            Vi strävar efter hög tillgänglighet men garanterar inte avbrottsfri
            drift. Planerat underhåll och oplanerade driftstörningar kan förekomma.
            Tjänsten tillhandahålls i befintligt skick (&ldquo;as-is&rdquo;).
          </p>
          <p>
            AI-genererade värden — t.ex. OCR-utläsning av leverantör, belopp och
            momssats — är hjälpmedel och inte juridiskt bindande underlag. Du ansvarar
            alltid för att kontrollera och godkänna uppgifter innan de sparas eller
            exporteras.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 4 Konton och åtkomst</h2>
          <p>
            Du ansvarar för att hålla dina inloggningsuppgifter konfidentiella och
            för all aktivitet som sker via ditt konto. Dela inte ditt lösenord med
            obehöriga.
          </p>
          <p>
            Vi förbehåller oss rätten att stänga av eller radera konton som (i) bryter
            mot dessa villkor, (ii) används för olagliga ändamål, eller (iii) misstänks
            ha komprometterats — med omedelbar verkan och utan föregående varsel om
            säkerheten kräver det.
          </p>
          <p>
            Du måste vara minst 18 år och ha rättslig handlingsförmåga för att
            ingå detta avtal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 5 Prenumeration och betalning</h2>
          <p>
            Betalda abonnemang debiteras månadsvis i förskott i SEK. Betalning hanteras
            av <strong>Stripe, Inc.</strong> Kvittino lagrar inga kortuppgifter.
          </p>
          <p>
            Prenumerationen förnyas automatiskt tills du avslutar den. Avslutning
            sker från dina kontoinställningar och träder i kraft vid innevarande
            faktureringsperiods slut — du behåller tillgång till betalda funktioner
            fram till dess.
          </p>
          <p>
            Vi förbehåller oss rätten att ändra priser med minst 30 dagars skriftlig
            varsel via e-post. Om du inte godkänner prisändringen kan du avsluta
            prenumerationen utan extra kostnad innan ändringen träder i kraft.
          </p>
          <p>
            Återbetalning sker inte för redan fakturerade perioder, utom i fall där
            lag kräver det (se § 6 om ångerrätt).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 6 Ångerrätt (konsumenter)</h2>
          <p>
            Om du är konsument (dvs. en fysisk person som handlar utanför sin
            yrkesmässiga verksamhet) har du rätt att frånträda detta avtal inom
            <strong> 14 dagar</strong> från avtalets ingående, utan att ange skäl,
            i enlighet med lag (2005:59) om distansavtal och avtal utanför
            affärslokaler.
          </p>
          <p>
            Ångerrätten upphör om du uttryckligen begärt att tjänsten ska påbörjas
            omedelbart och du är medveten om att ångerrätten därigenom förfaller när
            tjänsten är fullgjord. Om tjänsten delvis utförts har vi rätt att ta betalt
            för den del som levererats.
          </p>
          <p>
            För att utöva ångerrätten kontaktar du oss på{" "}
            <a className="underline underline-offset-2" href="mailto:legal@utlagg.se">
              legal@utlagg.se
            </a>{" "}
            med ditt namn, e-post och ett tydligt meddelande om att du frånträder avtalet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 7 Lagring av bokföringsunderlag</h2>
          <p>
            Bokföringslagen (SFS 1999:1078) ålägger företag att bevara
            räkenskapsinformation i <strong>sju (7) år</strong>. Kvittino lagrar dina
            kvitton och underlag under hela din aktiva prenumeration och i upp till
            <strong> ett (1) år</strong> efter din senaste betalning.
          </p>
          <p>
            Det är <em>ditt</em> ansvar som bokföringsskyldig att uppfylla
            arkiveringsskyldigheten. Om du avslutar ditt konto rekommenderar vi starkt
            att du exporterar samtliga underlag via vår SIE-, CSV- eller PDF-export
            <em> innan</em> kontot raderas.
          </p>
          <p>
            Kvittino kan inte hållas ansvarigt för förlust av bokföringsunderlag till
            följd av att du avslutat prenumerationen eller kontot.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 8 Dina uppgifter och äganderätt</h2>
          <p>
            Du äger all data du laddar upp till Kvittino — kvitton, fakturor, reseuppgifter
            och övriga dokument. Vi gör inte anspråk på äganderätt till ditt innehåll.
          </p>
          <p>
            Du ger oss en begränsad, icke-exklusiv licens att behandla dina uppgifter
            uteslutande i syfte att tillhandahålla, driva och förbättra tjänsten. Vi kan
            använda anonymiserade och aggregerade uppgifter — som aldrig kan kopplas till
            dig — för att förbättra vår AI-modell och statistik.
          </p>
          <p>
            Vi delar aldrig dina personuppgifter med tredje part i marknadsföringssyfte.
            Se vår{" "}
            <Link className="underline underline-offset-2" href="/legal/privacy">
              integritetspolicy
            </Link>{" "}
            för fullständig information om hur vi behandlar personuppgifter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 9 Immateriella rättigheter</h2>
          <p>
            Kvittino-plattformen — inklusive programvara, design, grafik, varumärken och
            affärslogik — ägs av GlorifyTC och skyddas av upphovsrätt och andra
            immaterialrättsliga lagar.
          </p>
          <p>
            Du får inte kopiera, modifiera, distribuera, sälja eller utföra reverse
            engineering av tjänsten eller något av dess komponenter, vare sig helt
            eller delvis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 10 Förbjuden användning</h2>
          <p>Det är förbjudet att använda Kvittino för att:</p>
          <ul className="ml-4 list-disc space-y-1 text-ink/80">
            <li>lagra, ladda upp eller skapa falska, förfalskade eller missvisande bokföringsunderlag,</li>
            <li>tvätta pengar eller finansiera olaglig verksamhet,</li>
            <li>skicka spam, skadlig kod eller störa tjänstens infrastruktur,</li>
            <li>kringgå säkerhetsfunktioner eller åtkomstbegränsningar,</li>
            <li>bryta mot tillämplig lag — däribland GDPR, bokföringsrätt och skattelagstiftning.</li>
          </ul>
          <p>
            Överträdelse kan leda till omedelbar kontostängning och kan anmälas till
            berörda myndigheter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 11 Personuppgiftsbehandling</h2>
          <p>
            Vår behandling av personuppgifter styrs av{" "}
            <Link className="underline underline-offset-2" href="/legal/privacy">
              integritetspolicyn
            </Link>{" "}
            och, för företagskunder,{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              personuppgiftsbiträdesavtalet (DPA)
            </Link>
            . Kvittino agerar som personuppgiftsbiträde för de personuppgifter du
            behandlar via tjänsten och som personuppgiftsansvarig för kontorelaterade
            uppgifter.
          </p>
          <p>
            En lista över anlitade underbiträden finns på{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            . Uppgifter lagras i Sverige och behandlas inom EU/EES.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 12 Ansvarsbegränsning</h2>
          <p>
            Kvittino tillhandahålls &ldquo;i befintligt skick&rdquo;. Vi lämnar inga
            garantier — uttryckliga eller underförstådda — om tjänstens lämplighet
            för ett visst ändamål, avbrottsfrihet eller frihet från fel.
          </p>
          <p>
            Vår totala ansvarsskyldighet gentemot dig under ett kalenderår är begränsad
            till det sammanlagda belopp du faktiskt betalat för tjänsten under de
            tre månader som föregick den händelse som ger upphov till anspråket,
            dock minst 100 SEK.
          </p>
          <p>
            Vi ansvarar inte för indirekta skador, utebliven vinst, inkomstbortfall,
            dataförlust eller följdskador av något slag — oavsett om vi informerats om
            risken för sådana skador.
          </p>
          <p className="text-ink/60">
            Ingenting i dessa villkor utesluter eller begränsar ansvar som inte kan
            avtalas bort enligt tvingande lag (t.ex. personskada orsakad av grov
            vårdslöshet eller uppsåt).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 13 Ändringar av villkoren</h2>
          <p>
            Vi kan när som helst ändra dessa villkor. Vid väsentliga ändringar
            skickar vi ett meddelande till den e-postadress du registrerat, med minst
            <strong> 30 dagars</strong> varsel innan ändringen träder i kraft.
          </p>
          <p>
            Fortsatt användning av tjänsten efter att ändringen trätt i kraft utgör
            ditt godkännande av de uppdaterade villkoren. Om du inte godkänner en
            väsentlig ändring kan du avsluta ditt konto och din prenumeration utan
            extra kostnad före ändringsdatumet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 14 Avtalets löptid och upphörande</h2>
          <p>
            Avtalet gäller tills vidare och kan avslutas av båda parter när som helst.
            Du kan avsluta ditt konto via profilinställningarna. Vi kan säga upp avtalet
            med 30 dagars varsel, eller med omedelbar verkan vid allvarlig överträdelse
            av dessa villkor.
          </p>
          <p>
            Vid avslutning upphör din rätt att använda tjänsten. Bestämmelserna om
            ansvarsbegränsning, immateriella rättigheter, datalagring och tvistlösning
            gäller även efter avtalets upphörande.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 15 Tillämplig lag och tvister</h2>
          <p>
            Dessa villkor regleras av och tolkas i enlighet med <strong>svensk rätt</strong>,
            utan hänsynstagande till dess lagvalsregler.
          </p>
          <p>
            Tvister ska i första hand lösas genom förhandling mellan parterna. Om
            förhandling inte leder till lösning inom 30 dagar kan tvisten hänskjutas
            till allmän domstol. Konsumenter har dessutom rätt att vända sig till{" "}
            <strong>Allmänna reklamationsnämnden (ARN)</strong>,{" "}
            <a
              className="underline underline-offset-2"
              href="https://www.arn.se"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.arn.se
            </a>
            , för alternativ tvistlösning.
          </p>
          <p>
            EU-kommissionens plattform för tvistlösning online (ODR) nås via{" "}
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
          <p>
            Stockholms tingsrätt är avtalad som första instans för tvister som inte
            löses på annat sätt.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 16 Övrigt</h2>
          <p>
            Om en bestämmelse i dessa villkor befinns ogiltig eller icke-verkställbar
            ska övriga bestämmelser förbli i full kraft. Den ogiltiga bestämmelsen
            ersätts med en giltig bestämmelse som så nära som möjligt återspeglar
            dess avsedda innebörd.
          </p>
          <p>
            Dessa villkor utgör det fullständiga avtalet mellan parterna avseende
            tjänstens användning och ersätter alla tidigare överenskommelser i
            samma ämne.
          </p>
        </section>

      </div>

      <p className="mt-10 text-xs text-ink/50">
        Kontakt: legal@utlagg.se · GlorifyTC · Org.nr [xxxxxx-xxxx]
      </p>
    </main>
  );
}
