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
}

export const strings: Record<Lang, Translations> = {
  sv: {
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
  },
  en: {
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
  },
};