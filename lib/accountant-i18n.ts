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
    navMarketplace: "Marknadsplatsen",
    navRequests: "Förfrågningar",
    sidebarSubtitle: "Revisorspanel",
    chatTitle: "Chatt",

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
    marketplaceTitle: "Din synlighet i marknadsplatsen",
    marketplaceViewAll: "Visa marknadsplatsen",

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

    // Team / firm management
    navChats: "Chattar",
    navTeam: "Team",
    teamTitle: "Byråns team",
    teamSubtitle: "Hantera medarbetare och vilka kunder de arbetar med.",
    teamMembers: "Medarbetare",
    teamInvite: "Bjud in medarbetare",
    teamInviteEmail: "E-postadress",
    teamInviteRole: "Roll",
    teamRoleOwner: "Ägare",
    teamRoleAdmin: "Administratör",
    teamRoleMember: "Medarbetare",
    teamPending: "Väntande inbjudningar",
    teamRemove: "Ta bort",
    teamRemoveConfirm: "Ta bort medarbetaren?",
    teamSend: "Skicka inbjudan",
    teamNoMembers: "Inga medarbetare ännu.",
    teamAssignments: "Kunduppdrag",
    teamAssignTitle: "Koppla kund till medarbetare",
    teamAssignHint: "Medarbetare ser bara kunder de kopplats till. Ägare och administratörer ser alla.",
    teamAssign: "Koppla",
    teamUnassign: "Koppla bort",
    teamAssignedTo: "Kopplade medarbetare",
    teamNoAssignments: "Ingen medarbetare kopplad än.",
    teamOnlyOwnerRemove: "Endast ägaren kan ta bort en kund.",

    // Firm stats dashboard
    firmStatsTitle: "Nyckeltal",
    firmStatsClients: "Aktiva klienter",
    firmStatsPending: "Väntar på granskning",
    firmStatsMonthAmount: "Spenderat denna månad",
    firmStatsMonthVat: "Moms denna månad",
    firmStatsNeedsAttention: "Behöver åtgärd",
    firmStatsAllClear: "Alla klienter är i ordning ✓",
    firmStatsCategories: "Utgifter denna månad",
    firmStatsThroughput: "Granskade kvitton (12 månader)",
    firmStatsPendingLabel: "väntande",

    // Per-client stats dashboard
    clientStatsMonthAmount: "Spenderat denna månad",
    clientStatsMonthVat: "Moms denna månad",
    clientStatsApproved: "Kvitton denna månad",
    clientStatsPending: "Väntar på granskning",
    clientStatsCategories: "Utgiftsfördelning",
    clientStatsTrend: "Månadsöversikt (12 mån)",
    clientStatsRecent: "Senaste kvitton",
    clientStatsViewAll: "Visa alla kvitton",

    loading: "Laddar…",
    error: "Något gick fel.",
  },
  en: {
    navOverview: "Overview",
    navMarketplace: "Marketplace",
    navRequests: "Requests",
    sidebarSubtitle: "Accountant",
    chatTitle: "Chat",

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
    marketplaceTitle: "Your visibility in the marketplace",
    marketplaceViewAll: "View marketplace",

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

    // Team / firm management
    navChats: "Chats",
    navTeam: "Team",
    teamTitle: "Firm team",
    teamSubtitle: "Manage co-workers and which customers they work with.",
    teamMembers: "Co-workers",
    teamInvite: "Invite co-worker",
    teamInviteEmail: "Email address",
    teamInviteRole: "Role",
    teamRoleOwner: "Owner",
    teamRoleAdmin: "Administrator",
    teamRoleMember: "Co-worker",
    teamPending: "Pending invitations",
    teamRemove: "Remove",
    teamRemoveConfirm: "Remove this co-worker?",
    teamSend: "Send invite",
    teamNoMembers: "No co-workers yet.",
    teamAssignments: "Customer assignments",
    teamAssignTitle: "Assign a customer to a co-worker",
    teamAssignHint: "Co-workers only see customers assigned to them. Owner and admins see all.",
    teamAssign: "Assign",
    teamUnassign: "Unassign",
    teamAssignedTo: "Assigned co-workers",
    teamNoAssignments: "No co-worker assigned yet.",
    teamOnlyOwnerRemove: "Only the owner can remove a customer.",

    // Firm stats dashboard
    firmStatsTitle: "Key metrics",
    firmStatsClients: "Active clients",
    firmStatsPending: "Awaiting review",
    firmStatsMonthAmount: "Month spend",
    firmStatsMonthVat: "Month VAT",
    firmStatsNeedsAttention: "Needs attention",
    firmStatsAllClear: "All clients are up to date ✓",
    firmStatsCategories: "Expenses this month",
    firmStatsThroughput: "Reviewed receipts (12 months)",
    firmStatsPendingLabel: "pending",

    // Per-client stats dashboard
    clientStatsMonthAmount: "Month spend",
    clientStatsMonthVat: "Month VAT",
    clientStatsApproved: "Receipts this month",
    clientStatsPending: "Awaiting review",
    clientStatsCategories: "By category",
    clientStatsTrend: "Monthly overview (12 mo)",
    clientStatsRecent: "Recent receipts",
    clientStatsViewAll: "View all receipts",

    loading: "Loading…",
    error: "Something went wrong.",
  },
};

export type AccountantStrings = Record<keyof (typeof strings)["sv"], string>;

export function accountantStrings(lang: Lang): AccountantStrings {
  return strings[lang] ?? strings.sv;
}
