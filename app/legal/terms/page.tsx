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
      <p className="mt-2 text-sm text-ink/50">Senast uppdaterad: 18 juli 2026</p>

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
            accepterar dessa villkor.
          </p>
          <p>
            Dessa villkor gäller för samtliga planer — Gratis, Pro, Företag och
            Enterprise — om inget annat skriftligen avtalats.
          </p>
          <p>
            Ändringar av villkoren hanteras enligt § 13. För konsumenter förutsätter
            väsentliga ändringar till din nackdel att du underrättas i förväg och ges
            möjlighet att säga upp avtalet utan kostnad innan ändringen träder i kraft.
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
            Tjänsten tillhandahålls i befintligt skick (&ldquo;as-is&rdquo;), med de
            begränsningar som följer av § 12.
          </p>
          <p>
            AI-genererade värden — t.ex. OCR-utläsning av leverantör, belopp och
            momssats — är hjälpmedel och utgör inte juridiskt bindande underlag. Du
            ansvarar alltid för att kontrollera och godkänna uppgifter innan de sparas
            eller exporteras. Vi fattar inte automatiserade beslut med rättslig verkan
            för dig (se integritetspolicyns avsnitt om automatiserat beslutsfattande).
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
            säkerheten kräver det. Vid avstängning eller uppsägning från vår sida gäller
            din rätt till export enligt § 14.
          </p>
          <p>
            Du måste vara minst 18 år och ha rättslig handlingsförmåga för att
            ingå detta avtal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 5 Prenumeration och betalning</h2>
          <p>
            Betalda abonnemang debiteras månadsvis i förskott i SEK. Priser till
            konsumenter anges inklusive moms. Betalning hanteras av{" "}
            <strong>Stripe, Inc.</strong> Kvittino lagrar inga kortuppgifter.
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
            tvingande lag kräver det (se § 6 om ångerrätt).
          </p>
          <p>
            <strong>Provperiod.</strong> Vi kan erbjuda en kostnadsfri provperiod om
            trettio (30) dagar. Om du inte säger upp prenumerationen före provperiodens
            slut övergår den automatiskt till en betald prenumeration enligt den plan och
            det pris du valt vid registreringen, och betalning dras då för den kommande
            perioden. Du kan när som helst under provperioden säga upp prenumerationen
            utan kostnad via dina kontoinställningar. Vi påminner dig via e-post innan den
            första betalningen dras.
          </p>
          <p>
            <strong>Provperioden får utnyttjas en (1) gång per användare.</strong> Rätten
            till provperiod bedöms per person, inte enbart per konto eller e-postadress.
            För att förhindra att provperioden utnyttjas upprepade gånger genom nya konton
            kan vi, efter att ett konto raderats, bevara en pseudonymiserad
            (envägskrypterad) token som härletts från din e-postadress; närmare
            information finns i integritetspolicyn. Vi förbehåller oss rätten att neka
            eller avsluta en provperiod vid misstanke om missbruk.
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
            Om du uttryckligen begär att tjänsten ska börja tillhandahållas under
            ångerfristen, och samtidigt bekräftar att du är medveten om att din
            ångerrätt går förlorad när tjänsten fullgjorts, förfaller ångerrätten när
            tjänsten är fullgjord. För en löpande prenumeration som du frånträder under
            fristen har vi rätt till betalning i proportion till vad som levererats
            fram till att du meddelar oss att du frånträder avtalet.
          </p>
          <p>
            För att utöva ångerrätten kan du använda Konsumentverkets standardformulär
            för ånger, som finns tillgängligt{" "}
            <Link className="underline underline-offset-2" href="/legal/angerblankett">
              här
            </Link>
            , eller kontakta oss på{" "}
            <a className="underline underline-offset-2" href="mailto:legal@kvittino.se">
              legal@kvittino.se
            </a>{" "}
            med ditt namn, din e-postadress och ett tydligt meddelande om att du
            frånträder avtalet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">
            § 7 Lagring, arkivering och radering av underlag
          </h2>
          <p>
            7.1 Bokföringslagen (1999:1078) ålägger den som är bokföringsskyldig att
            bevara räkenskapsinformation till och med utgången av det sjunde året efter
            det kalenderår då räkenskapsåret avslutades. Denna arkiveringsskyldighet
            åvilar dig i egenskap av bokföringsskyldig. Kvittino övertar inte, och ska
            inte anses ha övertagit, någon arkiveringsskyldighet enligt Bokföringslagen
            eller annan författning, om inte detta uttryckligen och skriftligen avtalats.
          </p>
          <p>
            7.2 Under avtalets löptid lagrar Kvittino dina kvitton, verifikationer och
            övriga underlag som en del av tjänsten. Om din betalda prenumeration upphör
            övergår kontot till läsläge, i vilket du under tolv (12) månader från den
            senaste betalda periodens utgång (&ldquo;Exportperioden&rdquo;) har fortsatt
            tillgång till samtliga underlag för granskning och export via tjänstens
            exportfunktioner (SIE, CSV, PDF). Under läsläget kan möjligheten att ladda
            upp nya underlag vara begränsad.
          </p>
          <p>
            7.3 Kvittino åtar sig att, innan underlag raderas enligt punkt 7.4, skicka
            skriftliga påminnelser till din registrerade e-postadress senast nittio
            (90), trettio (30) respektive sju (7) dagar före Exportperiodens utgång.
            Varje påminnelse ska ange det datum då radering sker samt hänvisa till
            exportfunktionerna.
          </p>
          <p>
            7.4 Efter Exportperiodens utgång raderas kvitton, verifikationer och därtill
            hörande bilder permanent inom trettio (30) dagar. Radering dokumenteras i
            Kvittinos loggar. Uppgifter som Kvittino är skyldigt att bevara enligt lag
            — däribland Kvittinos egen räkenskapsinformation avseende fakturering och
            betalningar — bevaras under den tid som följer av tillämplig lagstiftning.
          </p>
          <p>
            7.5 Det åligger dig att före Exportperiodens utgång exportera samtliga
            underlag som du är skyldig att bevara. Under förutsättning att Kvittino
            fullgjort sina åtaganden enligt punkterna 7.2–7.4 ansvarar Kvittino inte för
            förlust av räkenskapsinformation som raderats efter Exportperiodens utgång.
          </p>
          <p>
            7.6 För konton som omfattas av gratisplanen och som varit inaktiva under
            tolv (12) sammanhängande månader tillämpas motsvarande förfarande enligt
            punkterna 7.3–7.5, varvid Exportperioden räknas från den senaste
            inloggningen.
          </p>
          <p>
            <strong>7.7 Export i läsläge.</strong> När ditt konto övergår till läsläge
            — vare sig efter avslutad provperiod eller efter att en betald prenumeration
            upphört — behåller du full tillgång att granska och exportera dina underlag.
            En fullständig export i CSV-format samt nedladdning av dina ursprungliga
            kvitto- och fakturafiler är alltid tillgänglig, så att du kan fullgöra din
            arkiveringsskyldighet enligt Bokföringslagen. Vissa tilläggsfunktioner för
            export — däribland export i SIE- och SIE4-format samt direktintegrationer med
            bokföringsprogram — förutsätter dock en aktiv betald prenumeration.
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
            uteslutande i syfte att tillhandahålla, driva och säkerställa tjänsten. Med
            ditt uttryckliga samtycke kan vi dessutom använda markeringar från dina
            kvitton för att förbättra vår OCR-modell; sådana uppgifter avidentifieras
            innan de används för detta ändamål, och samtycket kan återkallas när som
            helst. Se vår{" "}
            <Link className="underline underline-offset-2" href="/legal/privacy">
              integritetspolicy
            </Link>{" "}
            för närmare information.
          </p>
          <p>
            Vi delar aldrig dina personuppgifter med tredje part i marknadsföringssyfte.
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
            eller delvis, utom i den utsträckning tvingande lag uttryckligen tillåter det.
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
            Överträdelse kan leda till omedelbar kontostängning enligt § 4 och kan
            anmälas till berörda myndigheter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 11 Ansvar för uppladdat innehåll</h2>
          <p>
            Du ansvarar för att innehåll som du laddar upp till tjänsten inte gör
            intrång i tredje mans rättigheter och att din behandling av tredje mans
            personuppgifter via tjänsten sker i enlighet med tillämplig
            dataskyddslagstiftning.
          </p>
          <p>
            Du åtar dig att hålla Kvittino skadeslöst från krav från tredje man —
            inklusive skäliga ombudskostnader — som grundas på innehåll du laddat upp
            eller på din användning av tjänsten i strid med dessa villkor eller
            tillämplig lag. Detta åtagande gäller inte i den utsträckning kravet
            orsakats av Kvittinos vårdslöshet, och gäller för konsumenter endast i den
            utsträckning det är förenligt med tvingande rätt.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 12 Personuppgiftsbehandling</h2>
          <p>
            Vår behandling av personuppgifter styrs av{" "}
            <Link className="underline underline-offset-2" href="/legal/privacy">
              integritetspolicyn
            </Link>{" "}
            och, för företagskunder,{" "}
            <Link className="underline underline-offset-2" href="/legal/dpa">
              personuppgiftsbiträdesavtalet (DPA)
            </Link>
            . Kvittino agerar som personuppgiftsansvarig för kontorelaterade uppgifter
            och som personuppgiftsbiträde för de personuppgifter du som företagskund
            behandlar om tredje man (t.ex. dina anställdas utlägg) via tjänsten.
          </p>
          <p>
            En lista över anlitade underbiträden finns på{" "}
            <Link className="underline underline-offset-2" href="/legal/subprocessors">
              /legal/subprocessors
            </Link>
            . Uppgifter lagras i Sverige och behandlas inom EU/EES, med de undantag för
            överföring till tredjeland som anges i integritetspolicyn.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 13 Ansvarsbegränsning</h2>
          <p>
            Kvittino tillhandahålls &ldquo;i befintligt skick&rdquo;. Vi lämnar inga
            garantier — uttryckliga eller underförstådda — om tjänstens lämplighet
            för ett visst ändamål, avbrottsfrihet eller frihet från fel, utöver vad som
            följer av tvingande lag.
          </p>
          <p>
            Vår totala ansvarsskyldighet gentemot dig under ett kalenderår är begränsad
            till det sammanlagda belopp du faktiskt betalat för tjänsten under de
            tre (3) månader som föregick den händelse som ger upphov till anspråket. För
            skada som består i förlust av data och som orsakats genom Kvittinos
            vårdslöshet är ansvaret dock begränsat till högst tiotusen (10&nbsp;000) SEK
            per kalenderår.
          </p>
          <p>
            Vi ansvarar inte för indirekta skador, utebliven vinst, inkomstbortfall
            eller följdskador av något slag — oavsett om vi informerats om risken för
            sådana skador.
          </p>
          <p>
            Ingenting i dessa villkor utesluter eller begränsar ansvar som inte kan
            avtalas bort enligt tvingande lag (t.ex. personskada orsakad av grov
            vårdslöshet eller uppsåt).
          </p>
          <p className="text-ink/60">
            Om du är konsument gäller begränsningarna i denna § 13 endast i den
            utsträckning de är förenliga med tvingande konsumentskyddande lagstiftning,
            däribland konsumenttjänst- och konsumentköprättsliga regler samt lag
            (1994:1512) om avtalsvillkor i konsumentförhållanden. Sådan lagstiftning kan
            ge dig rättigheter utöver vad som anges i dessa villkor, och ingenting i
            villkoren inskränker dessa rättigheter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 14 Force majeure</h2>
          <p>
            Part är befriad från påföljd för underlåtenhet att fullgöra förpliktelse
            enligt detta avtal om underlåtenheten beror på en omständighet utanför
            partens kontroll som parten inte skäligen kunde ha förutsett vid avtalets
            ingående och vars följder parten inte skäligen kunde ha undvikit eller
            övervunnit — såsom krig, myndighetsåtgärd, nytillkommen eller ändrad
            lagstiftning, arbetskonflikt, omfattande driftstörning hos underleverantör
            av infrastruktur, brand, översvämning eller olyckshändelse av större
            omfattning. Om avtalets fullgörande hindras under längre tid än tre (3)
            månader har vardera parten rätt att säga upp avtalet med omedelbar verkan.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 15 Ändringar av villkoren</h2>
          <p>
            Vi kan ändra dessa villkor. Vid väsentliga ändringar skickar vi ett
            meddelande till den e-postadress du registrerat, med minst
            <strong> 30 dagars</strong> varsel innan ändringen träder i kraft.
          </p>
          <p>
            För företagskunder utgör fortsatt användning av tjänsten efter att
            ändringen trätt i kraft ett godkännande av de uppdaterade villkoren. För
            konsumenter träder en väsentlig ändring till din nackdel i kraft först om du
            inte har sagt upp avtalet före ändringsdatumet; i annat fall kan du avsluta
            ditt konto och din prenumeration utan extra kostnad före ändringsdatumet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 16 Avtalets löptid och upphörande</h2>
          <p>
            Avtalet gäller tills vidare och kan avslutas av båda parter när som helst.
            Du kan avsluta ditt konto via profilinställningarna. Vi kan säga upp avtalet
            med 30 dagars varsel, eller med omedelbar verkan vid allvarlig överträdelse
            av dessa villkor.
          </p>
          <p>
            Om Kvittino säger upp avtalet, eller stänger av ett konto enligt § 4, ska
            Kvittino — utom där det är oförenligt med lag, myndighetsbeslut eller
            nödvändiga säkerhetsåtgärder — ge dig tillgång till kontot i läsläge under
            trettio (30) dagar för export av dina underlag. Vid misstanke om brott får
            Kvittino i stället bevara underlagen och lämna ut dem till behörig myndighet.
          </p>
          <p>
            Vid avslutning upphör din rätt att använda tjänsten. Bestämmelserna om
            ansvar för uppladdat innehåll, ansvarsbegränsning, immateriella rättigheter,
            datalagring och radering samt tvistlösning gäller även efter avtalets
            upphörande.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 17 Överlåtelse</h2>
          <p>
            Du får inte överlåta dina rättigheter eller skyldigheter enligt detta avtal
            utan vårt skriftliga medgivande. Kvittino får överlåta avtalet till annan
            juridisk person i samband med fusion, förvärv eller överlåtelse av hela eller
            väsentliga delar av verksamheten, förutsatt att förvärvaren övertar dessa
            villkor. Vi informerar dig om en sådan överlåtelse via e-post eller i
            tjänsten; om du är konsument har du rätt att säga upp avtalet utan kostnad om
            överlåtelsen är till din nackdel.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg">§ 18 Tillämplig lag och tvister</h2>
          <p>
            Dessa villkor regleras av och tolkas i enlighet med <strong>svensk rätt</strong>,
            utan hänsynstagande till dess lagvalsregler.
          </p>
          <p>
            Tvister ska i första hand lösas genom förhandling mellan parterna. För
            tvister med näringsidkare är Stockholms tingsrätt avtalad som exklusivt forum
            i första instans. För konsumenter gäller detta forumval endast i den
            utsträckning det är förenligt med tvingande rätt; en konsument har alltid
            rätt att väcka talan vid domstolen på sin hemort.
          </p>
          <p>
            Konsumenter har dessutom rätt att vända sig till{" "}
            <strong>Allmänna reklamationsnämnden (ARN)</strong>,{" "}
            <a
              className="underline underline-offset-2"
              href="https://www.arn.se"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.arn.se
            </a>
            , för alternativ tvistlösning. EU-kommissionens plattform för tvistlösning
            online (ODR) nås via{" "}
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
          <h2 className="font-display text-lg">§ 19 Övrigt</h2>
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
        Kontakt: legal@kvittino.se · GlorifyTC · Org.nr [xxxxxx-xxxx]
      </p>
    </main>
  );
}
