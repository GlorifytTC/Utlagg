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
}

export const strings: Record<Lang, Translations> = {
  sv: {
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
    planFree: "Gratis",
    planPro: "Pro",
    planBusiness: "Företag",
    planEnterprise: "Enterprise",

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
    planFree: "Free",
    planPro: "Pro",
    planBusiness: "Business",
    planEnterprise: "Enterprise",

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