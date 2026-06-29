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
  invDeleteConfirm: string;
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
  annModeMark: string;
  annModeMove: string;
  annTip: string;
  navTransport: string;
  trTitle: string;
  trSubtitle: string;
  trQuickTitle: string;
  trQuickDesc: string;
  trQuickBtn: string;
  trNewTitle: string;
  trType: string;
  trTypeMonthly: string;
  trTypeYearly: string;
  trTypeSingle: string;
  trProvider: string;
  trProviderOtherLabel: string;
  trAmount: string;
  trValidFrom: string;
  trValidTo: string;
  trRecurring: string;
  trSave: string;
  trSaved: string;
  trSaveFail: string;
  trListTitle: string;
  trColPeriod: string;
  trColProvider: string;
  trColAmount: string;
  trColVat: string;
  trColStatus: string;
  trRecurringTag: string;
  trOnceTag: string;
  trEmpty: string;
  trExportTitle: string;
  trExportDesc: string;
  trExportBtn: string;
  trVatNote: string;
  milVehicle: string;
  milPrivateCar: string;
  milVehicleNote: string;
  milManageVehicles: string;
  milAddVehicle: string;
  milRegNr: string;
  milModel: string;
  milFuel: string;
  milFuelPetrol: string;
  milFuelDiesel: string;
  milFuelHybrid: string;
  milFuelElectric: string;
  milVehicleAdded: string;
  milVehicleFail: string;
  milRegNrInvalid: string;
  milElectricTag: string;
  milAdminOnly: string;
  annArm: string;
  annArmed: string;
  annCancel: string;
  annScroll: string;
  milRoutesTitle: string;
  milRoutesDesc: string;
  milRouteLabel: string;
  milRouteLabelPh: string;
  milSaveRoute: string;
  milRouteSaved: string;
  milRouteNeedTrip: string;
  milNoRoutes: string;
  milLogToday: string;
  milLogPeriod: string;
  milPeriodFrom: string;
  milPeriodTo: string;
  milWeekdays: string;
  milLogN: string;
  milLoggedN: string;
  milNoDates: string;
  milDowMon: string;
  milDowTue: string;
  milDowWed: string;
  milDowThu: string;
  milDowFri: string;
  milDowSat: string;
  milDowSun: string;
  milTripsLogged: string;
  milExample: string;
  milExampleHint: string;
  milExampleLabel: string;
  milExampleFrom: string;
  milExampleTo: string;
  stRangeMonth: string;
  stRangeYear: string;
  stAvgPerReceipt: string;
  stTopCategory: string;
  stByCategory: string;
  stTrend: string;
  stTheme: string;
  stNoCategoryData: string;
  stBucketFood: string;
  stBucketTravel: string;
  stBucketOffice: string;
  stBucketIt: string;
  stBucketMarketing: string;
  stBucketProfessional: string;
  stBucketOther: string;
  stShareOfTotal: string;
  rcCategoryAutoDetected: string;
  expPeriodTitle: string;
  expPeriodDesc: string;
  expThisMonth: string;
  expLastMonth: string;
  expThisQuarter: string;
  expLastQuarter: string;
  expThisYear: string;
  expCustom: string;
  expFrom: string;
  expTo: string;
  expDownloadReceipts: string;
  expDownloadMileage: string;
  expDownloadTransport: string;
  expDownloadAll: string;
  navExport: string;
  dashExportHint: string;
  fortnoxReviewTitle: string;
  fortnoxReviewDesc: string;
  fortnoxSelectAll: string;
  fortnoxDeselectAll: string;
  fortnoxNoneSelected: string;
  fortnoxNonePending: string;
  fortnoxSyncSelected: string;
  fortnoxSelectedCount: string;
  rcScanningLocally: string;
  rcScanningServer: string;
  rcLocalLowConfidence: string;
  rcLowConfidence: string;
}

export const strings: Record<Lang, Translations> = {
  sv: {
    rcScanningLocally: "Läser kvittot lokalt…",
    rcScanningServer: "Försöker med bättre läsning…",
    rcLocalLowConfidence: "Inläst med begränsad säkerhet — kontrollera fälten innan du sparar.",
    rcLowConfidence: "Vissa fält kan vara felaktiga — kontrollera dem innan du sparar.",
    fortnoxReviewTitle: "Granska innan synk till Fortnox",
    fortnoxReviewDesc: "Välj vilka godkända kvitton som ska skickas. Inget synkas förrän du bekräftar.",
    fortnoxSelectAll: "Markera alla",
    fortnoxDeselectAll: "Avmarkera alla",
    fortnoxNoneSelected: "Inga kvitton markerade",
    fortnoxNonePending: "Inga godkända kvitton väntar på att synkas",
    fortnoxSyncSelected: "Skicka markerade",
    fortnoxSelectedCount: "markerade",
    dashExportHint: "Ladda ner alla kvitton, körjournaler och periodbiljetter för valfri rapporteringsperiod",
    navExport: "Exportera",
    expPeriodTitle: "Välj exportperiod",
    expPeriodDesc: "Välj den period du behöver rapportera — till exempel en momsmånad eller ett kvartal — och ladda ner kvitton, körjournal och periodbiljetter på en gång.",
    expThisMonth: "Denna månad",
    expLastMonth: "Förra månaden",
    expThisQuarter: "Detta kvartal",
    expLastQuarter: "Förra kvartalet",
    expThisYear: "Detta år",
    expCustom: "Anpassad period",
    expFrom: "Från",
    expTo: "Till",
    expDownloadReceipts: "Kvitton",
    expDownloadMileage: "Körjournal",
    expDownloadTransport: "Periodbiljetter",
    expDownloadAll: "Ladda ner allt för denna period",
    rcCategoryAutoDetected: "Auto-identifierad",
    stRangeMonth: "Månad",
    stRangeYear: "År",
    stAvgPerReceipt: "Snitt per kvitto",
    stTopCategory: "Största kategori",
    stByCategory: "Utgifter per kategori",
    stTrend: "Trend över tid",
    stTheme: "Färgtema",
    stNoCategoryData: "Inga kategoriserade kvitton än",
    stBucketFood: "Mat & representation",
    stBucketTravel: "Resor & transport",
    stBucketOffice: "Kontor & lokal",
    stBucketIt: "IT & programvara",
    stBucketMarketing: "Marknadsföring",
    stBucketProfessional: "Konsulter & utbildning",
    stBucketOther: "Övrigt",
    stShareOfTotal: "andel av totalen",
    milExample: "Exempel",
    milExampleHint: "Så här ser en sparad rutt ut — spara din första ovan.",
    milExampleLabel: "Hem–Kontor",
    milExampleFrom: "Hemadress 1",
    milExampleTo: "Kontoret",
    milRoutesTitle: "Återkommande resor",
    milRoutesDesc: "Spara vanliga rutter och logga dem med ett klick — eller för en hel period på en gång.",
    milRouteLabel: "Namn på rutt",
    milRouteLabelPh: "T.ex. Hem–Kontor",
    milSaveRoute: "Spara nuvarande som rutt",
    milRouteSaved: "Rutt sparad",
    milRouteNeedTrip: "Fyll i från, till, sträcka och namn först.",
    milNoRoutes: "Inga sparade rutter ännu.",
    milLogToday: "Logga idag",
    milLogPeriod: "Period…",
    milPeriodFrom: "Från",
    milPeriodTo: "Till",
    milWeekdays: "Veckodagar",
    milLogN: "Logga {n} resor",
    milLoggedN: "{n} resor loggade",
    milNoDates: "Inga datum valda",
    milDowMon: "Må",
    milDowTue: "Ti",
    milDowWed: "On",
    milDowThu: "To",
    milDowFri: "Fr",
    milDowSat: "Lö",
    milDowSun: "Sö",
    milTripsLogged: "Resa loggad",
    annArm: "Rätta fält",
    annArmed: "Rita en ruta över: {field}",
    annCancel: "Avbryt",
    annScroll: "Bläddra fritt. Tryck “Rätta fält” för att korrigera ett värde.",
    navTransport: "Kollektivtrafik",
    trTitle: "Kollektivtrafik",
    trSubtitle: "Registrera dina periodbiljetter en gång — ingen anledning att logga varje resa.",
    trQuickTitle: "Lägg till denna månads kort",
    trQuickDesc: "Har du ett återkommande månadskort? Lägg till det för innevarande månad med ett klick.",
    trQuickBtn: "Lägg till för {month}",
    trNewTitle: "Nytt månadskort / periodbiljett",
    trType: "Typ av biljett",
    trTypeMonthly: "Månadskort",
    trTypeYearly: "Årskort",
    trTypeSingle: "Enkelbiljett",
    trProvider: "Trafikhuvudman",
    trProviderOtherLabel: "Annat — ange namn",
    trAmount: "Belopp (SEK)",
    trValidFrom: "Giltig från",
    trValidTo: "Giltig till",
    trRecurring: "Återkommande varje månad",
    trSave: "Spara periodbiljett",
    trSaved: "Periodbiljett sparad",
    trSaveFail: "Kunde inte spara",
    trListTitle: "Mina periodbiljetter",
    trColPeriod: "Period",
    trColProvider: "Trafikhuvudman",
    trColAmount: "Belopp",
    trColVat: "Moms",
    trColStatus: "Status",
    trRecurringTag: "Återkommande",
    trOnceTag: "Engång",
    trEmpty: "Inga periodbiljetter ännu.",
    trExportTitle: "Export för Skatteverket",
    trExportDesc: "Alla periodbiljetter för perioden, redo för deklarationen.",
    trExportBtn: "Exportera (CSV)",
    trVatNote: "Kollektivtrafik har 6 % moms — beräknas automatiskt.",
    milVehicle: "Fordon",
    milPrivateCar: "Privat bil",
    milVehicleNote: "Privat bil: 2,50 kr/km · Företagsbil: 1,20 kr/km · Elbil (företag): 0,95 kr/km",
    milManageVehicles: "Hantera företagsfordon",
    milAddVehicle: "Lägg till fordon",
    milRegNr: "Registreringsnummer",
    milModel: "Modell",
    milFuel: "Drivmedel",
    milFuelPetrol: "Bensin",
    milFuelDiesel: "Diesel",
    milFuelHybrid: "Hybrid",
    milFuelElectric: "El",
    milVehicleAdded: "Fordon tillagt",
    milVehicleFail: "Kunde inte lägga till fordon",
    milRegNrInvalid: "Ogiltigt registreringsnummer – ange ABC123 eller ABC12A",
    milElectricTag: "Elbil",
    milAdminOnly: "Endast administratörer kan lägga till fordon.",
    annModeMark: "Markera",
    annModeMove: "Panorera",
    annTip: "Zooma in först — det gör det mycket lättare att träffa små fält på mobilen.",
    annFieldVatRate: "Momssats",
    annTitle: "Fel värde? Rätta det direkt på kvittot",
    annDesc: "Välj ett fält och dra en ruta runt rätt värde på kvittobilden. AI:n läser om just det området — och din rättelse hjälper till att träna modellen på svenska kvitton.",
    annHint: "Dra en markering runt värdet i bilden",
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
    howTitle: "Från foto till bokfört kvitto — på under en minut",
    howStep1Title: "Fota",
    howStep1Body: "Ta ett foto eller ladda upp en bild. AI:n läser leverantör, datum, momssats och belopp på sekunder.",
    howStep2Title: "Bekräfta",
    howStep2Body: "Kontrollera de ifyllda fälten och justera vid behov. Välj BAS-konto och spara.",
    howStep3Title: "Exportera",
    howStep3Body: "Ladda ner som CSV, PDF eller SIE4, eller synka direkt till Fortnox — i rätt format för din revisor och Skatteverket.",
    footerProduct: "Produkt",
    footerCompany: "Företag",
    footerLegal: "Juridik",
    footerTerms: "Villkor",
    footerPrivacy: "Integritetspolicy",
    aboutKicker: "Om Utlagg",
    aboutTitle: "Byggt i Sverige, för svenska regler.",
    aboutLead: "Utlagg hanterar kvitton och utlägg för svenska företag — med moms, BAS-konton och Skatteverkets krav inbyggda från dag ett, inte tillagda i efterhand.",
    aboutStoryTitle: "Varför vi byggde Utlagg",
    aboutStoryBody: "De flesta utläggsverktyg är designade för en internationell marknad. De känner inte till svensk moms, omvänd byggmoms eller Bokföringslagens sjuåriga arkiveringskrav. Vi tröttnade på att rätta samma fel varje månad. Utlagg läser kvittot, applicerar rätt momssats och BAS-konto, och sparar underlaget i sju år — så att bokföringen stämmer från start.",
    aboutValuesTitle: "Vad vi står för",
    aboutVal1Title: "Regelefterlevnad först",
    aboutVal1Body: "Svenska momsregler, BAS-kontoplanen och Bokföringslagen är inte tillval — de är grunden som produkten är byggd på.",
    aboutVal2Title: "Inga överraskningar",
    aboutVal2Body: "Transparent prissättning, ingen bindningstid och din data är din. Exportera allt och säg upp när du vill.",
    aboutVal3Title: "Integritet på riktigt",
    aboutVal3Body: "GDPR-säker hantering och kryptering genomgående. Dina kvitton stannar under din kontroll.",
    aboutStatsTitle: "Byggt för svensk bokföring",
    aboutStat1Val: "6/12/25 %",
    aboutStat1Label: "Svenska momssatser, datumstyrda",
    aboutStat2Val: "2,50 kr/km",
    aboutStat2Label: "Skattefri milersättning",
    aboutStat3Val: "7 år",
    aboutStat3Label: "Arkiv enligt Bokföringslagen",
    aboutCtaTitle: "Redo att slippa strul med utlägg?",
    aboutCtaBody: "Skapa ett gratis konto på några minuter. Inget kort behövs.",
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
    invViewDisclaimer: "Utlagg tillhandahåller mallen och sparar fakturan. Du ansvarar för dess innehåll och korrekthet.",
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
    prTitle: "Profil",
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
    prDeleteDesc: "Om du raderar ditt konto tas alla dina kvitton, fakturor och all data bort permanent.",
    prSureTitle: "Det här går inte att ångra",
    prSureDesc: "Alla kvitton, fakturor och kontouppgifter raderas permanent. Det finns inget sätt att återställa dem.",
    prConfirmDelete: "Ja, radera mitt konto permanent",
    stSubtitle: "En sammanställning av dina kvitton, utgifter och moms",
    stTotalVat: "Total moms",
    stPerMonth: "Kvitton per månad",
    stLastSixMonths: "Senaste sex månaderna",
    stNoData: "Ingen data att visa ännu. Lägg till kvitton för att se din utgiftsöversikt.",
    toastFillAddresses: "Fyll i adresser och sträcka",
    toastTripSaved: "Resa sparad",
    milUpsellDesc: "Logga tjänsteresor och beräkna skattefri milersättning automatiskt. Ingår i Företag-planen.",
    milRatePre: "Skattefri sats, privat bil:",
    milRateNote: "(2,50 kr/km — Skatteverket 2026)",
    milNewTrip: "Ny resa",
    milNewTripDesc: "Ange sträckan i kilometer. Ersättningsbeloppet beräknas automatiskt.",
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
    milManualNote: "Sträckan måste anges manuellt. Automatisk ruttberäkning via Google Maps eller OpenRouteService kräver en API-nyckel som inte är konfigurerad för det här kontot.",
    promptComment: "Kommentar (valfritt):",
    promptReason: "Skäl till avslag:",
    toastApproved: "Godkänd",
    toastRejected: "Avslagen",
    toastDecisionFail: "Kunde inte spara beslut",
    apWaiting: "Väntar på ditt godkännande",
    apWaitingDesc: "Förfrågningar skickade till din e-postadress",
    apNoneWaiting: "Inget väntar på ditt godkännande.",
    toastSelectReceiptApprover: "Välj kvitto och attestant",
    toastSubmitted: "Skickad för attest",
    toastSubmitFail: "Kunde inte skicka",
    apUpsellTitle: "Attestflöden",
    apUpsellDesc: "Skicka utlägg för godkännande och följ attester på ett ställe. Ingår i Företag-planen.",
    apRequest: "Ny förfrågan",
    apRequestDesc: "Välj ett kvitto och den person som ska godkänna det",
    fldReceipt: "Kvitto",
    phSelectReceipt: "Välj kvitto…",
    unknownShort: "Okänd",
    fldApproverEmail: "Attestantens e-post",
    fldComment: "Kommentar",
    phOptional: "Valfritt",
    apSubmitNote: "Attestanten ser förfrågan nästa gång de loggar in med den e-postadressen.",
    setAppearance: "Utseende",
    setAppearanceDesc: "Växla mellan ljust och mörkt läge",
    setSwitchToLight: "Byt till ljust läge",
    setSwitchToDark: "Byt till mörkt läge",
    setCompanyDesc: "Visas på exporter, rapporter och underlag",
    fldCompanyName: "Företagsnamn",
    phCompany: "Ditt företag AB",
    setExportTitle: "Export och integrationer",
    setExportDesc: "Ladda ner dina data eller koppla ditt bokföringssystem",
    setSkvTitle: "Skatteverket-export (Pro)",
    setSkvDesc: "Välj en period och ladda ner alla kvitton med momsbelopp och BAS-kontokoder",
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
    coCreateDesc: "Skapa ett företag för att bjuda in teammedlemmar och hantera gemensamma utlägg.",
    fldOrgNumber: "Organisationsnummer",
    fldVatNumber: "Momsregistreringsnummer",
    coMembers: "Medlemmar",
    coYourRole: "Din roll:",
    roleMember: "Medlem",
    roleApprover: "Attestant",
    roleAdmin: "Admin",
    coInviteDesc: "En inbjudan skickas via e-post. Länken är giltig i 7 dagar.",
    fldEmail: "E-post",
    fldRole: "Roll",
    invUpsellTitle: "Fakturering",
    invUpsellDesc: "Skapa och skicka professionella fakturor, inklusive omvänd byggmoms. Tillgängligt från Pro-planen.",
    invNeedCompanyTitle: "Skapa ett företag först",
    invNeedCompanyDesc: "Fakturans säljaruppgifter (namn och organisationsnummer) hämtas från din företagsprofil.",
    invNoneYet: "Inga fakturor ännu.",
    invColNr: "Nr",
    invColCustomer: "Kund",
    invColDate: "Datum",
    invColAmount: "Belopp",
    invColVat: "Moms",
    invReverse: "Omvänd",
    invDisclaimer: "Utlagg tillhandahåller mallen och sparar fakturan. Du ansvarar för att alla uppgifter är korrekta.",
    invDeleteConfirm: "Ta bort denna faktura? Detta går inte att ångra.",
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
    invLinesDesc: "Ange priser exklusive moms.",
    phDescription: "Beskrivning",
    phQuantity: "Antal",
    phUnitPrice: "à-pris",
    ariaRemoveRow: "Ta bort rad",
    invReversePre: "Omvänd skattskyldighet (byggtjänster) — fakturan ställs ut utan moms och inkluderar texten",
    invReversePost: "Köparens moms- eller organisationsnummer är obligatoriskt.",
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
    subManageDesc: "Hantera din plan, fakturering och fakturor",
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
    cancelTitle: "Avsluta prenumerationen?",
    cancelIntro: "Läs igenom följande innan du fortsätter:",
    cancelBullet1Pre: "Dina kvitton och fakturor sparas i ",
    cancelBullet1Strong: "1 år från ditt sista betalningsdatum",
    cancelBullet1Post: ", sedan raderas de permanent.",
    cancelBullet2Pre: "Att skanna nya kvitton kräver ",
    cancelBullet2Strong: "en aktiv prenumeration",
    cancelBullet2Post: ".",
    cancelBullet3Pre: "Har ditt företag teammedlemmar kan du behöva ",
    cancelBullet3Strong: "minska teamets storlek",
    cancelBullet3Post: " innan du nedgraderar.",
    cancelAccept: "Jag förstår — min data raderas ett år efter min sista betalning.",
    cancelAbort: "Behåll min prenumeration",
    cancelConfirm: "Avsluta prenumeration",
    toastCheckoutFail: "Kunde inte starta betalning",
    toastNetwork: "Nätverksfel",
    toastCancelScheduled: "Din prenumeration avslutas vid slutet av innevarande faktureringsperiod.",
    toastCancelFail: "Kunde inte avsluta prenumeration",
    toastQuoteThanks: "Tack — vi skickar en offert inom kort.",
    featUnlimitedScans: "Obegränsade skanningar",
    feat25Scans: "25 skanningar per månad",
    featBasicOcr: "AI-driven OCR",
    featCsv: "CSV-export",
    featFortnox: "Fortnox-integration",
    featSwedishVat: "Svensk moms (6/12/25 %)",
    featAuditLog: "7-årig revisionslogg",
    featAllPro: "Allt i Pro",
    featApprovals: "Attestflöden",
    featMileage: "Milersättning",
    featCarbon: "Koldioxidavtryck",
    featAllBusiness: "Allt i Företag",
    intFortnoxDesc: "Skicka godkända kvitton direkt till Fortnox som verifikationer.",
    intWaitingSync: "kvitton väntar på synk.",
    intUpsellTitle: "Fortnox-integration",
    intUpsellDesc: "Skicka kvitton direkt till Fortnox som verifikationer. Tillgängligt från Pro-planen.",
    intNote: "Bekräfta BAS-kontomappningen med din bokföringsbyrå innan du synkar för första gången.",
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
    statUsage: "Skanningsförbrukning",
    recentTitle: "Senaste kvitton",
    recentDesc: "Dina fem senaste kvitton",
    noReceiptsYet: "Inga kvitton ännu.",
    uploadFirst: "Ladda upp ditt första",
    unknownVendor: "Okänd leverantör",
    usageUnlimitedPlan: "Obegränsat i din plan",
    usageOf: "av",
    usageUsedWord: "använda",
    usagePercentUsed: "använt",
    idleTitle: "Din session håller på att löpa ut",
    idleStay: "Stanna inloggad",
    idleLogout: "Logga ut",
    receiptApprove: "Godkänn",
    receiptDelete: "Ta bort",
    receiptDeleteConfirm: "Ta bort detta kvitto? Detta går inte att ångra.",
    colActions: "Åtgärder",
    receiptCancel: "Avbryt",
    receiptsSubtitle: "Ladda upp, granska och exportera dina kvitton",
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
    receiptNone: "Inga kvitton ännu. Ladda upp ditt första med knappen ovan.",
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
    scansThisMonth: "Skanningar använda denna månad",
    unlimited: "obegränsat",
    dashWelcome: "Välkommen tillbaka",
    dashPremiumEndedTitle: "Din prenumeration har avslutats",
    dashPremiumEndedBody: "Uppgradera till ett betalt paket för att fortsätta skanna kvitton och använda premiumfunktioner.",
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
      "Sluta mata in kvitton för hand. Utlagg läser leverantör, datum, momssats och BAS-konto från bilden — och sparar allt lagstadgat och Skatteverket-redo i sju år.",
    heroCtaPrimary: "Starta gratis",
    heroCtaSecondary: "Se priser",
    heroDisclaimer: "25 kvitton/mån gratis — inget kort krävs",
    loading3D: "Laddar 3D…",

    // Features
    featuresHeadline: "Allt ett svenskt företag behöver för att hantera utlägg — utan det manuella arbetet.",
    feature1Title: "AI-skanning av kvitton",
    feature1Body:
      "Fota eller ladda upp ett kvitto. Leverantör, datum, belopp och moms läses in och fylls i automatiskt — oftast på under fem sekunder.",
    feature2Title: "Svensk moms, automatiskt",
    feature2Body:
      "6, 12 och 25 % detekteras och tillämpas korrekt, inklusive den tillfälliga matmomsen 2026–2027.",
    feature3Title: "BAS-kontomappning",
    feature3Body:
      "Varje utlägg mappas till rätt BAS-konto. Sök, ändra eller låt AI:n föreslå — du bestämmer.",
    feature4Title: "7-årig revisionslogg",
    feature4Body:
      "Varje kvitto, åtgärd, tidsstämpel och IP sparas i sju år i enlighet med Bokföringslagen.",
    feature5Title: "Redo för Skatteverket",
    feature5Body:
      "Exportera valfri period som CSV, PDF eller SIE4 — i det format din revisor och Skatteverket behöver.",
    feature6Title: "Transport och milersättning",
    feature6Body:
      "Registrera periodbiljetter och tjänsteresor. Milersättning beräknas automatiskt enligt Skatteverkets aktuella schablonsats.",

    // Pricing
    pricingTagline: "Priser",
    pricingTitle: "Ett pris per företag. Inga kostnader per användare.",
    pricingPopular: "Populärast",
    pricingContactUs: "Kontakta oss",
    pricingLoading: "Laddar…",
    pricingChoosePlan: "Välj",

    // Plan features
    planFreeFeatures: [
      "25 kvitton/månad",
      "AI-driven OCR",
      "CSV-export",
    ],
    planProFeatures: [
      "Obegränsade kvitton",
      "Fortnox-integration",
      "Svensk moms (6/12/25 %)",
      "7-årig revisionslogg",
    ],
    planBusinessFeatures: [
      "Allt i Pro",
      "Attestflöden",
      "Milersättning",
      "Koldioxidavtryck",
    ],
    planEnterpriseFeatures: ["Allt i Företag", "SSO", "API-åtkomst", "White-label"],

    // Footer
    footerTitle: "Utlagg",
    footerDescription:
      "Kvittohantering byggd för svensk moms, BAS-kontoplan och sju års regelefterlevnad.",
    footerGDPR: "GDPR-säker",
    footerAudit: "7-årig revisionslogg",
    footerCopyright: "© {year} GlorifyTC.",
    footerDisclaimer:
      "Stäm av moms- och bokföringsregler med din revisor. Utlagg automatiserar inläsningen — du ansvarar alltid för de slutliga siffrorna.",

    featuresPageSubtitle: "Byggt för svenska företag, enskilda firmor och redovisningsbyråer.",
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
    featuresCompareDataLabel: "Datalagring",
    featuresCompareDataUtlagg: "Sverige",
    featuresCompareDataTraditional: "EU eller USA",
    featuresCtaTitle: "Se det på nära håll",
    featuresCtaBody: "Skapa ett gratis konto och ladda upp ditt första kvitto. Inget kort, ingen bindningstid.",
    pricingPageSubtitle: "Börja gratis. Skala när du växer. Alla paket inkluderar obegränsad kvittolagring och sju års regelefterlevnad.",
    pricingComparisonTitle: "Fullständig funktionsjämförelse",
    pricingFaqTitle: "Vanliga frågor",
    pricingBottomTitle: "Kom igång med gratisplanen",
    pricingBottomSubtitle: "Inget kort behövs. Uppgradera när som helst.",
    pricingCalloutSubtitle: "Gratisplan tillgänglig — inget kort krävs.",
    pricingFaq1Q: "Kan jag byta paket senare?",
    pricingFaq1A: "Ja. Uppgradera eller nedgradera när som helst. Nedgradering träder i kraft vid starten av nästa faktureringsperiod.",
    pricingFaq2Q: "Finns det någon bindningstid?",
    pricingFaq2A: "Nej. Alla betalda paket faktureras månadsvis utan bindningstid. Avsluta när som helst från dina kontoinställningar.",
    pricingFaq3Q: "Hanterar ni icke-svenska kvitton?",
    pricingFaq3A: "Ja. Vår OCR-modell hanterar kvitton på svenska, engelska, norska, danska, finska och tyska — med automatisk valutaomvandling.",
    pricingFaq4Q: "Hur fungerar provperioden?",
    pricingFaq4A: "Pro-paketet inkluderar 14 dagars gratis provperiod. Ingen debitering förrän provperioden löper ut. Du kan nedgradera till Gratis under provperioden och behålla din data.",
    pricingTableReceipts: "Kvitton per månad",
    pricingTableMembers: "Teammedlemmar",
    pricingTableOcr: "AI-OCR",
    pricingTableBas: "BAS-autokategorisering",
    pricingTableCurrency: "Flera valutor",
    pricingTableSie4: "SIE4-export",
    pricingTableSync: "Fortnox / Visma / Bokio-synk",
    pricingTableRoles: "Rollbaserad åtkomst",
    pricingTableLimits: "Beloppsgränser",
    pricingTableOnboarding: "Anpassad onboarding",
    pricingTableSupport: "Prioriterad support",
  },
  en: {
    rcScanningLocally: "Reading receipt locally…",
    rcScanningServer: "Trying a more accurate read…",
    rcLocalLowConfidence: "Scanned with limited confidence — please review the fields before saving.",
    rcLowConfidence: "Some fields may be inaccurate — please review them before saving.",
    fortnoxReviewTitle: "Review before syncing to Fortnox",
    fortnoxReviewDesc: "Select the approved receipts to send. Nothing is synced until you confirm.",
    fortnoxSelectAll: "Select all",
    fortnoxDeselectAll: "Deselect all",
    fortnoxNoneSelected: "No receipts selected",
    fortnoxNonePending: "No approved receipts waiting to sync",
    fortnoxSyncSelected: "Send selected",
    fortnoxSelectedCount: "selected",
    dashExportHint: "Download all receipts, mileage logs, and transport passes for any reporting period",
    navExport: "Export",
    expPeriodTitle: "Select export period",
    expPeriodDesc: "Choose the period you need to report — for example a VAT month or a quarter — then download receipts, mileage logs, and transport passes in one go.",
    expThisMonth: "This month",
    expLastMonth: "Last month",
    expThisQuarter: "This quarter",
    expLastQuarter: "Last quarter",
    expThisYear: "This year",
    expCustom: "Custom period",
    expFrom: "From",
    expTo: "To",
    expDownloadReceipts: "Receipts",
    expDownloadMileage: "Mileage log",
    expDownloadTransport: "Transport passes",
    expDownloadAll: "Download all for this period",
    rcCategoryAutoDetected: "Auto-detected",
    stRangeMonth: "Month",
    stRangeYear: "Year",
    stAvgPerReceipt: "Avg per receipt",
    stTopCategory: "Top category",
    stByCategory: "Spending by category",
    stTrend: "Trend over time",
    stTheme: "Color theme",
    stNoCategoryData: "No categorized receipts yet",
    stBucketFood: "Food & dining",
    stBucketTravel: "Travel & transport",
    stBucketOffice: "Office & premises",
    stBucketIt: "IT & software",
    stBucketMarketing: "Marketing",
    stBucketProfessional: "Professional services",
    stBucketOther: "Other",
    stShareOfTotal: "of total spend",
    milExample: "Example",
    milExampleHint: "This is what a saved route looks like — save your first one above.",
    milExampleLabel: "Home–Office",
    milExampleFrom: "Home address 1",
    milExampleTo: "The office",
    milRoutesTitle: "Recurring trips",
    milRoutesDesc: "Save frequently driven routes and log them with a single click — or for an entire period at once.",
    milRouteLabel: "Route name",
    milRouteLabelPh: "e.g. Home–Office",
    milSaveRoute: "Save current as route",
    milRouteSaved: "Route saved",
    milRouteNeedTrip: "Fill in from, to, distance and a name first.",
    milNoRoutes: "No saved routes yet.",
    milLogToday: "Log today",
    milLogPeriod: "Period…",
    milPeriodFrom: "From",
    milPeriodTo: "To",
    milWeekdays: "Weekdays",
    milLogN: "Log {n} trips",
    milLoggedN: "{n} trips logged",
    milNoDates: "No dates selected",
    milDowMon: "Mo",
    milDowTue: "Tu",
    milDowWed: "We",
    milDowThu: "Th",
    milDowFri: "Fr",
    milDowSat: "Sa",
    milDowSun: "Su",
    milTripsLogged: "Trip logged",
    annArm: "Fix a field",
    annArmed: "Draw a box over: {field}",
    annCancel: "Cancel",
    annScroll: "Scroll freely. Tap \"Fix a field\" to correct a value.",
    navTransport: "Public transport",
    trTitle: "Public transport",
    trSubtitle: "Log your transit passes once — no need to enter every trip.",
    trQuickTitle: "Add this month's pass",
    trQuickDesc: "Have a recurring monthly pass? Add it for this month in one click.",
    trQuickBtn: "Add for {month}",
    trNewTitle: "New monthly / period pass",
    trType: "Pass type",
    trTypeMonthly: "Monthly",
    trTypeYearly: "Yearly",
    trTypeSingle: "Single",
    trProvider: "Transit operator",
    trProviderOtherLabel: "Other — name",
    trAmount: "Amount (SEK)",
    trValidFrom: "Valid from",
    trValidTo: "Valid to",
    trRecurring: "Recurring every month",
    trSave: "Save pass",
    trSaved: "Pass saved",
    trSaveFail: "Could not save",
    trListTitle: "My passes",
    trColPeriod: "Period",
    trColProvider: "Operator",
    trColAmount: "Amount",
    trColVat: "VAT",
    trColStatus: "Status",
    trRecurringTag: "Recurring",
    trOnceTag: "One-off",
    trEmpty: "No passes yet.",
    trExportTitle: "Export for the Tax Agency",
    trExportDesc: "All passes for the period, ready for your tax return.",
    trExportBtn: "Export (CSV)",
    trVatNote: "Public transport carries 6% VAT — calculated automatically.",
    milVehicle: "Vehicle",
    milPrivateCar: "Private car",
    milVehicleNote: "Private car: 2.50 kr/km · Company car: 1.20 kr/km · Electric (company): 0.95 kr/km",
    milManageVehicles: "Manage company vehicles",
    milAddVehicle: "Add vehicle",
    milRegNr: "Registration number",
    milModel: "Model",
    milFuel: "Fuel",
    milFuelPetrol: "Petrol",
    milFuelDiesel: "Diesel",
    milFuelHybrid: "Hybrid",
    milFuelElectric: "Electric",
    milVehicleAdded: "Vehicle added",
    milVehicleFail: "Could not add vehicle",
    milRegNrInvalid: "Invalid registration number – use ABC123 or ABC12A",
    milElectricTag: "Electric",
    milAdminOnly: "Only admins can add vehicles.",
    annModeMark: "Mark",
    annModeMove: "Pan",
    annTip: "Zoom in first — it makes hitting small fields much easier on mobile.",
    annFieldVatRate: "VAT rate",
    annTitle: "Wrong value? Fix it directly on the receipt",
    annDesc: "Select a field, then draw a box around the correct value on the receipt image. The AI re-reads that area precisely — and your correction helps train the model for Swedish receipts.",
    annHint: "Draw a selection box over the value in the image",
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
    howTitle: "From photo to filed receipt — in under a minute",
    howStep1Title: "Photograph",
    howStep1Body: "Take a photo or upload an image. The AI reads vendor, date, VAT rate, and amount in seconds.",
    howStep2Title: "Confirm",
    howStep2Body: "Check the pre-filled fields and adjust if needed. Assign a BAS account and save.",
    howStep3Title: "Export",
    howStep3Body: "Download as CSV, PDF, or SIE4, or sync directly to Fortnox — formatted for your accountant and Skatteverket.",
    footerProduct: "Product",
    footerCompany: "Company",
    footerLegal: "Legal",
    footerTerms: "Terms",
    footerPrivacy: "Privacy policy",
    aboutKicker: "About Utlagg",
    aboutTitle: "Built in Sweden, for Swedish rules.",
    aboutLead: "Utlagg handles receipts and expenses for Swedish businesses — with VAT, BAS accounts, and Skatteverket requirements built in from day one, not added as an afterthought.",
    aboutStoryTitle: "Why we built Utlagg",
    aboutStoryBody: "Most expense tools are designed for an international market. They don't know Swedish VAT, reverse-charge construction tax, or the Bookkeeping Act's seven-year archiving requirement. We were tired of correcting the same mistakes every month. Utlagg reads the receipt, applies the right VAT rate and BAS account, and keeps the record for seven years — so the books are accurate from the start.",
    aboutValuesTitle: "What we stand for",
    aboutVal1Title: "Compliance first",
    aboutVal1Body: "Swedish VAT rules, the BAS chart of accounts, and the Bookkeeping Act aren't optional extras — they're the foundation the product is built on.",
    aboutVal2Title: "No surprises",
    aboutVal2Body: "Transparent pricing, no lock-in, and your data is yours. Export everything and cancel at any time.",
    aboutVal3Title: "Real privacy",
    aboutVal3Body: "GDPR-compliant handling and encryption throughout. Your receipts stay under your control.",
    aboutStatsTitle: "Built for Swedish bookkeeping",
    aboutStat1Val: "6/12/25%",
    aboutStat1Label: "Swedish VAT rates, date-aware",
    aboutStat2Val: "2.50 kr/km",
    aboutStat2Label: "Tax-free mileage",
    aboutStat3Val: "7 years",
    aboutStat3Label: "Archive per the Bookkeeping Act",
    aboutCtaTitle: "Ready to take the hassle out of expenses?",
    aboutCtaBody: "Create a free account in minutes. No credit card needed.",
    contactKicker: "Contact",
    contactTitle: "Get in touch.",
    contactLead: "Questions about the product, pricing, or your accounting? We reply within one business day.",
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
    invViewDisclaimer: "Utlagg provides this template and stores the invoice. You are responsible for its content and accuracy.",
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
    prTitle: "Profile",
    prNameTitle: "Name",
    prNameDesc: "Your name is shown on receipts and invoices",
    fldName: "Name",
    prEmailLabel: "Email:",
    btnSaveChanges: "Save changes",
    prChangePw: "Change password",
    prPwDesc: "Use a strong password (minimum 8 characters)",
    fldCurrentPw: "Current password",
    fldNewPw: "New password",
    fldConfirmPw: "Confirm new password",
    btnChangePw: "Change password",
    prDeleteDesc: "Deleting your account permanently removes all your receipts, invoices, and data.",
    prSureTitle: "This cannot be undone",
    prSureDesc: "All receipts, invoices, and account data are permanently deleted. There is no way to recover them.",
    prConfirmDelete: "Yes, permanently delete my account",
    stSubtitle: "A breakdown of your receipts, spending, and VAT",
    stTotalVat: "Total VAT",
    stPerMonth: "Receipts per month",
    stLastSixMonths: "Last six months",
    stNoData: "No data to show yet. Add receipts to see your spending overview.",
    toastFillAddresses: "Fill in addresses and distance",
    toastTripSaved: "Trip saved",
    milUpsellDesc: "Log business trips and calculate tax-free mileage reimbursements automatically. Included in the Business plan.",
    milRatePre: "Tax-free rate, private car:",
    milRateNote: "(2.50 kr/km — Swedish Tax Agency 2026)",
    milNewTrip: "New trip",
    milNewTripDesc: "Enter the distance in kilometres. The reimbursement amount is calculated automatically.",
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
    milManualNote: "Distance must be entered manually. Automatic route calculation via Google Maps or OpenRouteService requires an API key, which is not configured for this account.",
    promptComment: "Comment (optional):",
    promptReason: "Reason for rejection:",
    toastApproved: "Approved",
    toastRejected: "Rejected",
    toastDecisionFail: "Could not save the decision",
    apWaiting: "Pending your approval",
    apWaitingDesc: "Requests sent to your email address",
    apNoneWaiting: "Nothing waiting for your approval.",
    toastSelectReceiptApprover: "Select a receipt and approver",
    toastSubmitted: "Submitted for approval",
    toastSubmitFail: "Could not submit",
    apUpsellTitle: "Approval workflows",
    apUpsellDesc: "Submit expenses for sign-off and track approvals in one place. Included in the Business plan.",
    apRequest: "New request",
    apRequestDesc: "Select a receipt and the person who needs to approve it",
    fldReceipt: "Receipt",
    phSelectReceipt: "Select a receipt…",
    unknownShort: "Unknown",
    fldApproverEmail: "Approver's email",
    fldComment: "Comment",
    phOptional: "Optional",
    apSubmitNote: "The approver will see this request the next time they log in with that email address.",
    setAppearance: "Appearance",
    setAppearanceDesc: "Switch between light and dark mode",
    setSwitchToLight: "Switch to light mode",
    setSwitchToDark: "Switch to dark mode",
    setCompanyDesc: "Displayed on exports, reports, and records",
    fldCompanyName: "Company name",
    phCompany: "Your Company Ltd",
    setExportTitle: "Export & integrations",
    setExportDesc: "Download your data or connect your accounting software",
    setSkvTitle: "Tax Agency export (Pro)",
    setSkvDesc: "Select a period and download all receipts with VAT amounts and BAS account codes",
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
    coCreateDesc: "Set up a company workspace to invite team members and manage shared expenses.",
    fldOrgNumber: "Company registration number",
    fldVatNumber: "VAT number",
    coMembers: "Members",
    coYourRole: "Your role:",
    roleMember: "Member",
    roleApprover: "Approver",
    roleAdmin: "Admin",
    coInviteDesc: "An invitation email will be sent. The link expires after 7 days.",
    fldEmail: "Email",
    fldRole: "Role",
    invUpsellTitle: "Invoicing",
    invUpsellDesc: "Create and send professional invoices, including reverse-charge construction VAT. Available from the Pro plan.",
    invNeedCompanyTitle: "Set up a company first",
    invNeedCompanyDesc: "Invoice seller details (name and registration number) are pulled from your company profile.",
    invNoneYet: "No invoices yet.",
    invColNr: "No.",
    invColCustomer: "Customer",
    invColDate: "Date",
    invColAmount: "Amount",
    invColVat: "VAT",
    invReverse: "Reverse",
    invDisclaimer: "Utlagg provides the template and stores your invoice. You are responsible for the accuracy of all details.",
    invDeleteConfirm: "Delete this invoice? This cannot be undone.",
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
    invLinesDesc: "Enter prices excluding VAT.",
    phDescription: "Description",
    phQuantity: "Qty",
    phUnitPrice: "Unit price",
    ariaRemoveRow: "Remove row",
    invReversePre: "Reverse charge (construction services) — the invoice is issued without VAT and carries the text",
    invReversePost: "The buyer's VAT or registration number is required.",
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
    subManageDesc: "Manage your plan, billing, and invoices",
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
    cancelTitle: "Cancel your subscription?",
    cancelIntro: "Please read through the following before proceeding:",
    cancelBullet1Pre: "Your receipts and invoices are kept for ",
    cancelBullet1Strong: "1 year from your last payment date",
    cancelBullet1Post: ", then permanently deleted.",
    cancelBullet2Pre: "Scanning new receipts requires ",
    cancelBullet2Strong: "an active subscription",
    cancelBullet2Post: ".",
    cancelBullet3Pre: "If your company has team members, you may need to ",
    cancelBullet3Strong: "reduce team size",
    cancelBullet3Post: " before downgrading.",
    cancelAccept: "I understand — my data will be deleted one year after my last payment.",
    cancelAbort: "Keep my subscription",
    cancelConfirm: "Cancel subscription",
    toastCheckoutFail: "Could not start checkout",
    toastNetwork: "Network error",
    toastCancelScheduled: "Your subscription is scheduled to end at the close of this billing period.",
    toastCancelFail: "Could not cancel subscription",
    toastQuoteThanks: "Thanks — we'll send over a quote shortly.",
    featUnlimitedScans: "Unlimited receipt scans",
    feat25Scans: "25 scans per month",
    featBasicOcr: "AI-powered OCR",
    featCsv: "CSV export",
    featFortnox: "Fortnox integration",
    featSwedishVat: "Swedish VAT (6/12/25%)",
    featAuditLog: "7-year audit log",
    featAllPro: "Everything in Pro",
    featApprovals: "Approval workflows",
    featMileage: "Mileage reimbursement",
    featCarbon: "Carbon footprint tracking",
    featAllBusiness: "Everything in Business",
    intFortnoxDesc: "Sync approved receipts directly to Fortnox as bookkeeping entries.",
    intWaitingSync: "receipts waiting to sync.",
    intUpsellTitle: "Fortnox integration",
    intUpsellDesc: "Push receipts directly to Fortnox as bookkeeping entries. Available from the Pro plan.",
    intNote: "Before syncing for the first time, confirm the BAS account mapping with your accountant.",
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
    statUsage: "Scan usage",
    recentTitle: "Recent receipts",
    recentDesc: "Your five most recent receipts",
    noReceiptsYet: "No receipts yet.",
    uploadFirst: "Upload your first",
    unknownVendor: "Unknown supplier",
    usageUnlimitedPlan: "Unlimited in your plan",
    usageOf: "of",
    usageUsedWord: "used",
    usagePercentUsed: "used",
    idleTitle: "Your session is about to expire",
    idleStay: "Stay logged in",
    idleLogout: "Log out",
    receiptApprove: "Approve",
    receiptDelete: "Delete",
    receiptDeleteConfirm: "Delete this receipt? This cannot be undone.",
    colActions: "Actions",
    receiptCancel: "Cancel",
    receiptsSubtitle: "Upload, review, and export your receipts",
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
    receiptNone: "No receipts yet. Use the upload button above to add your first.",
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
    scansThisMonth: "Scans used this month",
    unlimited: "unlimited",
    dashWelcome: "Welcome back",
    dashPremiumEndedTitle: "Your subscription has ended",
    dashPremiumEndedBody: "Upgrade to a paid plan to continue scanning receipts and accessing premium features.",
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
      "Stop typing receipts by hand. Utlagg reads vendor, date, VAT rate, and BAS account from your photo — then keeps everything compliant and ready for Skatteverket for 7 years.",
    heroCtaPrimary: "Start free",
    heroCtaSecondary: "See pricing",
    heroDisclaimer: "25 receipts/month free — no credit card needed",
    loading3D: "Loading 3D…",

    // Features
    featuresHeadline:
      "Everything a Swedish business needs to handle expenses — without the manual work.",
    feature1Title: "AI receipt scanning",
    feature1Body:
      "Photograph or upload a receipt. Vendor, date, amount, and VAT are read and filled in automatically — usually in under five seconds.",
    feature2Title: "Swedish VAT, automatically",
    feature2Body:
      "6, 12, and 25% VAT rates are detected and applied correctly, including the temporary food VAT rate for 2026–2027.",
    feature3Title: "BAS account mapping",
    feature3Body:
      "Every expense is mapped to the correct BAS account. Search, override, or let the AI suggest — your choice.",
    feature4Title: "7-year compliant archive",
    feature4Body:
      "Every receipt, action, timestamp, and IP is stored for seven years as required by the Swedish Accounting Act.",
    feature5Title: "Ready for Skatteverket",
    feature5Body:
      "Export any period as CSV, PDF, or SIE4 — formatted exactly as your accountant and the Tax Agency need it.",
    feature6Title: "Transport & mileage",
    feature6Body:
      "Log public transport passes and business trips. Mileage reimbursements are calculated at the current Swedish Tax Agency rate automatically.",

    // Pricing
    pricingTagline: "Pricing",
    pricingTitle: "One price per company. No per-seat surprises.",
    pricingPopular: "Most popular",
    pricingContactUs: "Contact us",
    pricingLoading: "Loading…",
    pricingChoosePlan: "Choose",

    // Plan features
    planFreeFeatures: ["25 receipts/month", "AI-powered OCR", "CSV export"],
    planProFeatures: [
      "Unlimited receipts",
      "Fortnox integration",
      "Swedish VAT (6/12/25%)",
      "7-year compliant archive",
    ],
    planBusinessFeatures: [
      "Everything in Pro",
      "Approval workflows",
      "Mileage reimbursement",
      "Carbon footprint tracking",
    ],
    planEnterpriseFeatures: [
      "Everything in Business",
      "SSO",
      "API access",
      "White-label",
    ],

    // Footer
    footerTitle: "Utlagg",
    footerDescription:
      "Receipt management built for Swedish VAT, BAS accounts, and seven-year compliance.",
    footerGDPR: "GDPR-compliant",
    footerAudit: "7-year compliant archive",
    footerCopyright: "© {year} GlorifyTC.",
    footerDisclaimer:
      "Verify VAT and bookkeeping rules with your accountant. Utlagg automates the capture — you remain responsible for the final figures.",

    featuresPageSubtitle: "Purpose-built for Swedish companies, sole traders, and accounting firms.",
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
    featuresCompareDataLabel: "Data residency",
    featuresCompareDataUtlagg: "Sweden",
    featuresCompareDataTraditional: "EU or US",
    featuresCtaTitle: "See it for yourself",
    featuresCtaBody: "Create a free account and upload your first receipt. No credit card, no commitment.",
    pricingPageSubtitle: "Start free. Scale as you grow. Every plan includes unlimited receipt storage and seven years of compliant archiving.",
    pricingComparisonTitle: "Full feature comparison",
    pricingFaqTitle: "Common questions",
    pricingBottomTitle: "Get started with the free plan",
    pricingBottomSubtitle: "No credit card needed. Upgrade any time.",
    pricingCalloutSubtitle: "Free plan available — no credit card required.",
    pricingFaq1Q: "Can I switch plans later?",
    pricingFaq1A: "Yes. Upgrade or downgrade at any time. Downgrades take effect at the start of your next billing period.",
    pricingFaq2Q: "Is there a minimum commitment?",
    pricingFaq2A: "No. All paid plans are billed monthly, with no lock-in. Cancel anytime from your account settings.",
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
    pricingTableRoles: "Role-based access",
    pricingTableLimits: "Spending limits",
    pricingTableOnboarding: "Custom onboarding",
    pricingTableSupport: "Priority support",
  },
};
