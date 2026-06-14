// lib/translations.ts
export type Lang = "sv" | "en";

export interface Translations {
  // Navigation
  features: string;
  pricing: string;
  login: string;
  startFree: string;

  // Hero
  heroTagline: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescription: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroDisclaimer: string;
  loading3D: string;

  // Features
  featuresHeadline: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  feature3Title: string;
  feature3Body: string;
  feature4Title: string;
  feature4Body: string;
  feature5Title: string;
  feature5Body: string;
  feature6Title: string;
  feature6Body: string;

  // Pricing
  pricingTagline: string;
  pricingTitle: string;
  pricingPopular: string;
  pricingContactUs: string;
  pricingLoading: string;
  pricingChoosePlan: string;

  // Plan names
  planFree: string;
  planPro: string;
  planBusiness: string;
  planEnterprise: string;

  // Plan features
  planFreeFeatures: string[];
  planProFeatures: string[];
  planBusinessFeatures: string[];
  planEnterpriseFeatures: string[];

  // Footer
  footerTitle: string;
  footerDescription: string;
  footerGDPR: string;
  footerAudit: string;
  footerBankID: string;
  footerCopyright: string;
  footerDisclaimer: string;
  // Dashboard navigation
  navOverview: string;
  navReceipts: string;
  navMileage: string;
  navApprovals: string;
  navIntegrations: string;
  navSubscription: string;
  navStats: string;
  navInvoices: string;
  navCompany: string;
  navSettings: string;
  navProfile: string;
  navLogout: string;
  langName: string;
  // Dashboard overview
  dashWelcome: string;
  dashPremiumEndedTitle: string;
  dashPremiumEndedBody: string;
  dashChoosePlan: string;
  // Receipts page
  receiptsSubtitle: string;
  receiptNewTitle: string;
  receiptDragDrop: string;
  receiptChooseImage: string;
  receiptTakePhoto: string;
  receiptCameraHint: string;
  receiptSearch: string;
  receiptExportCsv: string;
  receiptFrom: string;
  receiptTo: string;
  receiptExport: string;
  receiptNone: string;
  receiptLoading: string;
  colDate: string;
  colVendor: string;
  colBas: string;
  colVat: string;
  colAmount: string;
  colStatus: string;
  statusPending: string;
  statusApproved: string;
  statusRejected: string;
  scansThisMonth: string;
  unlimited: string;
  receiptCancel: string;
  receiptApprove: string;
  receiptDelete: string;
  receiptDeleteConfirm: string;
  colActions: string;
  idleTitle: string;
  idleStay: string;
  idleLogout: string;
  statTotalReceipts: string;
  statThisMonth: string;
  statTotalAmount: string;
  statUsage: string;
  recentTitle: string;
  recentDesc: string;
  noReceiptsYet: string;
  uploadFirst: string;
  unknownVendor: string;
  usageUnlimitedPlan: string;
  usageOf: string;
  usageUsedWord: string;
  usagePercentUsed: string;
  subCurrentPlan: string;
  subYouAreOnPre: string;
  subYouAreOnPost: string;
  subRenews: string;
  subCancel: string;
  subCurrentBadge: string;
  subSwitchTo: string;
  subRequestQuote: string;
  planQuote: string;
  cancelTitle: string;
  cancelIntro: string;
  cancelBullet1Pre: string;
  cancelBullet1Strong: string;
  cancelBullet1Post: string;
  cancelBullet2Pre: string;
  cancelBullet2Strong: string;
  cancelBullet2Post: string;
  cancelBullet3Pre: string;
  cancelBullet3Strong: string;
  cancelBullet3Post: string;
  cancelAccept: string;
  cancelAbort: string;
  cancelConfirm: string;
  toastCheckoutFail: string;
  toastNetwork: string;
  toastCancelScheduled: string;
  toastCancelFail: string;
  toastQuoteThanks: string;
  featUnlimitedScans: string;
  feat25Scans: string;
  featBasicOcr: string;
  featCsv: string;
  featFortnox: string;
  featSwedishVat: string;
  featAuditLog: string;
  featAllPro: string;
  featApprovals: string;
  featMileage: string;
  featCarbon: string;
  featAllBusiness: string;
  intFortnoxDesc: string;
  intWaitingSync: string;
  intUpsellTitle: string;
  intUpsellDesc: string;
  intNote: string;
  fortnoxConnect: string;
  fortnoxConnected: string;
  fortnoxSyncing: string;
  fortnoxSyncNow: string;
  fortnoxDisconnect: string;
  fortnoxDisconnectConfirm: string;
  fortnoxDisconnected: string;
  fortnoxDisconnectFail: string;
  fortnoxSyncFail: string;
  subManageDesc: string;
  featuresPageSubtitle: string;
  featuresCompareTitle: string;
  featuresCompareCapability: string;
  featuresCompareUtlagg: string;
  featuresCompareTraditional: string;
  featuresCompareOcrLabel: string;
  featuresCompareOcrUtlagg: string;
  featuresCompareOcrTraditional: string;
  featuresCompareBasLabel: string;
  featuresCompareBasUtlagg: string;
  featuresCompareBasTraditional: string;
  featuresCompareVatLabel: string;
  featuresCompareVatUtlagg: string;
  featuresCompareVatTraditional: string;
  featuresCompareBankidLabel: string;
  featuresCompareBankidUtlagg: string;
  featuresCompareBankidTraditional: string;
  featuresCompareDataLabel: string;
  featuresCompareDataUtlagg: string;
  featuresCompareDataTraditional: string;
  featuresCtaTitle: string;
  featuresCtaBody: string;
  pricingPageSubtitle: string;
  pricingComparisonTitle: string;
  pricingFaqTitle: string;
  pricingBottomTitle: string;
  pricingBottomSubtitle: string;
  pricingCalloutSubtitle: string;
  pricingFaq1Q: string;
  pricingFaq1A: string;
  pricingFaq2Q: string;
  pricingFaq2A: string;
  pricingFaq3Q: string;
  pricingFaq3A: string;
  pricingFaq4Q: string;
  pricingFaq4A: string;
  pricingTableReceipts: string;
  pricingTableMembers: string;
  pricingTableOcr: string;
  pricingTableBas: string;
  pricingTableCurrency: string;
  pricingTableSie4: string;
  pricingTableSync: string;
  pricingTableBankid: string;
  pricingTableRoles: string;
  pricingTableLimits: string;
  pricingTableOnboarding: string;
  pricingTableSupport: string;
  btnAddRow: string;
  btnToCompanies: string;
  btnNewInvoice: string;
  btnView: string;
  btnDeleteAccount: string;
  btnSubmitApproval: string;
  btnHistory: string;
  btnApprove: string;
  btnReject: string;
  btnExportCsv: string;
  btnExportPdf: string;
  btnExportSie: string;
  btnConnectFortnox: string;
  btnCreateCompany: string;
  btnDelete: string;
  btnInviteColleague: string;
  btnSendInvite: string;
  btnLightMode: string;
  btnDarkMode: string;
  btnSave: string;
  btnSaveTrip: string;
  btnCancel: string;
  btnSaveInvoice: string;
  btnDeleteAccountPermanent: string;
  stSaving: string;
  stSubmitting: string;
  setAppearance: string;
  setAppearanceDesc: string;
  setSwitchToLight: string;
  setSwitchToDark: string;
  setCompanyDesc: string;
  fldCompanyName: string;
  phCompany: string;
  setExportTitle: string;
  setExportDesc: string;
  setSkvTitle: string;
  setSkvDesc: string;
  toastCompanySaved: string;
  toastSaveFail: string;
  toastEnterCompanyName: string;
  toastCompanyCreated: string;
  toastCreateFail: string;
  toastEnterEmail: string;
  toastInviteSent: string;
  toastInviteFail: string;
  toastRoleUpdated: string;
  toastUpdateFail: string;
  confirmRemoveMember: string;
  toastRemoved: string;
  toastRemoveFail: string;
  loading: string;
  coCreateDesc: string;
  fldOrgNumber: string;
  fldVatNumber: string;
  coMembers: string;
  coYourRole: string;
  roleMember: string;
  roleApprover: string;
  roleAdmin: string;
  coInviteDesc: string;
  fldEmail: string;
  fldRole: string;
  invUpsellTitle: string;
  invUpsellDesc: string;
  invNeedCompanyTitle: string;
  invNeedCompanyDesc: string;
  invNoneYet: string;
  invColNr: string;
  invColCustomer: string;
  invColDate: string;
  invColAmount: string;
  invColVat: string;
  invReverse: string;
  invDisclaimer: string;
  toastFillCustomerRows: string;
  toastReverseNeedsVat: string;
  toastInvoiceSaved: string;
  invCustomer: string;
  fldInvoiceNumber: string;
  phAutoNumber: string;
  fldCustomerName: string;
  fldOrgNumberShort: string;
  fldVatNumberShort: string;
  fldAddress: string;
  fldIssueDate: string;
  fldDueDate: string;
  invLines: string;
  invLinesDesc: string;
  phDescription: string;
  phQuantity: string;
  phUnitPrice: string;
  ariaRemoveRow: string;
  invReversePre: string;
  invReversePost: string;
  invSubtotal: string;
  invVatReverse: string;
  invToPay: string;
  toastFillAddresses: string;
  toastTripSaved: string;
  milUpsellDesc: string;
  milRatePre: string;
  milRateNote: string;
  milNewTrip: string;
  milNewTripDesc: string;
  fldFrom: string;
  fldTo: string;
  phStartAddress: string;
  phEndAddress: string;
  fldDistance: string;
  fldDate: string;
  fldPurpose: string;
  purposeBusiness: string;
  purposePrivate: string;
  fldAmount: string;
  milLog: string;
  milNoneYet: string;
  milKm: string;
  purposeBusinessShort: string;
  milManualNote: string;
  promptComment: string;
  promptReason: string;
  toastApproved: string;
  toastRejected: string;
  toastDecisionFail: string;
  apWaiting: string;
  apWaitingDesc: string;
  apNoneWaiting: string;
  toastSelectReceiptApprover: string;
  toastSubmitted: string;
  toastSubmitFail: string;
  apUpsellTitle: string;
  apUpsellDesc: string;
  apRequest: string;
  apRequestDesc: string;
  fldReceipt: string;
  phSelectReceipt: string;
  unknownShort: string;
  fldApproverEmail: string;
  fldComment: string;
  phOptional: string;
  apSubmitNote: string;
  toastNameUpdated: string;
  toastNameUpdateFail: string;
  toastPwMismatch: string;
  toastPwChanged: string;
  toastPwChangeFail: string;
  toastAccountDeleted: string;
  toastAccountDeleteFail: string;
  prTitle: string;
  prNameTitle: string;
  prNameDesc: string;
  fldName: string;
  prEmailLabel: string;
  btnSaveChanges: string;
  prChangePw: string;
  prPwDesc: string;
  fldCurrentPw: string;
  fldNewPw: string;
  fldConfirmPw: string;
  btnChangePw: string;
  prDeleteDesc: string;
  prSureTitle: string;
  prSureDesc: string;
  prConfirmDelete: string;
  stSubtitle: string;
  stTotalVat: string;
  stPerMonth: string;
  stLastSixMonths: string;
  stNoData: string;
  invOrgNr: string;
  invVatNr: string;
  invInvoiceWord: string;
  invNrLabel: string;
  invDateLabel: string;
  invDueLabel: string;
  invBillTo: string;
  invViewDisclaimer: string;
  apHistoryTitle: string;
  apHistoryDesc: string;
  apNoneYet: string;
  about: string;
  contact: string;
  navMenu: string;
  navClose: string;
  howKicker: string;
  howTitle: string;
  howStep1Title: string;
  howStep1Body: string;
  howStep2Title: string;
  howStep2Body: string;
  howStep3Title: string;
  howStep3Body: string;
  footerProduct: string;
  footerCompany: string;
  footerLegal: string;
  footerTerms: string;
  footerPrivacy: string;
  aboutKicker: string;
  aboutTitle: string;
  aboutLead: string;
  aboutStoryTitle: string;
  aboutStoryBody: string;
  aboutValuesTitle: string;
  aboutVal1Title: string;
  aboutVal1Body: string;
  aboutVal2Title: string;
  aboutVal2Body: string;
  aboutVal3Title: string;
  aboutVal3Body: string;
  aboutStatsTitle: string;
  aboutStat1Val: string;
  aboutStat1Label: string;
  aboutStat2Val: string;
  aboutStat2Label: string;
  aboutStat3Val: string;
  aboutStat3Label: string;
  aboutCtaTitle: string;
  aboutCtaBody: string;
  contactKicker: string;
  contactTitle: string;
  contactLead: string;
  contactEmailLabel: string;
  contactSalesLabel: string;
  contactResponseLabel: string;
  contactResponseValue: string;
  contactFormTitle: string;
  contactFormDesc: string;
  contactName: string;
  contactEmailField: string;
  contactMessage: string;
  contactMessagePh: string;
  contactSend: string;
  contactSubject: string;
  annTitle: string;
  annDesc: string;
  annHint: string;
  annReading: string;
  annReadFail: string;
  annSaved: string;
  annFieldReceiptNo: string;
  annFieldVat: string;
  annFieldTotal: string;
  annFieldDate: string;
  annFieldVendor: string;
  annFieldVatRate: string;
}

export const strings: Record<Lang, Translations> = {
  sv: {
    annFieldVatRate: "Momssats",
    annTitle: "Fel värde? Peka på kvittot",
    annDesc: "Välj ett fält och dra en ruta över värdet på bilden. AI:n läser just det området — och vi sparar din markering för att träna modellen på svenska kvitton.",
    annHint: "Dra en ruta över värdet på bilden",
    annReading: "Läser området…",
    annReadFail: "Kunde inte läsa området",
    annSaved: "Inläst och sparat för träning",
    annFieldReceiptNo: "Fakturanr",
    annFieldVat: "Moms",
    annFieldTotal: "Belopp",
    annFieldDate: "Datum",
    annFieldVendor: "Leverantör",
    about: "Om oss",
    contact: "Kontakt",
    navMenu: "Meny",
    navClose: "Stäng",
    howKicker: "Så fungerar det",
    howTitle: "Från kvitto till bokföring på sekunder",
    howStep1Title: "Skanna",
    howStep1Body: "Fota kvittot eller ladda upp en bild. AI:n läser leverantör, datum, moms och belopp åt dig.",
    howStep2Title: "Granska",
    howStep2Body: "Kontrollera de ifyllda fälten och välj BAS-konto. Allt är redigerbart innan du sparar.",
    howStep3Title: "Exportera",
    howStep3Body: "Exportera till SIE, CSV eller Fortnox — redo för din bokföring och Skatteverket.",
    footerProduct: "Produkt",
    footerCompany: "Företag",
    footerLegal: "Juridik",
    footerTerms: "Villkor",
    footerPrivacy: "Integritetspolicy",
    aboutKicker: "Om Utlagg",
    aboutTitle: "Byggt i Sverige, för svenska regler.",
    aboutLead: "Utlagg gör kvittohantering och utlägg enkelt för svenska företag — med moms, BAS-konton och Skatteverket inbyggt från start, inte påklistrat i efterhand.",
    aboutStoryTitle: "Varför vi byggde Utlagg",
    aboutStoryBody: "De flesta utläggsverktyg är byggda för en internationell marknad och känner inte till svensk moms, omvänd byggskattskyldighet eller Bokföringslagens sjuåriga arkiveringskrav. Vi tröttnade på att rätta samma fel manuellt varje månad. Utlagg läser kvittot, fyller i rätt momssats och BAS-konto, och sparar underlaget i sju år — så att bokföringen stämmer redan från början.",
    aboutValuesTitle: "Vad vi står för",
    aboutVal1Title: "Regelverk först",
    aboutVal1Body: "Svensk moms, BAS-kontoplan och Bokföringslagen är inte tillval — de är grunden produkten är byggd på.",
    aboutVal2Title: "Inga överraskningar",
    aboutVal2Body: "Tydlig prissättning, ingen bindningstid och din data är din. Du kan exportera allt och säga upp när du vill.",
    aboutVal3Title: "Integritet på riktigt",
    aboutVal3Body: "GDPR-säker hantering, kryptering och BankID-inloggning. Dina kvitton lämnar aldrig din kontroll i onödan.",
    aboutStatsTitle: "Byggt för svensk bokföring",
    aboutStat1Val: "6/12/25 %",
    aboutStat1Label: "Svenska momssatser, datumstyrda",
    aboutStat2Val: "2,50 kr/km",
    aboutStat2Label: "Skattefri milersättning",
    aboutStat3Val: "7 år",
    aboutStat3Label: "Arkiv enligt Bokföringslagen",
    aboutCtaTitle: "Redo att förenkla era utlägg?",
    aboutCtaBody: "Kom igång gratis på några minuter. Inget kort krävs.",
    contactKicker: "Kontakt",
    contactTitle: "Hör av dig.",
    contactLead: "Frågor om produkten, priser eller din bokföring? Vi svarar normalt inom en arbetsdag.",
    contactEmailLabel: "E-post",
    contactSalesLabel: "Försäljning & offert",
    contactResponseLabel: "Svarstid",
    contactResponseValue: "Inom 1 arbetsdag",
    contactFormTitle: "Skicka ett meddelande",
    contactFormDesc: "Fyll i formuläret så öppnas ditt e-postprogram med meddelandet förifyllt.",
    contactName: "Namn",
    contactEmailField: "Din e-post",
    contactMessage: "Meddelande",
    contactMessagePh: "Hur kan vi hjälpa till?",
    contactSend: "Skicka meddelande",
    contactSubject: "Förfrågan via utlagg.se",
    invOrgNr: "Org.nr:",
    invVatNr: "Momsnr:",
    invInvoiceWord: "FAKTURA",
    invNrLabel: "Nr:",
    invDateLabel: "Datum:",
    invDueLabel: "Förfaller:",
    invBillTo: "Faktureras till",
    invViewDisclaimer: "Mallen tillhandahålls av Utlagg. Du ansvarar själv för fakturans innehåll och korrekthet.",
    apHistoryTitle: "Attesthistorik",
    apHistoryDesc: "Dina skickade förfrågningar",
    apNoneYet: "Inga förfrågningar ännu.",
    toastNameUpdated: "Namn uppdaterat",
    toastNameUpdateFail: "Kunde inte uppdatera namn",
    toastPwMismatch: "Lösenorden matchar inte",
    toastPwChanged: "Lösenord ändrat",
    toastPwChangeFail: "Kunde inte ändra lösenord",
    toastAccountDeleted: "Konto raderat",
    toastAccountDeleteFail: "Kunde inte radera konto",
    prTitle: "Profilinställningar",
    prNameTitle: "Namn",
    prNameDesc: "Ditt namn visas på kvitton och fakturor",
    fldName: "Namn",
    prEmailLabel: "E-post:",
    btnSaveChanges: "Spara ändringar",
    prChangePw: "Byt lösenord",
    prPwDesc: "Använd ett starkt lösenord (minst 8 tecken)",
    fldCurrentPw: "Nuvarande lösenord",
    fldNewPw: "Nytt lösenord",
    fldConfirmPw: "Bekräfta nytt lösenord",
    btnChangePw: "Byt lösenord",
    prDeleteDesc: "När du raderar ditt konto försvinner dina kvitton och data permanent.",
    prSureTitle: "Är du helt säker?",
    prSureDesc: "Detta går inte att ångra. Alla dina kvitton och inställningar raderas permanent.",
    prConfirmDelete: "Ja, radera mitt konto",
    stSubtitle: "Översikt över dina kvitton och moms",
    stTotalVat: "Total moms",
    stPerMonth: "Kvitton per månad",
    stLastSixMonths: "Senaste sex månaderna",
    stNoData: "Ingen data ännu.",
    toastFillAddresses: "Fyll i adresser och sträcka",
    toastTripSaved: "Resa sparad",
    milUpsellDesc: "Registrera resor och få skattefri milersättning (2,50 kr/km) automatiskt uträknad. Ingår i Företag-planen.",
    milRatePre: "Skattefri sats för egen bil:",
    milRateNote: "(25 kr/mil, Skatteverket 2026)",
    milNewTrip: "Ny resa",
    milNewTripDesc: "Ange sträckan i kilometer. Belopp beräknas automatiskt.",
    fldFrom: "Från",
    fldTo: "Till",
    phStartAddress: "Startadress",
    phEndAddress: "Slutadress",
    fldDistance: "Sträcka (km)",
    fldDate: "Datum",
    fldPurpose: "Syfte",
    purposeBusiness: "Tjänsteresa",
    purposePrivate: "Privat",
    fldAmount: "Belopp",
    milLog: "Körjournal",
    milNoneYet: "Inga resor ännu.",
    milKm: "km",
    purposeBusinessShort: "Tjänst",
    milManualNote: "Sträckan anges manuellt. Automatisk avståndsberäkning (Google Maps/OpenRouteService) kan kopplas in med en API-nyckel — den är inte aktiverad här.",
    promptComment: "Kommentar (valfritt):",
    promptReason: "Skäl till avslag:",
    toastApproved: "Godkänd",
    toastRejected: "Avslagen",
    toastDecisionFail: "Kunde inte spara beslut",
    apWaiting: "Väntar på ditt godkännande",
    apWaitingDesc: "Förfrågningar adresserade till din e-post",
    apNoneWaiting: "Inga väntande förfrågningar.",
    toastSelectReceiptApprover: "Välj kvitto och attestant",
    toastSubmitted: "Skickad för attest",
    toastSubmitFail: "Kunde inte skicka",
    apUpsellTitle: "Attestflöden",
    apUpsellDesc: "Skicka utlägg för godkännande och hantera attestkedjor. Ingår i Företag-planen.",
    apRequest: "Förfrågan",
    apRequestDesc: "Välj ett kvitto och vem som ska godkänna",
    fldReceipt: "Kvitto",
    phSelectReceipt: "Välj kvitto…",
    unknownShort: "Okänd",
    fldApproverEmail: "Attestantens e-post",
    fldComment: "Kommentar",
    phOptional: "Valfritt",
    apSubmitNote: "Attestanten ser förfrågan när hen loggar in med ett konto som har den e-postadressen.",
    setAppearance: "Utseende",
    setAppearanceDesc: "Välj ljust eller mörkt läge",
    setSwitchToLight: "Byt till ljust läge",
    setSwitchToDark: "Byt till mörkt läge",
    setCompanyDesc: "Visas på exporter och underlag",
    fldCompanyName: "Företagsnamn",
    phCompany: "Ditt företag AB",
    setExportTitle: "Export & integrationer",
    setExportDesc: "Ladda ner dina data eller koppla bokföring",
    setSkvTitle: "Skatteverket-export (PRO)",
    setSkvDesc: "Välj period och ladda ner alla kvitton med moms och BAS-konto",
    toastCompanySaved: "Företagsnamn sparat",
    toastSaveFail: "Kunde inte spara",
    toastEnterCompanyName: "Ange företagsnamn",
    toastCompanyCreated: "Företag skapat",
    toastCreateFail: "Kunde inte skapa",
    toastEnterEmail: "Ange e-post",
    toastInviteSent: "Inbjudan skickad",
    toastInviteFail: "Kunde inte bjuda in",
    toastRoleUpdated: "Roll uppdaterad",
    toastUpdateFail: "Kunde inte uppdatera",
    confirmRemoveMember: "Ta bort medlemmen?",
    toastRemoved: "Borttagen",
    toastRemoveFail: "Kunde inte ta bort",
    loading: "Laddar…",
    coCreateDesc: "Skapa ett företag för att bjuda in kollegor och dela utlägg.",
    fldOrgNumber: "Organisationsnummer",
    fldVatNumber: "Momsregistreringsnummer",
    coMembers: "Medlemmar",
    coYourRole: "Din roll:",
    roleMember: "Medlem",
    roleApprover: "Attestant",
    roleAdmin: "Admin",
    coInviteDesc: "Skickar en inbjudan via e-post (gäller 7 dagar).",
    fldEmail: "E-post",
    fldRole: "Roll",
    invUpsellTitle: "Fakturering",
    invUpsellDesc: "Skapa och skicka kundfakturor (inkl. omvänd byggmoms) till dina kunder. Ingår från Pro-planen.",
    invNeedCompanyTitle: "Skapa ett företag först",
    invNeedCompanyDesc: "Säljaruppgifterna (namn, organisationsnummer) på fakturan hämtas från ditt företag.",
    invNoneYet: "Inga fakturor ännu.",
    invColNr: "Nr",
    invColCustomer: "Kund",
    invColDate: "Datum",
    invColAmount: "Belopp",
    invColVat: "Moms",
    invReverse: "Omvänd",
    invDisclaimer: "Du ansvarar själv för att uppgifterna på fakturan är korrekta. Utlagg tillhandahåller mallen och sparar fakturan.",
    toastFillCustomerRows: "Fyll i kund och alla rader",
    toastReverseNeedsVat: "Vid omvänd skattskyldighet krävs köparens moms-/org.nummer",
    toastInvoiceSaved: "Faktura sparad",
    invCustomer: "Kund",
    fldInvoiceNumber: "Fakturanummer (valfritt)",
    phAutoNumber: "Lämna tomt för automatiskt nummer",
    fldCustomerName: "Kundnamn",
    fldOrgNumberShort: "Org.nummer",
    fldVatNumberShort: "Momsnummer",
    fldAddress: "Adress",
    fldIssueDate: "Fakturadatum",
    fldDueDate: "Förfallodatum",
    invLines: "Rader",
    invLinesDesc: "Pris anges exkl. moms.",
    phDescription: "Beskrivning",
    phQuantity: "Antal",
    phUnitPrice: "à-pris",
    ariaRemoveRow: "Ta bort rad",
    invReversePre: "Omvänd skattskyldighet (byggtjänster) — fakturan ställs ut utan moms och får texten",
    invReversePost: "Köparens moms-/org.nummer måste anges.",
    invSubtotal: "Summa exkl. moms",
    invVatReverse: "0,00 kr (omvänd)",
    invToPay: "Att betala",
    btnSaveInvoice: "Spara faktura",
    btnDeleteAccountPermanent: "Radera konto permanent",
    stSaving: "Sparar…",
    stSubmitting: "Skickar…",
    btnAddRow: "+ Lägg till rad",
    btnToCompanies: "Till företag",
    btnNewInvoice: "Ny faktura",
    btnView: "Visa",
    btnDeleteAccount: "Radera konto",
    btnSubmitApproval: "Skicka för attest",
    btnHistory: "Historik",
    btnApprove: "Godkänn",
    btnReject: "Avslå",
    btnExportCsv: "Exportera CSV",
    btnExportPdf: "Exportera PDF",
    btnExportSie: "Exportera SIE (bokföring)",
    btnConnectFortnox: "Koppla Fortnox",
    btnCreateCompany: "Skapa företag",
    btnDelete: "Ta bort",
    btnInviteColleague: "Bjud in kollega",
    btnSendInvite: "Skicka inbjudan",
    btnLightMode: "Ljust läge",
    btnDarkMode: "Mörkt läge",
    btnSave: "Spara",
    btnSaveTrip: "Spara resa",
    btnCancel: "Avbryt",
    subManageDesc: "Hantera din plan och fakturering",
    subCurrentPlan: "Nuvarande plan",
    subYouAreOnPre: "Du är på ",
    subYouAreOnPost: "-planen",
    subRenews: "förnyas",
    subCancel: "Avsluta prenumeration",
    subCurrentBadge: "Nuvarande",
    subSwitchTo: "Byt till",
    subRequestQuote: "Begär offert",
    planQuote: "Offert",
    planFree: "Gratis",
    planPro: "Pro",
    planBusiness: "Företag",
    planEnterprise: "Enterprise",
    cancelTitle: "Avsluta prenumeration?",
    cancelIntro: "Innan du avslutar, läs och godkänn följande:",
    cancelBullet1Pre: "Vi sparar dina kvitton och fakturor i ",
    cancelBullet1Strong: "1 år efter din senaste betalning",
    cancelBullet1Post: ". Därefter raderas de.",
    cancelBullet2Pre: "Du kan ",
    cancelBullet2Strong: "inte skanna nya kvitton",
    cancelBullet2Post: " utan en aktiv prenumeration.",
    cancelBullet3Pre: "Har du ett företag med anställda kan du behöva ",
    cancelBullet3Strong: "ta bort medlemmar",
    cancelBullet3Post: " om du går ner i plan.",
    cancelAccept: "Jag förstår och godkänner att min data raderas efter 1 år.",
    cancelAbort: "Avbryt",
    cancelConfirm: "Avsluta ändå",
    toastCheckoutFail: "Kunde inte starta betalning",
    toastNetwork: "Nätverksfel",
    toastCancelScheduled: "Prenumerationen avslutas vid periodens slut.",
    toastCancelFail: "Kunde inte avsluta prenumeration",
    toastQuoteThanks: "Tack! Vi hör av oss om en offert.",
    featUnlimitedScans: "Obegränsade skanningar",
    feat25Scans: "25 skanningar/mån",
    featBasicOcr: "Grundläggande OCR",
    featCsv: "CSV-export",
    featFortnox: "Fortnox-integration",
    featSwedishVat: "Svensk moms (6/12/25 %)",
    featAuditLog: "7-årig revisionslogg",
    featAllPro: "Allt i Pro",
    featApprovals: "Attestflöden",
    featMileage: "Milersättning",
    featCarbon: "Koldioxidavtryck",
    featAllBusiness: "Allt i Företag",
    intFortnoxDesc: "Bokför dina kvitton automatiskt som verifikationer i Fortnox.",
    intWaitingSync: "kvitton väntar på synk.",
    intUpsellTitle: "Fortnox-integration",
    intUpsellDesc: "Bokför kvitton automatiskt som verifikationer i Fortnox. Ingår från Pro-planen.",
    intNote: "Konteringen (vilka BAS-konton verifikationen bokförs på) bör stämmas av med din bokföringsbyrå innan du synkar skarpt.",
    fortnoxConnect: "Anslut till Fortnox",
    fortnoxConnected: "Ansluten",
    fortnoxSyncing: "Synkar…",
    fortnoxSyncNow: "Synka nu",
    fortnoxDisconnect: "Koppla bort",
    fortnoxDisconnectConfirm: "Koppla bort Fortnox?",
    fortnoxDisconnected: "Frånkopplad",
    fortnoxDisconnectFail: "Kunde inte koppla bort",
    fortnoxSyncFail: "Synk misslyckades",
    statTotalReceipts: "Kvitton totalt",
    statThisMonth: "Denna månad",
    statTotalAmount: "Totalt belopp",
    statUsage: "Förbrukning",
    recentTitle: "Senaste kvitton",
    recentDesc: "Dina fem senast tillagda kvitton",
    noReceiptsYet: "Inga kvitton ännu.",
    uploadFirst: "Ladda upp ditt första",
    unknownVendor: "Okänd leverantör",
    usageUnlimitedPlan: "Obegränsat i din plan",
    usageOf: "av",
    usageUsedWord: "använda",
    usagePercentUsed: "använt",
    idleTitle: "Du loggas snart ut",
    idleStay: "Stanna inloggad",
    idleLogout: "Logga ut nu",
    receiptApprove: "Godkänn",
    receiptDelete: "Ta bort",
    receiptDeleteConfirm: "Ta bort detta kvitto? Detta går inte att ångra.",
    colActions: "Åtgärder",
    receiptCancel: "Avbryt",
    receiptsSubtitle: "Ladda upp, granska och exportera",
    receiptNewTitle: "Nytt kvitto",
    receiptDragDrop: "Dra & släpp kvittot här, eller",
    receiptChooseImage: "Välj bild",
    receiptTakePhoto: "Ta foto",
    receiptCameraHint: "Ta foto öppnar kameran på mobilen.",
    receiptSearch: "Sök leverantör, BAS eller belopp",
    receiptExportCsv: "Exportera CSV",
    receiptFrom: "Från",
    receiptTo: "Till",
    receiptExport: "Exportera",
    receiptNone: "Inga kvitton ännu. Ladda upp ditt första ovan.",
    receiptLoading: "Laddar…",
    colDate: "Datum",
    colVendor: "Leverantör",
    colBas: "BAS",
    colVat: "Moms",
    colAmount: "Belopp",
    colStatus: "Status",
    statusPending: "Väntar",
    statusApproved: "Godkänd",
    statusRejected: "Nekad",
    scansThisMonth: "Skanningar denna månad",
    unlimited: "obegränsat",
    dashWelcome: "Välkommen tillbaka",
    dashPremiumEndedTitle: "Din premiumperiod har avslutats",
    dashPremiumEndedBody: "Välj ett paket för att fortsätta använda premiumfunktionerna.",
    dashChoosePlan: "Välj paket",
    navOverview: "Översikt",
    navReceipts: "Kvitton",
    navMileage: "Milersättning",
    navApprovals: "Attest",
    navIntegrations: "Integrationer",
    navSubscription: "Prenumeration",
    navStats: "Statistik",
    navInvoices: "Fakturor",
    navCompany: "Företag",
    navSettings: "Inställningar",
    navProfile: "Profil",
    navLogout: "Logga ut",
    langName: "Svenska",
    // Navigation
    features: "Funktioner",
    pricing: "Priser",
    login: "Logga in",
    startFree: "Starta gratis",

    // Hero
    heroTagline: "Kvittohantering · Sverige",
    heroTitleLine1: "Fota kvittot.",
    heroTitleLine2: "AI:n sköter resten.",
    heroDescription:
      "Skanna, bokför moms automatiskt och exportera till Skatteverket. Byggd för svenska regler — från BAS-konton till 7-årig revisionslogg.",
    heroCtaPrimary: "Starta gratis",
    heroCtaSecondary: "Se priser",
    heroDisclaimer: "25 skanningar/mån gratis · inget kort krävs",
    loading3D: "Laddar 3D…",

    // Features
    featuresHeadline: "Allt för svensk kvittohantering — på ett ställe.",
    feature1Title: "AI-skanning",
    feature1Body:
      "Fota kvittot — AI:n läser leverantör, datum, belopp och moms på sekunder.",
    feature2Title: "Svensk moms",
    feature2Body:
      "6/12/25 % hanteras automatiskt, inklusive den tillfälliga matmomsen 2026–2027.",
    feature3Title: "BAS-konton",
    feature3Body:
      "Sökbar BAS-kontoplan så varje utlägg hamnar på rätt konto direkt.",
    feature4Title: "7-årig revisionslogg",
    feature4Body:
      "Varje åtgärd loggas med tidsstämpel och IP enligt bokföringslagen.",
    feature5Title: "Export till Skatteverket",
    feature5Body:
      "Ladda ner som CSV eller PDF — redo för din revisor eller bokföring.",
    feature6Title: "BankID-redo",
    feature6Body:
      "Förberedd för inloggning och attest med BankID (lanseras i fas 2).",

    // Pricing
    pricingTagline: "Priser",
    pricingTitle: "Enkelt. Per företag, inte per användare.",
    pricingPopular: "Populärast",
    pricingContactUs: "Kontakta oss",
    pricingLoading: "Laddar…",
    pricingChoosePlan: "Välj",

    // Plan names

    // Plan features
    planFreeFeatures: [
      "25 skanningar/månad",
      "Grundläggande OCR",
      "CSV-export",
    ],
    planProFeatures: [
      "Obegränsade skanningar",
      "Fortnox-integration",
      "Svensk moms (6/12/25 %)",
      "7-årig revisionslogg",
    ],
    planBusinessFeatures: [
      "Allt i Pro",
      "Attestflöden",
      "BankID",
      "Milersättning",
      "Koldioxidavtryck",
    ],
    planEnterpriseFeatures: ["Allt i Företag", "SSO", "API", "White-label"],

    // Footer
    footerTitle: "Kvitto",
    footerDescription:
      "AI-driven kvittohantering byggd för svenska moms- och bokföringsregler.",
    footerGDPR: "GDPR-säker",
    footerAudit: "7-årig revisionslogg",
    footerBankID: "BankID-redo",
    footerCopyright: "© {year} GlorifyTC.",
    footerDisclaimer:
      "Detta är en startmall — verifiera moms- och bokföringsregler med din revisor innan produktion.",


    // lib/translations.ts — ADD these values to strings.sv
    featuresPageSubtitle: "Sex funktioner byggda för svenska företag, enskilda firmor och redovisningsbyråer.",
    featuresCompareTitle: "Så jämför sig Utlagg",
    featuresCompareCapability: "Funktion",
    featuresCompareUtlagg: "Utlagg",
    featuresCompareTraditional: "Traditionella verktyg",
    featuresCompareOcrLabel: "OCR-träffsäkerhet",
    featuresCompareOcrUtlagg: "98 %+",
    featuresCompareOcrTraditional: "70–85 %",
    featuresCompareBasLabel: "BAS-kontoplan",
    featuresCompareBasUtlagg: "Automatisk, självkorrigerande",
    featuresCompareBasTraditional: "Manuell eller mallbaserad",
    featuresCompareVatLabel: "Svensk moms",
    featuresCompareVatUtlagg: "6 / 12 / 25 % identifieras automatiskt",
    featuresCompareVatTraditional: "Ofta konfigurerat per leverantör",
    featuresCompareBankidLabel: "BankID-attestering",
    featuresCompareBankidUtlagg: "Inbyggt",
    featuresCompareBankidTraditional: "Separat identitetsleverantör",
    featuresCompareDataLabel: "Datalagring",
    featuresCompareDataUtlagg: "Sverige",
    featuresCompareDataTraditional: "EU eller USA",
    featuresCtaTitle: "Redo att testa funktionerna?",
    featuresCtaBody: "Skapa ett gratis konto och ladda upp ditt första kvitto på under en minut.",
    pricingPageSubtitle: "Börja gratis. Uppgradera när teamet växer. Alla paket inkluderar obegränsad kvittolagring och sju års regelefterlevnad.",
    pricingComparisonTitle: "Fullständig funktionsjämförelse",
    pricingFaqTitle: "Vanliga frågor",
    pricingBottomTitle: "Börja med gratisplanen",
    pricingBottomSubtitle: "Inget kort krävs. Uppgradera när du behöver mer.",
    pricingCalloutSubtitle: "Gratisplan tillgänglig. Inget kort krävs.",
    pricingFaq1Q: "Kan jag byta paket senare?",
    pricingFaq1A: "Ja. Uppgradera eller nedgradera när som helst. Om du nedgraderar mitt i en period träder det nya paketet i kraft vid nästa faktureringsperiod.",
    pricingFaq2Q: "Finns det någon bindningstid?",
    pricingFaq2A: "Nej. Alla betalda paket faktureras månadsvis. Avsluta när som helst från dina kontoinställningar.",
    pricingFaq3Q: "Hanterar ni icke-svenska kvitton?",
    pricingFaq3A: "Ja. Vår OCR-modell hanterar kvitton på svenska, engelska, norska, danska, finska och tyska — med automatisk valutaomvandling.",
    pricingFaq4Q: "Hur fungerar gratisperioden?",
    pricingFaq4A: "Pro-paketet inkluderar 14 dagars gratis provperiod. Ingen debitering förrän provperioden löper ut. Du kan nedgradera till Gratis under provperioden och behålla din data.",
    pricingTableReceipts: "Kvitton per månad",
    pricingTableMembers: "Teammedlemmar",
    pricingTableOcr: "AI-OCR",
    pricingTableBas: "BAS-autokategorisering",
    pricingTableCurrency: "Flera valutor",
    pricingTableSie4: "SIE4-export",
    pricingTableSync: "Fortnox / Visma / Bokio-synk",
    pricingTableBankid: "BankID-attestering",
    pricingTableRoles: "Rollbaserad åtkomst",
    pricingTableLimits: "Beloppsgränser",
    pricingTableOnboarding: "Anpassad onboarding",
    pricingTableSupport: "Prioriterad support",
  },
  en: {
    annFieldVatRate: "VAT rate",
    annTitle: "Wrong value? Point at the receipt",
    annDesc: "Pick a field and drag a box over the value on the image. The AI reads just that area — and we store your markup to train the model on Swedish receipts.",
    annHint: "Drag a box over the value on the image",
    annReading: "Reading the area…",
    annReadFail: "Could not read the area",
    annSaved: "Read and saved for training",
    annFieldReceiptNo: "Invoice no",
    annFieldVat: "VAT",
    annFieldTotal: "Amount",
    annFieldDate: "Date",
    annFieldVendor: "Supplier",
    about: "About",
    contact: "Contact",
    navMenu: "Menu",
    navClose: "Close",
    howKicker: "How it works",
    howTitle: "From receipt to bookkeeping in seconds",
    howStep1Title: "Scan",
    howStep1Body: "Snap the receipt or upload an image. The AI reads supplier, date, VAT and amount for you.",
    howStep2Title: "Review",
    howStep2Body: "Check the filled-in fields and choose a BAS account. Everything stays editable before you save.",
    howStep3Title: "Export",
    howStep3Body: "Export to SIE, CSV or Fortnox — ready for your books and the Swedish Tax Agency.",
    footerProduct: "Product",
    footerCompany: "Company",
    footerLegal: "Legal",
    footerTerms: "Terms",
    footerPrivacy: "Privacy policy",
    aboutKicker: "About Utlagg",
    aboutTitle: "Built in Sweden, for Swedish rules.",
    aboutLead: "Utlagg makes receipts and expenses effortless for Swedish businesses — with VAT, BAS accounts and the Tax Agency built in from the start, not bolted on afterwards.",
    aboutStoryTitle: "Why we built Utlagg",
    aboutStoryBody: "Most expense tools are built for an international market and don't understand Swedish VAT, reverse-charge construction tax or the seven-year archiving rule in the Bookkeeping Act. We got tired of fixing the same things by hand every month. Utlagg reads the receipt, fills in the right VAT rate and BAS account, and keeps the record for seven years — so the books are right from the start.",
    aboutValuesTitle: "What we stand for",
    aboutVal1Title: "Compliance first",
    aboutVal1Body: "Swedish VAT, the BAS chart of accounts and the Bookkeeping Act aren't add-ons — they're the foundation the product is built on.",
    aboutVal2Title: "No surprises",
    aboutVal2Body: "Clear pricing, no lock-in, and your data is yours. Export everything and cancel whenever you like.",
    aboutVal3Title: "Real privacy",
    aboutVal3Body: "GDPR-safe handling, encryption and BankID login. Your receipts never leave your control unnecessarily.",
    aboutStatsTitle: "Built for Swedish bookkeeping",
    aboutStat1Val: "6/12/25%",
    aboutStat1Label: "Swedish VAT rates, date-aware",
    aboutStat2Val: "2.50 kr/km",
    aboutStat2Label: "Tax-free mileage",
    aboutStat3Val: "7 years",
    aboutStat3Label: "Archive per the Bookkeeping Act",
    aboutCtaTitle: "Ready to simplify your expenses?",
    aboutCtaBody: "Get started free in minutes. No card required.",
    contactKicker: "Contact",
    contactTitle: "Get in touch.",
    contactLead: "Questions about the product, pricing or your bookkeeping? We usually reply within one business day.",
    contactEmailLabel: "Email",
    contactSalesLabel: "Sales & quotes",
    contactResponseLabel: "Response time",
    contactResponseValue: "Within 1 business day",
    contactFormTitle: "Send a message",
    contactFormDesc: "Fill in the form and your email app opens with the message ready to send.",
    contactName: "Name",
    contactEmailField: "Your email",
    contactMessage: "Message",
    contactMessagePh: "How can we help?",
    contactSend: "Send message",
    contactSubject: "Enquiry via utlagg.se",
    invOrgNr: "Reg. no:",
    invVatNr: "VAT no:",
    invInvoiceWord: "INVOICE",
    invNrLabel: "No:",
    invDateLabel: "Date:",
    invDueLabel: "Due:",
    invBillTo: "Billed to",
    invViewDisclaimer: "The template is provided by Utlagg. You are responsible for the invoice's content and accuracy.",
    apHistoryTitle: "Approval history",
    apHistoryDesc: "Your sent requests",
    apNoneYet: "No requests yet.",
    toastNameUpdated: "Name updated",
    toastNameUpdateFail: "Could not update name",
    toastPwMismatch: "The passwords don't match",
    toastPwChanged: "Password changed",
    toastPwChangeFail: "Could not change password",
    toastAccountDeleted: "Account deleted",
    toastAccountDeleteFail: "Could not delete account",
    prTitle: "Profile settings",
    prNameTitle: "Name",
    prNameDesc: "Your name appears on receipts and invoices",
    fldName: "Name",
    prEmailLabel: "Email:",
    btnSaveChanges: "Save changes",
    prChangePw: "Change password",
    prPwDesc: "Use a strong password (at least 8 characters)",
    fldCurrentPw: "Current password",
    fldNewPw: "New password",
    fldConfirmPw: "Confirm new password",
    btnChangePw: "Change password",
    prDeleteDesc: "When you delete your account, your receipts and data are permanently removed.",
    prSureTitle: "Are you absolutely sure?",
    prSureDesc: "This cannot be undone. All your receipts and settings are permanently deleted.",
    prConfirmDelete: "Yes, delete my account",
    stSubtitle: "Overview of your receipts and VAT",
    stTotalVat: "Total VAT",
    stPerMonth: "Receipts per month",
    stLastSixMonths: "Last six months",
    stNoData: "No data yet.",
    toastFillAddresses: "Fill in addresses and distance",
    toastTripSaved: "Trip saved",
    milUpsellDesc: "Log trips and get tax-free mileage (2.50 kr/km) calculated automatically. Included in the Business plan.",
    milRatePre: "Tax-free rate for own car:",
    milRateNote: "(25 kr/10 km, Swedish Tax Agency 2026)",
    milNewTrip: "New trip",
    milNewTripDesc: "Enter the distance in kilometres. The amount is calculated automatically.",
    fldFrom: "From",
    fldTo: "To",
    phStartAddress: "Start address",
    phEndAddress: "End address",
    fldDistance: "Distance (km)",
    fldDate: "Date",
    fldPurpose: "Purpose",
    purposeBusiness: "Business trip",
    purposePrivate: "Private",
    fldAmount: "Amount",
    milLog: "Trip log",
    milNoneYet: "No trips yet.",
    milKm: "km",
    purposeBusinessShort: "Business",
    milManualNote: "Distance is entered manually. Automatic distance calculation (Google Maps/OpenRouteService) can be added with an API key — it is not enabled here.",
    promptComment: "Comment (optional):",
    promptReason: "Reason for rejection:",
    toastApproved: "Approved",
    toastRejected: "Rejected",
    toastDecisionFail: "Could not save the decision",
    apWaiting: "Awaiting your approval",
    apWaitingDesc: "Requests addressed to your email",
    apNoneWaiting: "No pending requests.",
    toastSelectReceiptApprover: "Select a receipt and approver",
    toastSubmitted: "Submitted for approval",
    toastSubmitFail: "Could not submit",
    apUpsellTitle: "Approval workflows",
    apUpsellDesc: "Send expenses for approval and manage approval chains. Included in the Business plan.",
    apRequest: "Request",
    apRequestDesc: "Choose a receipt and who should approve",
    fldReceipt: "Receipt",
    phSelectReceipt: "Select a receipt…",
    unknownShort: "Unknown",
    fldApproverEmail: "Approver's email",
    fldComment: "Comment",
    phOptional: "Optional",
    apSubmitNote: "The approver sees the request when they log in with an account that has that email address.",
    setAppearance: "Appearance",
    setAppearanceDesc: "Choose light or dark mode",
    setSwitchToLight: "Switch to light mode",
    setSwitchToDark: "Switch to dark mode",
    setCompanyDesc: "Shown on exports and records",
    fldCompanyName: "Company name",
    phCompany: "Your Company Ltd",
    setExportTitle: "Export & integrations",
    setExportDesc: "Download your data or connect accounting",
    setSkvTitle: "Swedish Tax Agency export (PRO)",
    setSkvDesc: "Choose a period and download all receipts with VAT and BAS account",
    toastCompanySaved: "Company name saved",
    toastSaveFail: "Could not save",
    toastEnterCompanyName: "Enter a company name",
    toastCompanyCreated: "Company created",
    toastCreateFail: "Could not create",
    toastEnterEmail: "Enter an email",
    toastInviteSent: "Invitation sent",
    toastInviteFail: "Could not invite",
    toastRoleUpdated: "Role updated",
    toastUpdateFail: "Could not update",
    confirmRemoveMember: "Remove this member?",
    toastRemoved: "Removed",
    toastRemoveFail: "Could not remove",
    loading: "Loading…",
    coCreateDesc: "Create a company to invite colleagues and share expenses.",
    fldOrgNumber: "Company registration number",
    fldVatNumber: "VAT number",
    coMembers: "Members",
    coYourRole: "Your role:",
    roleMember: "Member",
    roleApprover: "Approver",
    roleAdmin: "Admin",
    coInviteDesc: "Sends an invitation by email (valid for 7 days).",
    fldEmail: "Email",
    fldRole: "Role",
    invUpsellTitle: "Invoicing",
    invUpsellDesc: "Create and send customer invoices (incl. reverse-charge construction VAT). Included from the Pro plan.",
    invNeedCompanyTitle: "Create a company first",
    invNeedCompanyDesc: "The seller details (name, registration number) on the invoice are taken from your company.",
    invNoneYet: "No invoices yet.",
    invColNr: "No.",
    invColCustomer: "Customer",
    invColDate: "Date",
    invColAmount: "Amount",
    invColVat: "VAT",
    invReverse: "Reverse",
    invDisclaimer: "You are responsible for ensuring the invoice details are correct. Utlagg provides the template and stores the invoice.",
    toastFillCustomerRows: "Fill in the customer and all rows",
    toastReverseNeedsVat: "Reverse charge requires the buyer's VAT/registration number",
    toastInvoiceSaved: "Invoice saved",
    invCustomer: "Customer",
    fldInvoiceNumber: "Invoice number (optional)",
    phAutoNumber: "Leave blank for an automatic number",
    fldCustomerName: "Customer name",
    fldOrgNumberShort: "Reg. number",
    fldVatNumberShort: "VAT number",
    fldAddress: "Address",
    fldIssueDate: "Invoice date",
    fldDueDate: "Due date",
    invLines: "Lines",
    invLinesDesc: "Prices are excl. VAT.",
    phDescription: "Description",
    phQuantity: "Qty",
    phUnitPrice: "Unit price",
    ariaRemoveRow: "Remove row",
    invReversePre: "Reverse charge (construction services) — the invoice is issued without VAT and carries the text",
    invReversePost: "The buyer's VAT/registration number must be provided.",
    invSubtotal: "Subtotal excl. VAT",
    invVatReverse: "0,00 kr (reverse)",
    invToPay: "To pay",
    btnSaveInvoice: "Save invoice",
    btnDeleteAccountPermanent: "Delete account permanently",
    stSaving: "Saving…",
    stSubmitting: "Submitting…",
    btnAddRow: "+ Add row",
    btnToCompanies: "To companies",
    btnNewInvoice: "New invoice",
    btnView: "View",
    btnDeleteAccount: "Delete account",
    btnSubmitApproval: "Submit for approval",
    btnHistory: "History",
    btnApprove: "Approve",
    btnReject: "Reject",
    btnExportCsv: "Export CSV",
    btnExportPdf: "Export PDF",
    btnExportSie: "Export SIE (accounting)",
    btnConnectFortnox: "Connect Fortnox",
    btnCreateCompany: "Create company",
    btnDelete: "Delete",
    btnInviteColleague: "Invite colleague",
    btnSendInvite: "Send invitation",
    btnLightMode: "Light mode",
    btnDarkMode: "Dark mode",
    btnSave: "Save",
    btnSaveTrip: "Save trip",
    btnCancel: "Cancel",
    subManageDesc: "Manage your plan and billing",
    subCurrentPlan: "Current plan",
    subYouAreOnPre: "You're on the ",
    subYouAreOnPost: " plan",
    subRenews: "renews",
    subCancel: "Cancel subscription",
    subCurrentBadge: "Current",
    subSwitchTo: "Switch to",
    subRequestQuote: "Request a quote",
    planQuote: "Quote",
    planFree: "Free",
    planPro: "Pro",
    planBusiness: "Business",
    planEnterprise: "Enterprise",
    cancelTitle: "Cancel subscription?",
    cancelIntro: "Before you cancel, please read and accept the following:",
    cancelBullet1Pre: "We keep your receipts and invoices for ",
    cancelBullet1Strong: "1 year after your last payment",
    cancelBullet1Post: ". After that they are deleted.",
    cancelBullet2Pre: "You can ",
    cancelBullet2Strong: "not scan new receipts",
    cancelBullet2Post: " without an active subscription.",
    cancelBullet3Pre: "If you have a company with employees you may need to ",
    cancelBullet3Strong: "remove members",
    cancelBullet3Post: " if you downgrade.",
    cancelAccept: "I understand and accept that my data is deleted after 1 year.",
    cancelAbort: "Cancel",
    cancelConfirm: "Cancel anyway",
    toastCheckoutFail: "Could not start checkout",
    toastNetwork: "Network error",
    toastCancelScheduled: "Your subscription will end at the close of the period.",
    toastCancelFail: "Could not cancel subscription",
    toastQuoteThanks: "Thanks! We'll be in touch with a quote.",
    featUnlimitedScans: "Unlimited scans",
    feat25Scans: "25 scans/mo",
    featBasicOcr: "Basic OCR",
    featCsv: "CSV export",
    featFortnox: "Fortnox integration",
    featSwedishVat: "Swedish VAT (6/12/25%)",
    featAuditLog: "7-year audit log",
    featAllPro: "Everything in Pro",
    featApprovals: "Approval workflows",
    featMileage: "Mileage",
    featCarbon: "Carbon footprint",
    featAllBusiness: "Everything in Business",
    intFortnoxDesc: "Automatically post your receipts as entries in Fortnox.",
    intWaitingSync: "receipts waiting to sync.",
    intUpsellTitle: "Fortnox integration",
    intUpsellDesc: "Automatically post receipts as entries in Fortnox. Included from the Pro plan.",
    intNote: "The accounting (which BAS accounts entries post to) should be checked with your accountant before syncing for real.",
    fortnoxConnect: "Connect to Fortnox",
    fortnoxConnected: "Connected",
    fortnoxSyncing: "Syncing…",
    fortnoxSyncNow: "Sync now",
    fortnoxDisconnect: "Disconnect",
    fortnoxDisconnectConfirm: "Disconnect Fortnox?",
    fortnoxDisconnected: "Disconnected",
    fortnoxDisconnectFail: "Could not disconnect",
    fortnoxSyncFail: "Sync failed",
    statTotalReceipts: "Total receipts",
    statThisMonth: "This month",
    statTotalAmount: "Total amount",
    statUsage: "Usage",
    recentTitle: "Recent receipts",
    recentDesc: "Your five most recently added receipts",
    noReceiptsYet: "No receipts yet.",
    uploadFirst: "Upload your first",
    unknownVendor: "Unknown supplier",
    usageUnlimitedPlan: "Unlimited in your plan",
    usageOf: "of",
    usageUsedWord: "used",
    usagePercentUsed: "used",
    idleTitle: "You'll be logged out soon",
    idleStay: "Stay logged in",
    idleLogout: "Log out now",
    receiptApprove: "Approve",
    receiptDelete: "Delete",
    receiptDeleteConfirm: "Delete this receipt? This cannot be undone.",
    colActions: "Actions",
    receiptCancel: "Cancel",
    receiptsSubtitle: "Upload, review and export",
    receiptNewTitle: "New receipt",
    receiptDragDrop: "Drag & drop your receipt here, or",
    receiptChooseImage: "Choose image",
    receiptTakePhoto: "Take photo",
    receiptCameraHint: "Take photo opens the camera on mobile.",
    receiptSearch: "Search vendor, BAS or amount",
    receiptExportCsv: "Export CSV",
    receiptFrom: "From",
    receiptTo: "To",
    receiptExport: "Export",
    receiptNone: "No receipts yet. Upload your first above.",
    receiptLoading: "Loading…",
    colDate: "Date",
    colVendor: "Vendor",
    colBas: "BAS",
    colVat: "VAT",
    colAmount: "Amount",
    colStatus: "Status",
    statusPending: "Pending",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    scansThisMonth: "Scans this month",
    unlimited: "unlimited",
    dashWelcome: "Welcome back",
    dashPremiumEndedTitle: "Your premium period has ended",
    dashPremiumEndedBody: "Choose a plan to keep using the premium features.",
    dashChoosePlan: "Choose plan",
    navOverview: "Overview",
    navReceipts: "Receipts",
    navMileage: "Mileage",
    navApprovals: "Approvals",
    navIntegrations: "Integrations",
    navSubscription: "Subscription",
    navStats: "Statistics",
    navInvoices: "Invoices",
    navCompany: "Company",
    navSettings: "Settings",
    navProfile: "Profile",
    navLogout: "Log out",
    langName: "English",
    // Navigation
    features: "Features",
    pricing: "Pricing",
    login: "Log in",
    startFree: "Start free",

    // Hero
    heroTagline: "Receipt management · Sweden",
    heroTitleLine1: "Snap the receipt.",
    heroTitleLine2: "AI handles the rest.",
    heroDescription:
      "Scan, automate VAT bookkeeping and export to the Swedish Tax Agency. Built for Swedish regulations — from BAS accounts to 7-year audit logs.",
    heroCtaPrimary: "Start free",
    heroCtaSecondary: "See pricing",
    heroDisclaimer: "25 scans/month free · no card required",
    loading3D: "Loading 3D…",

    // Features
    featuresHeadline:
      "Everything for Swedish receipt management — in one place.",
    feature1Title: "AI scanning",
    feature1Body:
      "Snap the receipt — AI reads vendor, date, amount and VAT in seconds.",
    feature2Title: "Swedish VAT",
    feature2Body:
      "6/12/25 % handled automatically, including the temporary food VAT 2026–2027.",
    feature3Title: "BAS accounts",
    feature3Body:
      "Searchable BAS chart of accounts so every expense hits the right account directly.",
    feature4Title: "7-year audit log",
    feature4Body:
      "Every action logged with timestamp and IP per the Accounting Act.",
    feature5Title: "Export to Swedish Tax Agency",
    feature5Body:
      "Download as CSV or PDF — ready for your accountant or bookkeeping.",
    feature6Title: "BankID ready",
    feature6Body:
      "Prepared for login and approval with BankID (launching in phase 2).",

    // Pricing
    pricingTagline: "Pricing",
    pricingTitle: "Simple. Per company, not per user.",
    pricingPopular: "Most popular",
    pricingContactUs: "Contact us",
    pricingLoading: "Loading…",
    pricingChoosePlan: "Choose",

    // Plan names

    // Plan features
    planFreeFeatures: ["25 scans/month", "Basic OCR", "CSV export"],
    planProFeatures: [
      "Unlimited scans",
      "Fortnox integration",
      "Swedish VAT (6/12/25 %)",
      "7-year audit log",
    ],
    planBusinessFeatures: [
      "Everything in Pro",
      "Approval flows",
      "BankID",
      "Mileage allowance",
      "Carbon footprint",
    ],
    planEnterpriseFeatures: [
      "Everything in Business",
      "SSO",
      "API",
      "White-label",
    ],

    // Footer
    footerTitle: "Receipt",
    footerDescription:
      "AI-driven receipt management built for Swedish VAT and bookkeeping regulations.",
    footerGDPR: "GDPR-safe",
    footerAudit: "7-year audit log",
    footerBankID: "BankID ready",
    footerCopyright: "© {year} GlorifyTC.",
    footerDisclaimer:
      "This is a starter template — verify VAT and bookkeeping rules with your accountant before production.",

    // lib/translations.ts — ADD these values to strings.en (mirror the Swedish keys)
    featuresPageSubtitle: "Six capabilities purpose-built for Swedish companies, sole traders, and accounting firms.",
    featuresCompareTitle: "How Utlagg compares",
    featuresCompareCapability: "Capability",
    featuresCompareUtlagg: "Utlagg",
    featuresCompareTraditional: "Traditional tools",
    featuresCompareOcrLabel: "Receipt OCR accuracy",
    featuresCompareOcrUtlagg: "98 %+",
    featuresCompareOcrTraditional: "70–85 %",
    featuresCompareBasLabel: "BAS mapping",
    featuresCompareBasUtlagg: "Automatic, self-correcting",
    featuresCompareBasTraditional: "Manual or template-based",
    featuresCompareVatLabel: "Swedish VAT handling",
    featuresCompareVatUtlagg: "6 / 12 / 25 % auto-detected",
    featuresCompareVatTraditional: "Often configured per-vendor",
    featuresCompareBankidLabel: "BankID sign-off",
    featuresCompareBankidUtlagg: "Built-in",
    featuresCompareBankidTraditional: "Separate identity provider",
    featuresCompareDataLabel: "Data residency",
    featuresCompareDataUtlagg: "Sweden",
    featuresCompareDataTraditional: "EU or US",
    featuresCtaTitle: "Ready to try the features?",
    featuresCtaBody: "Create a free account and upload your first receipt in under a minute.",
    pricingPageSubtitle: "Start for free. Upgrade when your team grows. Every plan includes unlimited receipt storage and seven-year compliance archiving.",
    pricingComparisonTitle: "Full feature comparison",
    pricingFaqTitle: "Common questions",
    pricingBottomTitle: "Start with the free plan",
    pricingBottomSubtitle: "No credit card required. Upgrade when you need more.",
    pricingCalloutSubtitle: "Free plan available. No credit card required.",
    pricingFaq1Q: "Can I switch plans later?",
    pricingFaq1A: "Yes. Upgrade or downgrade at any time. If you downgrade mid-cycle, the new plan takes effect at the next billing period.",
    pricingFaq2Q: "Is there a long-term commitment?",
    pricingFaq2A: "No. All paid plans are billed monthly. Cancel anytime from your account settings.",
    pricingFaq3Q: "Do you handle non-Swedish receipts?",
    pricingFaq3A: "Yes. Our OCR model handles receipts in Swedish, English, Norwegian, Danish, Finnish, and German — with automatic currency conversion.",
    pricingFaq4Q: "How does the free trial work?",
    pricingFaq4A: "The Pro plan includes a 14-day free trial. No charge until the trial ends. You can downgrade to Free during the trial and keep your data.",
    pricingTableReceipts: "Receipts per month",
    pricingTableMembers: "Team members",
    pricingTableOcr: "AI OCR",
    pricingTableBas: "BAS auto-categorisation",
    pricingTableCurrency: "Multi-currency",
    pricingTableSie4: "SIE4 export",
    pricingTableSync: "Fortnox / Visma / Bokio sync",
    pricingTableBankid: "BankID sign-off",
    pricingTableRoles: "Role-based access",
    pricingTableLimits: "Spending limits",
    pricingTableOnboarding: "Custom onboarding",
    pricingTableSupport: "Priority support",
  },
};