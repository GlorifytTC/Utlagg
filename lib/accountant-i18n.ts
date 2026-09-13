import type { Lang } from "@/lib/translations";

/**
 * Scoped SV/EN strings for the accountant workspace. Keyed by the existing
 * language context (useLanguage().lang), so the accountant UI is fully
 * bilingual without bloating the app-wide translations file. Use via
 * useAccountantStrings().
 */
const strings = {
  sv: {
    navOverview: "Översikt",
    navDiscover: "Upptäck företag",
    navRequests: "Förfrågningar",

    overviewTitle: "Översikt",
    overviewSubtitle: "Ditt arbete idag och nya möjligheter.",

    // Work queue (hero)
    todoTitle: "Att göra",
    todoEmpty: "Inget väntar på dig — allt är granskat. Bra jobbat!",
    todoToReview: "Kvitton att granska",
    todoMissingInfo: "Saknar moms/kategori/BAS",
    todoLowConfidence: "Osäkra AI-avläsningar",
    todoPending: "Väntar på godkännande",

    // Clients
    clientsTitle: "Mina klienter",
    clientsNeedsAttention: "att granska",
    clientsAllClear: "Inget att granska",
    clientsEmpty: "Inga klienter ännu",
    clientsEmptyHint:
      "När ett företag kopplar dig som revisor dyker det upp här. Se även Förfrågningar och Upptäck företag.",
    openClient: "Öppna",

    // Activity
    activityTitle: "Din aktivitet",
    activityReviewedWeek: "granskade den här veckan",
    activityReviewedMonth: "granskade den här månaden",
    activityNone: "Ingen aktivitet ännu.",

    // Growth section
    growthTitle: "Väx din byrå",
    discoverTitle: "Företag som söker revisor",
    discoverViewAll: "Visa alla",

    // Boost
    boostTitle: "Boosta din synlighet",
    boostDesc: "Få fler möjligheter att bli hittad av företag som söker revisor.",
    boostPrice: "49 kr · 7 dagar · engångsbetalning",
    boostCta: "Boosta min profil",
    boostActive: "Boostad",
    boostActiveDesc: "Din profil får ökad synlighet bland relevanta företag.",
    boostActiveUntil: "Aktiv till:",
    boostDaysLeft: "dagar kvar",
    boostProcessing: "Betalningen behandlas…",
    boostCancelled: "Köpet avbröts.",
    boostOpening: "Öppnar…",

    // Profile menu
    menuProfile: "Profil & logotyp",
    menuAccount: "Till mitt konto",
    menuLogout: "Logga ut",
    menuProfilePic: "Profilbild",
    menuFirmLogo: "Byråns logotyp",

    loading: "Laddar…",
    error: "Något gick fel.",
  },
  en: {
    navOverview: "Overview",
    navDiscover: "Discover companies",
    navRequests: "Requests",

    overviewTitle: "Overview",
    overviewSubtitle: "Your work today and new opportunities.",

    todoTitle: "To do",
    todoEmpty: "Nothing waiting — everything is reviewed. Nice work!",
    todoToReview: "Receipts to review",
    todoMissingInfo: "Missing VAT/category/BAS",
    todoLowConfidence: "Uncertain AI reads",
    todoPending: "Awaiting approval",

    clientsTitle: "My clients",
    clientsNeedsAttention: "to review",
    clientsAllClear: "Nothing to review",
    clientsEmpty: "No clients yet",
    clientsEmptyHint:
      "When a company connects you as their accountant it shows up here. Also check Requests and Discover companies.",
    openClient: "Open",

    activityTitle: "Your activity",
    activityReviewedWeek: "reviewed this week",
    activityReviewedMonth: "reviewed this month",
    activityNone: "No activity yet.",

    growthTitle: "Grow your firm",
    discoverTitle: "Companies looking for an accountant",
    discoverViewAll: "View all",

    boostTitle: "Boost your visibility",
    boostDesc: "Get more chances to be found by companies looking for an accountant.",
    boostPrice: "49 kr · 7 days · one-time",
    boostCta: "Boost my profile",
    boostActive: "Boosted",
    boostActiveDesc: "Your profile gets increased visibility among relevant companies.",
    boostActiveUntil: "Active until:",
    boostDaysLeft: "days left",
    boostProcessing: "Processing payment…",
    boostCancelled: "Purchase cancelled.",
    boostOpening: "Opening…",

    menuProfile: "Profile & logo",
    menuAccount: "To my account",
    menuLogout: "Sign out",
    menuProfilePic: "Profile picture",
    menuFirmLogo: "Firm logo",

    loading: "Loading…",
    error: "Something went wrong.",
  },
};

export type AccountantStrings = Record<keyof (typeof strings)["sv"], string>;

export function accountantStrings(lang: Lang): AccountantStrings {
  return strings[lang] ?? strings.sv;
}
