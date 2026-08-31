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
  planStarter: string;
  planPro: string;
  planBusiness: string;
  planMax: string;
  planEnterprise: string;

  // Plan features
  planFreeFeatures: string[];
  planStarterFeatures: string[];
  planProFeatures: string[];
  planBusinessFeatures: string[];
  planMaxFeatures: string[];
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
  colCategory: string;
  receiptBack: string;
  receiptDetails: string;
  receiptNoImage: string;
  receiptNumberLabel: string;
  receiptCreatedLabel: string;
  receiptOpenImage: string;
  receiptPrev: string;
  receiptNext: string;
  receiptShowing: string;
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
  subPausedNotice: string;
  subGrantExpiredNotice: string;
  subManageBilling: string;
  toastPlanSwitched: string;
  toastPortalFail: string;
  invHistoryTitle: string;
  invHistoryDesc: string;
  invColNumber: string;
  invColStatus: string;
  invStatusPaid: string;
  invStatusOpen: string;
  invStatusFailed: string;
  invDownload: string;
  invPay: string;
  invEmpty: string;
  invLoadFail: string;
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
  apInboxTitle: string;
  apInboxDesc: string;
  apReceiptApproved: string;
  apReceiptRemoved: string;
  apFrom: string;
  apUnknownVendor: string;
  apDetailVendor: string;
  apDetailTotal: string;
  apDetailVat: string;
  apDetailDate: string;
  apDetailCategory: string;
  apDetailNumber: string;
  btnRemove: string;
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
  dashboard: string;
  logout: string;
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
  expAllTime: string;
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
  rcScanningAi: string;
  rcScanningServer: string;
  rcLocalLowConfidence: string;
  rcLowConfidence: string;
  cookieTitle: string;
  cookieBody: string;
  cookiePrivacyLink: string;
  cookieAcceptAll: string;
  cookieRejectAll: string;
  cookieManage: string;
  cookieSave: string;
  cookieAlwaysActive: string;
  cookieExamples: string;
  cookieRetention: string;
  cookieDataController: string;
  cookieDataControllerValue: string;
  cookieSupervisory: string;
  cookieGdprRights: string;
  cookieCatNecessaryLabel: string;
  cookieCatNecessaryBasis: string;
  cookieCatNecessaryDesc: string;
  cookieCatNecessaryExamples: string;
  cookieCatNecessaryRetention: string;
  cookieCatFunctionalLabel: string;
  cookieCatFunctionalBasis: string;
  cookieCatFunctionalDesc: string;
  cookieCatFunctionalExamples: string;
  cookieCatFunctionalRetention: string;
  cookieCatAnalyticsLabel: string;
  cookieCatAnalyticsBasis: string;
  cookieCatAnalyticsDesc: string;
  cookieCatAnalyticsExamples: string;
  cookieCatAnalyticsRetention: string;
  // Privacy policy page
  privTitle: string;
  privIntro: string;
  privUpdated: string;
  priv1Title: string;
  priv1P1: string;
  priv1ContactLabel: string;
  priv1P3: string;
  priv1DpaLink: string;
  priv2Title: string;
  priv2AccountLabel: string;
  priv2AccountDesc: string;
  priv2CompanyLabel: string;
  priv2CompanyDesc: string;
  priv2BookLabel: string;
  priv2BookDesc: string;
  priv2MileageLabel: string;
  priv2MileageDesc: string;
  priv2InvoiceLabel: string;
  priv2InvoiceDesc: string;
  priv2PaymentLabel: string;
  priv2PaymentDesc: string;
  priv2SupportLabel: string;
  priv2SupportDesc: string;
  priv2LogsLabel: string;
  priv2LogsDesc: string;
  priv3Title: string;
  priv3Col1: string;
  priv3Col2: string;
  priv3R1P: string; priv3R1B: string;
  priv3R2P: string; priv3R2B: string;
  priv3R3P: string; priv3R3B: string;
  priv3R4P: string; priv3R4B: string;
  priv3R5P: string; priv3R5B: string;
  priv3R6P: string; priv3R6B: string;
  priv3R7P: string; priv3R7B: string;
  priv3R8P: string; priv3R8B: string;
  priv3R9P: string; priv3R9B: string;
  priv3P1Pre: string;
  priv3DpaLink: string;
  priv3P1Post: string;
  priv3P2: string;
  priv4Title: string;
  priv4Intro: string;
  priv4OwnLabel: string;
  priv4Li1Strong: string;
  priv4Li1Rest: string;
  priv4OurLabel: string;
  priv4Li2Strong: string;
  priv4Li2Rest: string;
  priv4Li3Strong: string;
  priv4Li3Rest: string;
  priv4Li4Strong: string;
  priv4Li4Rest: string;
  priv4Li5Strong: string;
  priv4Li5Rest: string;
  priv4Li6Strong: string;
  priv4Li6Rest: string;
  priv4Li7Strong: string;
  priv4Li7Rest: string;
  priv5Title: string;
  priv5P1Pre: string;
  priv5P1Post: string;
  priv5Li1: string;
  priv5Li2: string;
  priv5Li3: string;
  priv5Li4: string;
  priv5Li5: string;
  priv5P2: string;
  priv6Title: string;
  priv6P1: string;
  priv6P2Pre: string;
  priv7Title: string;
  priv7P1Pre: string;
  priv7P1Post: string;
  priv7Li1Strong: string; priv7Li1Rest: string;
  priv7Li2Strong: string; priv7Li2Rest: string;
  priv7Li3Strong: string; priv7Li3Rest: string;
  priv7Li4Strong: string; priv7Li4Rest: string;
  priv7Li5Strong: string; priv7Li5Rest: string;
  priv7Li6Strong: string; priv7Li6Rest: string;
  priv7Li7Strong: string; priv7Li7Rest: string;
  priv8Title: string;
  priv8P1Pre: string;
  priv8ImyStrong: string;
  priv8P2: string;
  priv9Title: string;
  priv9P1: string;
  priv9P2: string;
  priv9MoreInfo: string;
  priv10Title: string;
  priv10P1: string;
  priv10P2: string;
  priv11Title: string;
  priv11P1: string;
  priv12Title: string;
  priv12P1: string;
  priv13Title: string;
  priv13P1Pre: string;
  priv13P2Pre: string;
  priv13DpaLink: string;
  priv13SubprocessorsLink: string;
  priv13And: string;
  priv13TermsLink: string;
  privFooter: string;
  // Terms of service page
  termsTitle: string;
  termsIntro: string;
  termsUpdated: string;
  terms1Title: string;
  terms1P1: string;
  terms1P2: string;
  terms2Title: string;
  terms2P1: string;
  terms2P2: string;
  terms2P3: string;
  terms3Title: string;
  terms3P1: string;
  terms3P2: string;
  terms3P3: string;
  terms4Title: string;
  terms4P1: string;
  terms4P2: string;
  terms4P3: string;
  terms5Title: string;
  terms5P1Pre: string;
  terms5P1Post: string;
  terms5P2: string;
  terms5P3: string;
  terms5P4: string;
  terms5P5Strong: string;
  terms5P5Rest: string;
  terms5P6Strong: string;
  terms5P6Rest: string;
  terms6Title: string;
  terms6P1: string;
  terms6P2: string;
  terms6P3Pre: string;
  terms6AngerLink: string;
  terms6P3Mid: string;
  terms6P3Post: string;
  terms7Title: string;
  terms7P1: string;
  terms7P2: string;
  terms7P3: string;
  terms7P4: string;
  terms7P5: string;
  terms7P6: string;
  terms7P7Strong: string;
  terms7P7Rest: string;
  terms8Title: string;
  terms8P1: string;
  terms8P2Pre: string;
  terms8PrivacyLink: string;
  terms8P2Post: string;
  terms8P3: string;
  terms9Title: string;
  terms9P1: string;
  terms9P2: string;
  terms10Title: string;
  terms10Intro: string;
  terms10Li1: string;
  terms10Li2: string;
  terms10Li3: string;
  terms10Li4: string;
  terms10Li5: string;
  terms10P2: string;
  terms11Title: string;
  terms11P1: string;
  terms11P2: string;
  terms12Title: string;
  terms12P1Pre: string;
  terms12PrivacyLink: string;
  terms12P1Mid: string;
  terms12DpaLink: string;
  terms12P1Post: string;
  terms12P2Pre: string;
  terms12P2Post: string;
  terms13Title: string;
  terms13P1: string;
  terms13P2: string;
  terms13P3: string;
  terms13P4: string;
  terms13P5: string;
  terms14Title: string;
  terms14P1: string;
  terms15Title: string;
  terms15P1: string;
  terms15P2: string;
  terms16Title: string;
  terms16P1: string;
  terms16P2: string;
  terms16P3: string;
  terms17Title: string;
  terms17P1: string;
  terms18Title: string;
  terms18P1: string;
  terms18P2: string;
  terms18P3Pre: string;
  terms18ArnStrong: string;
  terms18P3Mid: string;
  terms19Title: string;
  terms19P1: string;
  terms19P2: string;
  termsFooter: string;
}

export const strings: Record<Lang, Translations> = {
  sv: {
    rcScanningLocally: "Läser kvittot lokalt…",
    rcScanningAi: "Läser kvittot med AI…",
    rcScanningServer: "Försöker med bättre läsning…",
    rcLocalLowConfidence: "Läst lokalt med viss osäkerhet — kontrollera fälten.",
    rcLowConfidence: "Låg träffsäkerhet — kontrollera fälten innan du sparar.",
    fortnoxReviewTitle: "Granska innan synk",
    fortnoxReviewDesc: "Välj vilka godkända kvitton som ska skickas till Fortnox. Inget skickas automatiskt.",
    fortnoxSelectAll: "Markera alla",
    fortnoxDeselectAll: "Avmarkera alla",
    fortnoxNoneSelected: "Inga kvitton markerade",
    fortnoxNonePending: "Inga godkända kvitton väntar på att synkas",
    fortnoxSyncSelected: "Skicka markerade",
    fortnoxSelectedCount: "markerade",
    dashExportHint: "Ladda ner kvitton, körjournal och periodbiljetter för en period",
    navExport: "Exportera",
    expPeriodTitle: "Period för export",
    expPeriodDesc: "Välj perioden Skatteverket vill ha — t.ex. en momsmånad eller ett kvartal — och exportera kvitton, körjournal och periodbiljetter för samma period.",
    expThisMonth: "Denna månad",
    expLastMonth: "Förra månaden",
    expThisQuarter: "Detta kvartal",
    expLastQuarter: "Förra kvartalet",
    expThisYear: "Detta år",
    expAllTime: "Hela tiden",
    expCustom: "Anpassad period",
    expFrom: "Från",
    expTo: "Till",
    expDownloadReceipts: "Kvitton",
    expDownloadMileage: "Körjournal",
    expDownloadTransport: "Periodbiljetter",
    expDownloadAll: "Ladda ner allt för perioden",
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
    milRoutesDesc: "Spara en rutt du kör ofta och logga den med ett klick — eller för en hel period.",
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
    annArm: "Markera fält",
    annArmed: "Rita en ruta över: {field}",
    annCancel: "Avbryt",
    annScroll: "Bläddra fritt. Tryck \"Markera fält\" för att rätta ett värde.",
    navTransport: "Kollektivtrafik",
    trTitle: "Kollektivtrafik",
    trSubtitle: "Spara månadskort och periodbiljetter — logga inte varje resa.",
    trQuickTitle: "Lägg till denna månads kort",
    trQuickDesc: "Har du ett månadskort som återkommer? Lägg till det för innevarande månad med ett klick.",
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
    trExportDesc: "Alla periodbiljetter för året, redo för deklarationen.",
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
    annTip: "Tips: zooma in för att enklare träffa små fält på mobilen.",
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
    dashboard: "Kontrollpanel",
    logout: "Logga ut",
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
    aboutKicker: "Om Kvittino",
    aboutTitle: "Byggt i Sverige, för svenska regler.",
    aboutLead: "Kvittino gör kvittohantering och utlägg enkelt för svenska företag — med moms, BAS-konton och Skatteverket inbyggt från start, inte påklistrat i efterhand.",
    aboutStoryTitle: "Varför vi byggde Kvittino",
    aboutStoryBody: "De flesta utläggsverktyg är byggda för en internationell marknad och känner inte till svensk moms, omvänd byggskattskyldighet eller Bokföringslagens sjuåriga arkiveringskrav. Vi tröttnade på att rätta samma fel manuellt varje månad. Kvittino läser kvittot, fyller i rätt momssats och BAS-konto, och sparar underlaget i sju år — så att bokföringen stämmer redan från början.",
    aboutValuesTitle: "Vad vi står för",
    aboutVal1Title: "Regelverk först",
    aboutVal1Body: "Svensk moms, BAS-kontoplan och Bokföringslagen är inte tillval — de är grunden produkten är byggd på.",
    aboutVal2Title: "Inga överraskningar",
    aboutVal2Body: "Tydlig prissättning, ingen bindningstid och din data är din. Du kan exportera allt och säga upp när du vill.",
    aboutVal3Title: "Integritet på riktigt",
    aboutVal3Body: "GDPR-säker hantering och kryptering. Dina kvitton lämnar aldrig din kontroll i onödan.",
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
    invViewDisclaimer: "Mallen tillhandahålls av Kvittino. Du ansvarar själv för fakturans innehåll och korrekthet.",
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
    apInboxTitle: "Väntar på ditt godkännande",
    apInboxDesc: "Kvitton som medarbetare laddat upp och som du behöver godkänna.",
    apReceiptApproved: "Kvitto godkänt",
    apReceiptRemoved: "Kvitto borttaget",
    apFrom: "Från",
    apUnknownVendor: "Okänd leverantör",
    apDetailVendor: "Leverantör",
    apDetailTotal: "Totalt",
    apDetailVat: "Moms",
    apDetailDate: "Datum",
    apDetailCategory: "Kategori",
    apDetailNumber: "Kvittonr",
    btnRemove: "Ta bort",
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
    invDisclaimer: "Du ansvarar själv för att uppgifterna på fakturan är korrekta. Kvittino tillhandahåller mallen och sparar fakturan.",
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
    subPausedNotice: "Din prenumeration är pausad, så premiumfunktioner är låsta tills den återupptas.",
    subGrantExpiredNotice: "Din tilldelade plan har gått ut. Du har ingen aktiv plan längre — uppgradera för att låsa upp premiumfunktioner igen.",
    subManageBilling: "Hantera betalning",
    toastPlanSwitched: "Din plan har uppdaterats.",
    toastPortalFail: "Kunde inte öppna betalningsportalen.",
    invHistoryTitle: "Fakturor",
    invHistoryDesc: "Kvitton och fakturor för din prenumeration",
    invColNumber: "Faktura",
    invColStatus: "Status",
    invStatusPaid: "Betald",
    invStatusOpen: "Obetald",
    invStatusFailed: "Misslyckad",
    invDownload: "Ladda ner PDF",
    invPay: "Betala",
    invEmpty: "Inga fakturor ännu. Din första faktura visas här efter din första betalning.",
    invLoadFail: "Kunde inte hämta fakturor.",
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
    planStarter: "Starter",
    planPro: "Pro",
    planBusiness: "Företag",
    planMax: "Max",
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
    colCategory: "Kategori",
    receiptBack: "Tillbaka till kvitton",
    receiptDetails: "Kvittodetaljer",
    receiptNoImage: "Ingen bild sparad för det här kvittot.",
    receiptNumberLabel: "Kvittonummer",
    receiptCreatedLabel: "Uppladdad",
    receiptOpenImage: "Öppna bild i full storlek",
    receiptPrev: "Föregående",
    receiptNext: "Nästa",
    receiptShowing: "Visar {from}–{to} av {total}",
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
    feature6Title: "Kollektivtrafik & ersättning",
    feature6Body:
      "Registrera resor med kollektivtrafik och beräkna ersättning automatiskt enligt företagets regler eller Skatteverkets schabloner.",

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
      "15 skanningar/mån",
      "Grundläggande OCR",
      "CSV-export",
    ],
    planStarterFeatures: [
      "100 skanningar/mån",
      "OCR, moms & BAS",
      "SIE- och CSV-export",
      "En användare",
    ],
    planProFeatures: [
      "500 skanningar/mån",
      "SIE/PDF-export, moms & BAS",
      "Milersättning",
      "Fortnox-integration",
      "7-årig revisionslogg",
    ],
    planBusinessFeatures: [
      "1 500 skanningar/mån (delas i teamet)",
      "Allt i Pro",
      "5–10 användare, roller",
      "Attestflöden",
      "Bokföringsintegrationer",
    ],
    planMaxFeatures: [
      "5 000 skanningar/mån (delas i teamet)",
      "Allt i Företag",
      "Flera klienter",
      "Prioriterad support",
    ],
    planEnterpriseFeatures: [
      "Allt i Max",
      "Skräddarsydda volymer",
      "Dedikerad kontakt (offert)",
    ],

    // Footer
    footerTitle: "Kvitto",
    footerDescription:
      "AI-driven kvittohantering byggd för svenska moms- och bokföringsregler.",
    footerGDPR: "GDPR-säker",
    footerAudit: "7-årig revisionslogg",
    footerCopyright: "© {year} GlorifyTC.",
    footerDisclaimer:
      "Detta är en startmall — verifiera moms- och bokföringsregler med din revisor innan produktion.",


    // lib/translations.ts — ADD these values to strings.sv
    featuresPageSubtitle: "Sex funktioner byggda för svenska företag, enskilda firmor och redovisningsbyråer.",
    featuresCompareTitle: "Så jämför sig Kvittino",
    featuresCompareCapability: "Funktion",
    featuresCompareUtlagg: "Kvittino",
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
    pricingTableRoles: "Rollbaserad åtkomst",
    pricingTableLimits: "Beloppsgränser",
    pricingTableOnboarding: "Anpassad onboarding",
    pricingTableSupport: "Prioriterad support",
    cookieTitle: "Integritet & Cookies",
    cookieBody: "Vi använder cookies för att hålla tjänsten igång på ett säkert sätt. Nödvändiga cookies är alltid aktiva enligt lag om elektronisk kommunikation (LEK). Icke-nödvändiga cookies — funktionella och analytiska — lagras endast med ditt uttryckliga samtycke enligt GDPR Art. 7. Du kan när som helst återkalla eller ändra ditt samtycke.",
    cookiePrivacyLink: "Integritetspolicy",
    cookieAcceptAll: "Godkänn alla",
    cookieRejectAll: "Avvisa alla",
    cookieManage: "Hantera inställningar",
    cookieSave: "Spara inställningar",
    cookieAlwaysActive: "Alltid aktiv",
    cookieExamples: "Exempel",
    cookieRetention: "Lagringstid",
    cookieDataController: "Personuppgiftsansvarig",
    cookieDataControllerValue: "Kvittino AB, Sverige.",
    cookieSupervisory: "Tillsynsmyndighet",
    cookieGdprRights: "Du har rätt att begära tillgång till, rättelse av och radering av dina personuppgifter, samt att lämna in ett klagomål till IMY om du anser att dina rättigheter enligt GDPR inte uppfylls.",
    cookieCatNecessaryLabel: "Nödvändiga",
    cookieCatNecessaryBasis: "LEK — strikt nödvändigt undantag",
    cookieCatNecessaryDesc: "Dessa cookies krävs för att tjänsten ska fungera. De hanterar inloggningssessioner, CSRF-skydd och BankID-autentisering. De är undantagna från samtyckeskrav enligt lag om elektronisk kommunikation (LEK) och behandlar inga personuppgifter utöver vad som är strikt nödvändigt för tjänsteleveransen.",
    cookieCatNecessaryExamples: "Sessions-ID, CSRF-token, BankID-sessionstoken",
    cookieCatNecessaryRetention: "Session — max 24 timmar",
    cookieCatFunctionalLabel: "Funktionella",
    cookieCatFunctionalBasis: "GDPR Art. 6(1)(a) — samtycke",
    cookieCatFunctionalDesc: "Lagrar dina inställningar mellan besök så att tjänsten beter sig konsekvent — inklusive ditt språkval och visningsinställningar. Inga uppgifter delas med tredje part.",
    cookieCatFunctionalExamples: "Språkinställning (sv/en), gränssnittsinställningar",
    cookieCatFunctionalRetention: "12 månader",
    cookieCatAnalyticsLabel: "Analytiska",
    cookieCatAnalyticsBasis: "GDPR Art. 6(1)(a) — samtycke",
    cookieCatAnalyticsDesc: "Samlar in anonymiserad data om hur tjänsten används — besökta sidor, använda funktioner och uppkomna fel — för att hjälpa oss förbättra produkten. Ingen enskild användare identifieras eller spåras på andra webbplatser.",
    cookieCatAnalyticsExamples: "Sidvisningar, funktionsanvändning, sessionslängd, felrapporter",
    cookieCatAnalyticsRetention: "13 månader",
    // Privacy policy page
    privTitle: "Integritetspolicy",
    privIntro: "Den här policyn beskriver hur GlorifyTC (\"vi\", \"oss\" eller \"Kvittino\") samlar in, använder och skyddar dina personuppgifter när du använder Kvittino. Vi behandlar personuppgifter i enlighet med EU:s dataskyddsförordning (GDPR, EU 2016/679) och kompletterande svensk dataskyddslagstiftning.",
    privUpdated: "Senast uppdaterad: 18 juli 2026",
    priv1Title: "1. Personuppgiftsansvarig",
    priv1P1: "(org.nr [xxxxxx-xxxx]) är personuppgiftsansvarig för behandlingen av dina uppgifter i samband med ditt konto och din användning av tjänsten.",
    priv1ContactLabel: "Kontakt i dataskyddsfrågor:",
    priv1P3: "När du som företagsanvändare behandlar tredje parts personuppgifter (t.ex. dina anställdas utlägg) via Kvittino agerar GlorifyTC som ditt personuppgiftsbiträde. Se vårt",
    priv1DpaLink: "personuppgiftsbiträdesavtal (DPA)",
    priv2Title: "2. Vilka uppgifter vi samlar in",
    priv2AccountLabel: "Kontoinformation",
    priv2AccountDesc: "Namn, e-postadress, krypterat lösenord och inloggningsmetod (e-post/lösenord eller BankID). Vid inloggning med BankID behandlas ditt personnummer vid inloggningstillfället som en del av autentiseringen, men vi lagrar det inte; vi bevarar endast en referens till den genomförda autentiseringen.",
    priv2CompanyLabel: "Företagsinformation",
    priv2CompanyDesc: "Företagsnamn, organisationsnummer, momsregistreringsnummer och postadress om du registrerar ett företag i tjänsten.",
    priv2BookLabel: "Bokföringsunderlag",
    priv2BookDesc: "Kvittobilder och data extraherade via OCR: leverantör, datum, belopp, momssats och BAS-konto. Dessa uppgifter kan innehålla personuppgifter om leverantören är en enskild firma eller om kvittot innehåller personnamn.",
    priv2MileageLabel: "Körjournaldata",
    priv2MileageDesc: "Start- och slutadresser, körsträcka, datum, resans syfte och fordon.",
    priv2InvoiceLabel: "Fakturadata",
    priv2InvoiceDesc: "Fakturanummer, kunduppgifter (namn, org.nr, adress), radposter och belopp.",
    priv2PaymentLabel: "Betalningsinformation",
    priv2PaymentDesc: "Prenumerationstyp, faktureringsperiod och betalningsstatus. Kortuppgifter hanteras uteslutande av Stripe — vi lagrar dem inte.",
    priv2SupportLabel: "Supportärenden",
    priv2SupportDesc: "Om du kontaktar vår support behandlar vi din korrespondens och de uppgifter du lämnar i ärendet.",
    priv2LogsLabel: "Loggar och teknisk data",
    priv2LogsDesc: "IP-adress, tidsstämpel och åtgärdstyp loggas vid inloggning och kontoaktivitet. Vi samlar också in webbläsartyp och sessionsdata för säkerhet och felsökning.",
    priv3Title: "3. Ändamål och rättslig grund",
    priv3Col1: "Ändamål",
    priv3Col2: "Rättslig grund (GDPR art. 6)",
    priv3R1P: "Tillhandahålla och driva tjänsten, inklusive lagring av dina kvitton och underlag",
    priv3R1B: "Avtalsfullgörelse (6.1.b)",
    priv3R2P: "Hantera prenumerationer och betalningar",
    priv3R2B: "Avtalsfullgörelse (6.1.b)",
    priv3R3P: "Bevara vår egen räkenskapsinformation (fakturor till dig, betalningshistorik) i sju år",
    priv3R3B: "Rättslig förpliktelse (6.1.c) — Bokföringslagen och skattelagstiftning",
    priv3R4P: "Skicka transaktionsmejl (kvitton, lösenordsåterställning, inbjudningar, raderingspåminnelser)",
    priv3R4B: "Avtalsfullgörelse (6.1.b)",
    priv3R5P: "Hantera supportärenden",
    priv3R5B: "Berättigat intresse (6.1.f) — att kunna ge dig support",
    priv3R6P: "Förhindra bedrägerier, missbruk och obehörig åtkomst; säkerhets- och ändringsloggar",
    priv3R6B: "Berättigat intresse (6.1.f)",
    priv3R7P: "Förhindra upprepat utnyttjande av den kostnadsfria provperioden (pseudonymiserad token härledd från e-postadress, bevarad efter kontoradering)",
    priv3R7B: "Berättigat intresse (6.1.f)",
    priv3R8P: "Förbättra OCR-modellen med hjälp av dina markeringar (uppgifterna avidentifieras före sådan användning)",
    priv3R8B: "Samtycke (6.1.a) — kan återkallas när som helst",
    priv3R9P: "Uppfylla lagkrav och besvara bindande myndighetsförfrågningar",
    priv3R9B: "Rättslig förpliktelse (6.1.c)",
    priv3P1Pre: "När du som företagskund behandlar dina anställdas eller andra tredje mäns personuppgifter via tjänsten agerar vi personuppgiftsbiträde enligt vårt",
    priv3DpaLink: "personuppgiftsbiträdesavtal",
    priv3P1Post: "; den rättsliga grunden för sådan behandling fastställs av dig som personuppgiftsansvarig.",
    priv3P2: "Vi förlitar oss på berättigat intresse (art. 6.1.f) enbart där vårt intresse av att upprätthålla tjänstens säkerhet och funktionalitet väger tyngre än ditt intresse av skydd. Du har alltid rätt att invända mot sådan behandling (se avsnitt 7).",
    priv4Title: "4. Lagringstider",
    priv4Intro: "Vi skiljer mellan innehåll vi lagrar för din räkning som en del av tjänsten och uppgifter vi behandlar för egen räkning.",
    priv4OwnLabel: "Innehåll vi lagrar för din räkning",
    priv4Li1Strong: "Kvitton, verifikationer, körjournaler och fakturor",
    priv4Li1Rest: "— under aktiv prenumeration samt under en exportperiod om tolv (12) månader därefter, i enlighet med § 7 i användarvillkoren. Innan radering sker skickar vi påminnelser 90, 30 och 7 dagar i förväg, varefter uppgifterna raderas inom 30 dagar. Observera att arkiveringsskyldigheten enligt Bokföringslagen (SFS 1999:1078) åvilar dig som bokföringsskyldig — exportera dina underlag innan exportperioden löper ut.",
    priv4OurLabel: "Uppgifter vi behandlar för egen räkning",
    priv4Li2Strong: "Kontouppgifter",
    priv4Li2Rest: "— till dess att du raderar ditt konto, varefter uppgifterna tas bort inom 30 dagar, utom där lag kräver längre bevarande.",
    priv4Li3Strong: "Vår egen räkenskapsinformation",
    priv4Li3Rest: "(fakturor till dig, betalningshistorik) — sju (7) år enligt Bokföringslagen och skattelagstiftningen.",
    priv4Li4Strong: "Säkerhetsloggar",
    priv4Li4Rest: "(IP-adress, sessioner) — nittio (90) dagar.",
    priv4Li5Strong: "Ändringslogg för verifikationer",
    priv4Li5Rest: "(vem som ändrat vad, utan IP-adress) — så länge det underliggande underlaget lagras.",
    priv4Li6Strong: "Supportärenden",
    priv4Li6Rest: "— så länge det behövs för att hantera ärendet och en rimlig tid därefter, dock längst 24 månader.",
    priv4Li7Strong: "Pseudonymiserad provperiodstoken",
    priv4Li7Rest: "— efter att du raderat ditt konto bevarar vi en envägskrypterad (hashad) token som härletts från din normaliserade e-postadress, uteslutande för att förhindra upprepat utnyttjande av den kostnadsfria provperioden. Token kan inte återställas till din e-postadress och bevaras i högst tjugofyra (24) månader, varefter den raderas automatiskt.",
    priv5Title: "5. Mottagare och underbiträden",
    priv5P1Pre: "Vi delar personuppgifter enbart med leverantörer som behöver dem för att vi ska kunna tillhandahålla tjänsten. En fullständig och uppdaterad lista finns på",
    priv5P1Post: ". Exempel på kategorier:",
    priv5Li1: "Molninfrastruktur och databas (EU)",
    priv5Li2: "Lagring av kvittobilder (EU)",
    priv5Li3: "Betalningshantering (EU/US med lämpliga skyddsåtgärder)",
    priv5Li4: "Transaktionsmejl (US med lämpliga skyddsåtgärder)",
    priv5Li5: "OCR-behandling av kvitton (EU)",
    priv5P2: "Vi säljer aldrig personuppgifter till tredje part och delar dem aldrig för marknadsföringsändamål utan ditt uttryckliga samtycke. Vi kan lämna ut uppgifter till myndigheter (t.ex. Skatteverket, Polisen) om vi är skyldiga att göra det enligt lag.",
    priv6Title: "6. Överföring till tredjeland",
    priv6P1: "Vår primära lagring sker i Sverige och inom EU/EES. Vissa underbiträden är etablerade i USA. Sådana överföringar sker uteslutande med stöd av EU-kommissionens standardavtalsklausuler (SCC, art. 46.2.c GDPR) och/eller EU–US Data Privacy Framework där leverantören är certifierad.",
    priv6P2Pre: "Du kan begära information om vilka skyddsåtgärder som gäller för en specifik underbiträdare genom att kontakta oss på",
    priv7Title: "7. Dina rättigheter",
    priv7P1Pre: "Under GDPR har du följande rättigheter. Kontakta oss på",
    priv7P1Post: "för att utöva dem. Vi svarar inom en (1) månad.",
    priv7Li1Strong: "Tillgång (art. 15)",
    priv7Li1Rest: "— rätt att få bekräftelse på om vi behandlar uppgifter om dig och att få en kopia av dem.",
    priv7Li2Strong: "Rättelse (art. 16)",
    priv7Li2Rest: "— rätt att få felaktiga eller ofullständiga uppgifter korrigerade. Du kan uppdatera de flesta uppgifter direkt via profilinställningarna.",
    priv7Li3Strong: "Radering (art. 17)",
    priv7Li3Rest: "— rätt att begära att vi raderar dina uppgifter (\"rätten att bli bortglömd\"), under förutsättning att vi inte har rättslig skyldighet att bevara dem. När du utövar din rätt till radering tar vi bort dina personuppgifter, med undantag för den pseudonymiserade provperiodstoken som beskrivs i avsnittet om lagringstider och för sådana uppgifter vi är skyldiga att bevara enligt lag.",
    priv7Li4Strong: "Begränsning (art. 18)",
    priv7Li4Rest: "— rätt att begära att behandlingen begränsas i vissa situationer, t.ex. om du bestrider uppgifternas riktighet.",
    priv7Li5Strong: "Dataportabilitet (art. 20)",
    priv7Li5Rest: "— rätt att få ut de uppgifter du lämnat i ett strukturerat, maskinläsbart format (CSV, SIE, PDF). Exportfunktioner finns direkt i tjänsten.",
    priv7Li6Strong: "Invändning (art. 21)",
    priv7Li6Rest: "— rätt att invända mot behandling som grundar sig på berättigat intresse. Vi upphör med behandlingen om vi inte kan påvisa tvingande berättigade skäl.",
    priv7Li7Strong: "Återkallelse av samtycke",
    priv7Li7Rest: "— om behandlingen grundas på samtycke (t.ex. förbättring av OCR-modellen) kan du när som helst återkalla det utan att det påverkar lagligheten av tidigare behandling.",
    priv8Title: "8. Rätt att klaga till tillsynsmyndigheten",
    priv8P1Pre: "Om du anser att vi behandlar dina personuppgifter i strid med GDPR har du rätt att inge ett klagomål till",
    priv8ImyStrong: "Integritetsskyddsmyndigheten (IMY)",
    priv8P2: "Vi ser gärna att du kontaktar oss först så att vi kan lösa eventuella problem direkt.",
    priv9Title: "9. Säkerhet",
    priv9P1: "Vi vidtar tekniska och organisatoriska åtgärder för att skydda dina uppgifter mot obehörig åtkomst, förlust och förstöring. Åtgärderna inkluderar kryptering under överföring (TLS/HTTPS), krypterade lösenord (bcrypt), tidsbegränsade signerade URL:er för kvittobilder och en ändringslogg för kontoåtgärder.",
    priv9P2: "Vid en personuppgiftsincident anmäler vi incidenten till Integritetsskyddsmyndigheten (IMY) utan onödigt dröjsmål och, där det är möjligt, senast 72 timmar efter att vi fått kännedom om den, i enlighet med art. 33 GDPR. Om incidenten kan innebära en hög risk för dina rättigheter och friheter informerar vi även dig utan onödigt dröjsmål (art. 34). När vi agerar personuppgiftsbiträde underrättar vi i stället den personuppgiftsansvarige utan onödigt dröjsmål.",
    priv9MoreInfo: "Mer information finns på",
    priv10Title: "10. Cookies och spårning",
    priv10P1: "Kvittino använder nödvändiga cookies för att hålla dig inloggad och skydda din session (CSRF-skydd). Vi använder inte spårningscookies för reklam.",
    priv10P2: "Om vi i framtiden inför analytiska eller icke-nödvändiga cookies inhämtar vi ditt samtycke via ett cookie-meddelande innan de aktiveras.",
    priv11Title: "11. Automatiserat beslutsfattande",
    priv11P1: "Vår OCR-funktion extraherar automatiskt data från kvitton och föreslår momssats och BAS-konto. Detta är ett beslutsstöd — du granskar och godkänner alltid resultatet innan det sparas. Kvittino fattar inte automatiserade beslut som producerar rättsliga eller liknande effekter för dig i den mening som avses i GDPR art. 22.",
    priv12Title: "12. Ändringar av policyn",
    priv12P1: "Vi kan uppdatera denna policy för att spegla förändringar i tjänsten eller lagstiftningen. Vid väsentliga ändringar skickar vi ett meddelande till din registrerade e-postadress med minst 30 dagars varsel. Det aktuella datumet för senaste uppdatering anges alltid högst upp på sidan.",
    priv13Title: "13. Kontakt",
    priv13P1Pre: "Frågor om hur vi behandlar dina personuppgifter besvaras på:",
    priv13P2Pre: "Se även vår",
    priv13DpaLink: "DPA",
    priv13SubprocessorsLink: "listan över underbiträden",
    priv13And: "och",
    priv13TermsLink: "användarvillkoren",
    privFooter: "Kontakt: legal@kvittino.se · GlorifyTC · Org.nr [xxxxxx-xxxx]",
    // Terms of service page
    termsTitle: "Användarvillkor",
    termsIntro: "Dessa villkor reglerar din användning av Kvittino — en AI-driven tjänst för kvittohantering, utläggsredovisning och bokföringsexport anpassad för svenska moms- och bokföringsregler.",
    termsUpdated: "Senast uppdaterad: 18 juli 2026",
    terms1Title: "§ 1 Parter",
    terms1P1: "(org.nr [xxxxxx-xxxx]), nedan kallat \"vi\", \"oss\" eller \"Kvittino\".",
    terms1P2: "Den fysiska eller juridiska person som registrerar ett konto och godkänner dessa villkor kallas \"du\", \"Kunden\" eller \"Användaren\". Om du accepterar villkoren å ett företags vägnar intygar du att du har befogenhet att binda det företaget.",
    terms2Title: "§ 2 Avtalets ingående",
    terms2P1: "Avtalet träder i kraft när du skapar ett konto och markerar att du accepterar dessa villkor.",
    terms2P2: "Dessa villkor gäller för samtliga planer — Gratis, Pro, Företag och Enterprise — om inget annat skriftligen avtalats.",
    terms2P3: "Ändringar av villkoren hanteras enligt § 13. För konsumenter förutsätter väsentliga ändringar till din nackdel att du underrättas i förväg och ges möjlighet att säga upp avtalet utan kostnad innan ändringen träder i kraft.",
    terms3Title: "§ 3 Tjänstens omfattning",
    terms3P1: "Kvittino är en webbaserad SaaS-tjänst (Software as a Service) för skanning och hantering av kvitton, körjournalföring, utläggsattest, kollektivtrafikregistrering och fakturahantering — anpassad för svenska momssatser (6/12/25 %), BAS-kontoplanen och Bokföringslagens krav.",
    terms3P2: "Vi strävar efter hög tillgänglighet men garanterar inte avbrottsfri drift. Planerat underhåll och oplanerade driftstörningar kan förekomma. Tjänsten tillhandahålls i befintligt skick (\"as-is\"), med de begränsningar som följer av § 12.",
    terms3P3: "AI-genererade värden — t.ex. OCR-utläsning av leverantör, belopp och momssats — är hjälpmedel och utgör inte juridiskt bindande underlag. Du ansvarar alltid för att kontrollera och godkänna uppgifter innan de sparas eller exporteras. Vi fattar inte automatiserade beslut med rättslig verkan för dig (se integritetspolicyns avsnitt om automatiserat beslutsfattande).",
    terms4Title: "§ 4 Konton och åtkomst",
    terms4P1: "Du ansvarar för att hålla dina inloggningsuppgifter konfidentiella och för all aktivitet som sker via ditt konto. Dela inte ditt lösenord med obehöriga.",
    terms4P2: "Vi förbehåller oss rätten att stänga av eller radera konton som (i) bryter mot dessa villkor, (ii) används för olagliga ändamål, eller (iii) misstänks ha komprometterats — med omedelbar verkan och utan föregående varsel om säkerheten kräver det. Vid avstängning eller uppsägning från vår sida gäller din rätt till export enligt § 14.",
    terms4P3: "Du måste vara minst 18 år och ha rättslig handlingsförmåga för att ingå detta avtal.",
    terms5Title: "§ 5 Prenumeration och betalning",
    terms5P1Pre: "Betalda abonnemang debiteras månadsvis i förskott i SEK. Priser till konsumenter anges inklusive moms. Betalning hanteras av",
    terms5P1Post: "Kvittino lagrar inga kortuppgifter.",
    terms5P2: "Prenumerationen förnyas automatiskt tills du avslutar den. Avslutning sker från dina kontoinställningar och träder i kraft vid innevarande faktureringsperiods slut — du behåller tillgång till betalda funktioner fram till dess.",
    terms5P3: "Vi förbehåller oss rätten att ändra priser med minst 30 dagars skriftlig varsel via e-post. Om du inte godkänner prisändringen kan du avsluta prenumerationen utan extra kostnad innan ändringen träder i kraft.",
    terms5P4: "Återbetalning sker inte för redan fakturerade perioder, utom i fall där tvingande lag kräver det (se § 6 om ångerrätt).",
    terms5P5Strong: "Provperiod.",
    terms5P5Rest: "Vi kan erbjuda en kostnadsfri provperiod om trettio (30) dagar. Om du inte säger upp prenumerationen före provperiodens slut övergår den automatiskt till en betald prenumeration enligt den plan och det pris du valt vid registreringen, och betalning dras då för den kommande perioden. Du kan när som helst under provperioden säga upp prenumerationen utan kostnad via dina kontoinställningar. Vi påminner dig via e-post innan den första betalningen dras.",
    terms5P6Strong: "Provperioden får utnyttjas en (1) gång per användare.",
    terms5P6Rest: "Rätten till provperiod bedöms per person, inte enbart per konto eller e-postadress. För att förhindra att provperioden utnyttjas upprepade gånger genom nya konton kan vi, efter att ett konto raderats, bevara en pseudonymiserad (envägskrypterad) token som härletts från din e-postadress; närmare information finns i integritetspolicyn. Vi förbehåller oss rätten att neka eller avsluta en provperiod vid misstanke om missbruk.",
    terms6Title: "§ 6 Ångerrätt (konsumenter)",
    terms6P1: "Om du är konsument (dvs. en fysisk person som handlar utanför sin yrkesmässiga verksamhet) har du rätt att frånträda detta avtal inom 14 dagar från avtalets ingående, utan att ange skäl, i enlighet med lag (2005:59) om distansavtal och avtal utanför affärslokaler.",
    terms6P2: "Om du uttryckligen begär att tjänsten ska börja tillhandahållas under ångerfristen, och samtidigt bekräftar att du är medveten om att din ångerrätt går förlorad när tjänsten fullgjorts, förfaller ångerrätten när tjänsten är fullgjord. För en löpande prenumeration som du frånträder under fristen har vi rätt till betalning i proportion till vad som levererats fram till att du meddelar oss att du frånträder avtalet.",
    terms6P3Pre: "För att utöva ångerrätten kan du använda Konsumentverkets standardformulär för ånger, som finns tillgängligt",
    terms6AngerLink: "här",
    terms6P3Mid: ", eller kontakta oss på",
    terms6P3Post: "med ditt namn, din e-postadress och ett tydligt meddelande om att du frånträder avtalet.",
    terms7Title: "§ 7 Lagring, arkivering och radering av underlag",
    terms7P1: "7.1 Bokföringslagen (1999:1078) ålägger den som är bokföringsskyldig att bevara räkenskapsinformation till och med utgången av det sjunde året efter det kalenderår då räkenskapsåret avslutades. Denna arkiveringsskyldighet åvilar dig i egenskap av bokföringsskyldig. Kvittino övertar inte, och ska inte anses ha övertagit, någon arkiveringsskyldighet enligt Bokföringslagen eller annan författning, om inte detta uttryckligen och skriftligen avtalats.",
    terms7P2: "7.2 Under avtalets löptid lagrar Kvittino dina kvitton, verifikationer och övriga underlag som en del av tjänsten. Om din betalda prenumeration upphör övergår kontot till läsläge, i vilket du under tolv (12) månader från den senaste betalda periodens utgång (\"Exportperioden\") har fortsatt tillgång till samtliga underlag för granskning och export via tjänstens exportfunktioner (SIE, CSV, PDF). Under läsläget kan möjligheten att ladda upp nya underlag vara begränsad.",
    terms7P3: "7.3 Kvittino åtar sig att, innan underlag raderas enligt punkt 7.4, skicka skriftliga påminnelser till din registrerade e-postadress senast nittio (90), trettio (30) respektive sju (7) dagar före Exportperiodens utgång. Varje påminnelse ska ange det datum då radering sker samt hänvisa till exportfunktionerna.",
    terms7P4: "7.4 Efter Exportperiodens utgång raderas kvitton, verifikationer och därtill hörande bilder permanent inom trettio (30) dagar. Radering dokumenteras i Kvittinos loggar. Uppgifter som Kvittino är skyldigt att bevara enligt lag — däribland Kvittinos egen räkenskapsinformation avseende fakturering och betalningar — bevaras under den tid som följer av tillämplig lagstiftning.",
    terms7P5: "7.5 Det åligger dig att före Exportperiodens utgång exportera samtliga underlag som du är skyldig att bevara. Under förutsättning att Kvittino fullgjort sina åtaganden enligt punkterna 7.2–7.4 ansvarar Kvittino inte för förlust av räkenskapsinformation som raderats efter Exportperiodens utgång.",
    terms7P6: "7.6 För konton som omfattas av gratisplanen och som varit inaktiva under tolv (12) sammanhängande månader tillämpas motsvarande förfarande enligt punkterna 7.3–7.5, varvid Exportperioden räknas från den senaste inloggningen.",
    terms7P7Strong: "7.7 Export i läsläge.",
    terms7P7Rest: "När ditt konto övergår till läsläge — vare sig efter avslutad provperiod eller efter att en betald prenumeration upphört — behåller du full tillgång att granska och exportera dina underlag. En fullständig export i CSV-format samt nedladdning av dina ursprungliga kvitto- och fakturafiler är alltid tillgänglig, så att du kan fullgöra din arkiveringsskyldighet enligt Bokföringslagen. Vissa tilläggsfunktioner för export — däribland export i SIE- och SIE4-format samt direktintegrationer med bokföringsprogram — förutsätter dock en aktiv betald prenumeration.",
    terms8Title: "§ 8 Dina uppgifter och äganderätt",
    terms8P1: "Du äger all data du laddar upp till Kvittino — kvitton, fakturor, reseuppgifter och övriga dokument. Vi gör inte anspråk på äganderätt till ditt innehåll.",
    terms8P2Pre: "Du ger oss en begränsad, icke-exklusiv licens att behandla dina uppgifter uteslutande i syfte att tillhandahålla, driva och säkerställa tjänsten. Med ditt uttryckliga samtycke kan vi dessutom använda markeringar från dina kvitton för att förbättra vår OCR-modell; sådana uppgifter avidentifieras innan de används för detta ändamål, och samtycket kan återkallas när som helst. Se vår",
    terms8PrivacyLink: "integritetspolicy",
    terms8P2Post: "för närmare information.",
    terms8P3: "Vi delar aldrig dina personuppgifter med tredje part i marknadsföringssyfte.",
    terms9Title: "§ 9 Immateriella rättigheter",
    terms9P1: "Kvittino-plattformen — inklusive programvara, design, grafik, varumärken och affärslogik — ägs av GlorifyTC och skyddas av upphovsrätt och andra immaterialrättsliga lagar.",
    terms9P2: "Du får inte kopiera, modifiera, distribuera, sälja eller utföra reverse engineering av tjänsten eller något av dess komponenter, vare sig helt eller delvis, utom i den utsträckning tvingande lag uttryckligen tillåter det.",
    terms10Title: "§ 10 Förbjuden användning",
    terms10Intro: "Det är förbjudet att använda Kvittino för att:",
    terms10Li1: "lagra, ladda upp eller skapa falska, förfalskade eller missvisande bokföringsunderlag,",
    terms10Li2: "tvätta pengar eller finansiera olaglig verksamhet,",
    terms10Li3: "skicka spam, skadlig kod eller störa tjänstens infrastruktur,",
    terms10Li4: "kringgå säkerhetsfunktioner eller åtkomstbegränsningar,",
    terms10Li5: "bryta mot tillämplig lag — däribland GDPR, bokföringsrätt och skattelagstiftning.",
    terms10P2: "Överträdelse kan leda till omedelbar kontostängning enligt § 4 och kan anmälas till berörda myndigheter.",
    terms11Title: "§ 11 Ansvar för uppladdat innehåll",
    terms11P1: "Du ansvarar för att innehåll som du laddar upp till tjänsten inte gör intrång i tredje mans rättigheter och att din behandling av tredje mans personuppgifter via tjänsten sker i enlighet med tillämplig dataskyddslagstiftning.",
    terms11P2: "Du åtar dig att hålla Kvittino skadeslöst från krav från tredje man — inklusive skäliga ombudskostnader — som grundas på innehåll du laddat upp eller på din användning av tjänsten i strid med dessa villkor eller tillämplig lag. Detta åtagande gäller inte i den utsträckning kravet orsakats av Kvittinos vårdslöshet, och gäller för konsumenter endast i den utsträckning det är förenligt med tvingande rätt.",
    terms12Title: "§ 12 Personuppgiftsbehandling",
    terms12P1Pre: "Vår behandling av personuppgifter styrs av",
    terms12PrivacyLink: "integritetspolicyn",
    terms12P1Mid: "och, för företagskunder,",
    terms12DpaLink: "personuppgiftsbiträdesavtalet (DPA)",
    terms12P1Post: ". Kvittino agerar som personuppgiftsansvarig för kontorelaterade uppgifter och som personuppgiftsbiträde för de personuppgifter du som företagskund behandlar om tredje man (t.ex. dina anställdas utlägg) via tjänsten.",
    terms12P2Pre: "En lista över anlitade underbiträden finns på",
    terms12P2Post: ". Uppgifter lagras i Sverige och behandlas inom EU/EES, med de undantag för överföring till tredjeland som anges i integritetspolicyn.",
    terms13Title: "§ 13 Ansvarsbegränsning",
    terms13P1: "Kvittino tillhandahålls \"i befintligt skick\". Vi lämnar inga garantier — uttryckliga eller underförstådda — om tjänstens lämplighet för ett visst ändamål, avbrottsfrihet eller frihet från fel, utöver vad som följer av tvingande lag.",
    terms13P2: "Vår totala ansvarsskyldighet gentemot dig under ett kalenderår är begränsad till det sammanlagda belopp du faktiskt betalat för tjänsten under de tre (3) månader som föregick den händelse som ger upphov till anspråket. För skada som består i förlust av data och som orsakats genom Kvittinos vårdslöshet är ansvaret dock begränsat till högst tiotusen (10 000) SEK per kalenderår.",
    terms13P3: "Vi ansvarar inte för indirekta skador, utebliven vinst, inkomstbortfall eller följdskador av något slag — oavsett om vi informerats om risken för sådana skador.",
    terms13P4: "Ingenting i dessa villkor utesluter eller begränsar ansvar som inte kan avtalas bort enligt tvingande lag (t.ex. personskada orsakad av grov vårdslöshet eller uppsåt).",
    terms13P5: "Om du är konsument gäller begränsningarna i denna § 13 endast i den utsträckning de är förenliga med tvingande konsumentskyddande lagstiftning, däribland konsumenttjänst- och konsumentköprättsliga regler samt lag (1994:1512) om avtalsvillkor i konsumentförhållanden. Sådan lagstiftning kan ge dig rättigheter utöver vad som anges i dessa villkor, och ingenting i villkoren inskränker dessa rättigheter.",
    terms14Title: "§ 14 Force majeure",
    terms14P1: "Part är befriad från påföljd för underlåtenhet att fullgöra förpliktelse enligt detta avtal om underlåtenheten beror på en omständighet utanför partens kontroll som parten inte skäligen kunde ha förutsett vid avtalets ingående och vars följder parten inte skäligen kunde ha undvikit eller övervunnit — såsom krig, myndighetsåtgärd, nytillkommen eller ändrad lagstiftning, arbetskonflikt, omfattande driftstörning hos underleverantör av infrastruktur, brand, översvämning eller olyckshändelse av större omfattning. Om avtalets fullgörande hindras under längre tid än tre (3) månader har vardera parten rätt att säga upp avtalet med omedelbar verkan.",
    terms15Title: "§ 15 Ändringar av villkoren",
    terms15P1: "Vi kan ändra dessa villkor. Vid väsentliga ändringar skickar vi ett meddelande till den e-postadress du registrerat, med minst 30 dagars varsel innan ändringen träder i kraft.",
    terms15P2: "För företagskunder utgör fortsatt användning av tjänsten efter att ändringen trätt i kraft ett godkännande av de uppdaterade villkoren. För konsumenter träder en väsentlig ändring till din nackdel i kraft först om du inte har sagt upp avtalet före ändringsdatumet; i annat fall kan du avsluta ditt konto och din prenumeration utan extra kostnad före ändringsdatumet.",
    terms16Title: "§ 16 Avtalets löptid och upphörande",
    terms16P1: "Avtalet gäller tills vidare och kan avslutas av båda parter när som helst. Du kan avsluta ditt konto via profilinställningarna. Vi kan säga upp avtalet med 30 dagars varsel, eller med omedelbar verkan vid allvarlig överträdelse av dessa villkor.",
    terms16P2: "Om Kvittino säger upp avtalet, eller stänger av ett konto enligt § 4, ska Kvittino — utom där det är oförenligt med lag, myndighetsbeslut eller nödvändiga säkerhetsåtgärder — ge dig tillgång till kontot i läsläge under trettio (30) dagar för export av dina underlag. Vid misstanke om brott får Kvittino i stället bevara underlagen och lämna ut dem till behörig myndighet.",
    terms16P3: "Vid avslutning upphör din rätt att använda tjänsten. Bestämmelserna om ansvar för uppladdat innehåll, ansvarsbegränsning, immateriella rättigheter, datalagring och radering samt tvistlösning gäller även efter avtalets upphörande.",
    terms17Title: "§ 17 Överlåtelse",
    terms17P1: "Du får inte överlåta dina rättigheter eller skyldigheter enligt detta avtal utan vårt skriftliga medgivande. Kvittino får överlåta avtalet till annan juridisk person i samband med fusion, förvärv eller överlåtelse av hela eller väsentliga delar av verksamheten, förutsatt att förvärvaren övertar dessa villkor. Vi informerar dig om en sådan överlåtelse via e-post eller i tjänsten; om du är konsument har du rätt att säga upp avtalet utan kostnad om överlåtelsen är till din nackdel.",
    terms18Title: "§ 18 Tillämplig lag och tvister",
    terms18P1: "Dessa villkor regleras av och tolkas i enlighet med svensk rätt, utan hänsynstagande till dess lagvalsregler.",
    terms18P2: "Tvister ska i första hand lösas genom förhandling mellan parterna. För tvister med näringsidkare är Stockholms tingsrätt avtalad som exklusivt forum i första instans. För konsumenter gäller detta forumval endast i den utsträckning det är förenligt med tvingande rätt; en konsument har alltid rätt att väcka talan vid domstolen på sin hemort.",
    terms18P3Pre: "Konsumenter har dessutom rätt att vända sig till",
    terms18ArnStrong: "Allmänna reklamationsnämnden (ARN)",
    terms18P3Mid: ", för alternativ tvistlösning. EU-kommissionens plattform för tvistlösning online (ODR) nås via",
    terms19Title: "§ 19 Övrigt",
    terms19P1: "Om en bestämmelse i dessa villkor befinns ogiltig eller icke-verkställbar ska övriga bestämmelser förbli i full kraft. Den ogiltiga bestämmelsen ersätts med en giltig bestämmelse som så nära som möjligt återspeglar dess avsedda innebörd.",
    terms19P2: "Dessa villkor utgör det fullständiga avtalet mellan parterna avseende tjänstens användning och ersätter alla tidigare överenskommelser i samma ämne.",
    termsFooter: "Kontakt: legal@kvittino.se · GlorifyTC · Org.nr [xxxxxx-xxxx]",
  },
  en: {
    rcScanningLocally: "Reading receipt locally…",
    rcScanningAi: "Reading receipt with AI…",
    rcScanningServer: "Trying a more accurate read…",
    rcLocalLowConfidence: "Read locally with some uncertainty — please check the fields.",
    rcLowConfidence: "Low confidence — please check the fields before saving.",
    fortnoxReviewTitle: "Review before syncing",
    fortnoxReviewDesc: "Choose which approved receipts to send to Fortnox. Nothing is sent automatically.",
    fortnoxSelectAll: "Select all",
    fortnoxDeselectAll: "Deselect all",
    fortnoxNoneSelected: "No receipts selected",
    fortnoxNonePending: "No approved receipts waiting to sync",
    fortnoxSyncSelected: "Send selected",
    fortnoxSelectedCount: "selected",
    dashExportHint: "Download receipts, mileage and transport passes for a period",
    navExport: "Export",
    expPeriodTitle: "Export period",
    expPeriodDesc: "Choose the period the Tax Agency wants — e.g. a VAT month or quarter — and export receipts, mileage and transport passes for that same period.",
    expThisMonth: "This month",
    expLastMonth: "Last month",
    expThisQuarter: "This quarter",
    expLastQuarter: "Last quarter",
    expThisYear: "This year",
    expAllTime: "All time",
    expCustom: "Custom period",
    expFrom: "From",
    expTo: "To",
    expDownloadReceipts: "Receipts",
    expDownloadMileage: "Mileage log",
    expDownloadTransport: "Transport passes",
    expDownloadAll: "Download everything for this period",
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
    milRoutesDesc: "Save a route you drive often and log it in one click — or for a whole period.",
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
    annArm: "Mark a field",
    annArmed: "Draw a box over: {field}",
    annCancel: "Cancel",
    annScroll: "Scroll freely. Tap \"Mark a field\" to fix a value.",
    navTransport: "Public transport",
    trTitle: "Public transport",
    trSubtitle: "Save monthly and period passes — no need to log every trip.",
    trQuickTitle: "Add this month's pass",
    trQuickDesc: "Got a recurring monthly pass? Add it for this month with one click.",
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
    trExportDesc: "All passes for the year, ready for your tax return.",
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
    annTip: "Tip: zoom in to hit small fields more easily on mobile.",
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
    dashboard: "Dashboard",
    logout: "Log out",
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
    aboutKicker: "About Kvittino",
    aboutTitle: "Built in Sweden, for Swedish rules.",
    aboutLead: "Kvittino makes receipts and expenses effortless for Swedish businesses — with VAT, BAS accounts and the Tax Agency built in from the start, not bolted on afterwards.",
    aboutStoryTitle: "Why we built Kvittino",
    aboutStoryBody: "Most expense tools are built for an international market and don't understand Swedish VAT, reverse-charge construction tax or the seven-year archiving rule in the Bookkeeping Act. We got tired of fixing the same things by hand every month. Kvittino reads the receipt, fills in the right VAT rate and BAS account, and keeps the record for seven years — so the books are right from the start.",
    aboutValuesTitle: "What we stand for",
    aboutVal1Title: "Compliance first",
    aboutVal1Body: "Swedish VAT, the BAS chart of accounts and the Bookkeeping Act aren't add-ons — they're the foundation the product is built on.",
    aboutVal2Title: "No surprises",
    aboutVal2Body: "Clear pricing, no lock-in, and your data is yours. Export everything and cancel whenever you like.",
    aboutVal3Title: "Real privacy",
    aboutVal3Body: "GDPR-safe handling and encryption. Your receipts never leave your control unnecessarily.",
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
    invViewDisclaimer: "The template is provided by Kvittino. You are responsible for the invoice's content and accuracy.",
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
    apInboxTitle: "Awaiting your approval",
    apInboxDesc: "Receipts uploaded by members that need your approval.",
    apReceiptApproved: "Receipt approved",
    apReceiptRemoved: "Receipt removed",
    apFrom: "From",
    apUnknownVendor: "Unknown vendor",
    apDetailVendor: "Vendor",
    apDetailTotal: "Total",
    apDetailVat: "VAT",
    apDetailDate: "Date",
    apDetailCategory: "Category",
    apDetailNumber: "Receipt no.",
    btnRemove: "Remove",
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
    invDisclaimer: "You are responsible for ensuring the invoice details are correct. Kvittino provides the template and stores the invoice.",
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
    subPausedNotice: "Your subscription is paused, so premium features are locked until it is resumed.",
    subGrantExpiredNotice: "Your granted plan has expired. You no longer have an active plan — upgrade to unlock premium features again.",
    subManageBilling: "Manage billing",
    toastPlanSwitched: "Your plan has been updated.",
    toastPortalFail: "Could not open the billing portal.",
    invHistoryTitle: "Invoices",
    invHistoryDesc: "Receipts and invoices for your subscription",
    invColNumber: "Invoice",
    invColStatus: "Status",
    invStatusPaid: "Paid",
    invStatusOpen: "Unpaid",
    invStatusFailed: "Failed",
    invDownload: "Download PDF",
    invPay: "Pay",
    invEmpty: "No invoices yet. Your first invoice will appear here after your first payment.",
    invLoadFail: "Could not load invoices.",
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
    planStarter: "Starter",
    planPro: "Pro",
    planBusiness: "Business",
    planMax: "Max",
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
    colCategory: "Category",
    receiptBack: "Back to receipts",
    receiptDetails: "Receipt details",
    receiptNoImage: "No image saved for this receipt.",
    receiptNumberLabel: "Receipt number",
    receiptCreatedLabel: "Uploaded",
    receiptOpenImage: "Open full-size image",
    receiptPrev: "Previous",
    receiptNext: "Next",
    receiptShowing: "Showing {from}–{to} of {total}",
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
    feature6Title: "Public transport & reimbursement",
    feature6Body:
      "Track public transport trips and automatically calculate reimbursements based on company policies or Swedish Tax Agency standards",

    // Pricing
    pricingTagline: "Pricing",
    pricingTitle: "Simple. Per company, not per user.",
    pricingPopular: "Most popular",
    pricingContactUs: "Contact us",
    pricingLoading: "Loading…",
    pricingChoosePlan: "Choose",

    // Plan names

    // Plan features
    planFreeFeatures: ["15 scans/month", "Basic OCR", "CSV export"],
    planStarterFeatures: [
      "100 scans/month",
      "OCR, VAT & BAS",
      "SIE and CSV export",
      "Single user",
    ],
    planProFeatures: [
      "500 scans/month",
      "SIE/PDF export, VAT & BAS",
      "Mileage allowance",
      "Fortnox integration",
      "7-year audit log",
    ],
    planBusinessFeatures: [
      "1,500 scans/month (shared by the team)",
      "Everything in Pro",
      "5–10 users, roles",
      "Approval flows",
      "Accounting integrations",
    ],
    planMaxFeatures: [
      "5,000 scans/month (shared by the team)",
      "Everything in Business",
      "Multi-client",
      "Priority support",
    ],
    planEnterpriseFeatures: [
      "Everything in Max",
      "Custom volumes",
      "Dedicated contact (quote)",
    ],

    // Footer
    footerTitle: "Receipt",
    footerDescription:
      "AI-driven receipt management built for Swedish VAT and bookkeeping regulations.",
    footerGDPR: "GDPR-safe",
    footerAudit: "7-year audit log",
    footerCopyright: "© {year} GlorifyTC.",
    footerDisclaimer:
      "This is a starter template — verify VAT and bookkeeping rules with your accountant before production.",

    // lib/translations.ts — ADD these values to strings.en (mirror the Swedish keys)
    featuresPageSubtitle: "Six capabilities purpose-built for Swedish companies, sole traders, and accounting firms.",
    featuresCompareTitle: "How Kvittino compares",
    featuresCompareCapability: "Capability",
    featuresCompareUtlagg: "Kvittino",
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
    pricingTableRoles: "Role-based access",
    pricingTableLimits: "Spending limits",
    pricingTableOnboarding: "Custom onboarding",
    pricingTableSupport: "Priority support",
    cookieTitle: "Privacy & Cookies",
    cookieBody: "We use cookies to keep this service running securely. Necessary cookies are always active under the Swedish Electronic Communications Act (LEK). Any non-essential cookies — functional and analytics — are only stored with your explicit consent under GDPR Art. 7. You can withdraw or change consent at any time.",
    cookiePrivacyLink: "Privacy policy",
    cookieAcceptAll: "Accept all",
    cookieRejectAll: "Reject all",
    cookieManage: "Manage preferences",
    cookieSave: "Save preferences",
    cookieAlwaysActive: "Always active",
    cookieExamples: "Examples",
    cookieRetention: "Retention",
    cookieDataController: "Data controller",
    cookieDataControllerValue: "Kvittino AB, Sweden.",
    cookieSupervisory: "Supervisory authority",
    cookieGdprRights: "You have the right to access, rectify, and erase your personal data, and to lodge a complaint with IMY if you believe your rights under GDPR are not upheld.",
    cookieCatNecessaryLabel: "Necessary",
    cookieCatNecessaryBasis: "LEK — strictly necessary exemption",
    cookieCatNecessaryDesc: "These cookies are required for the service to function. They handle login sessions, CSRF protection, and BankID authentication. They are exempt from consent requirements under the Swedish Electronic Communications Act (LEK) and process no personal data beyond what is strictly required for service delivery.",
    cookieCatNecessaryExamples: "Session ID, CSRF token, BankID session token",
    cookieCatNecessaryRetention: "Session — max 24 hours",
    cookieCatFunctionalLabel: "Functional",
    cookieCatFunctionalBasis: "GDPR Art. 6(1)(a) — consent",
    cookieCatFunctionalDesc: "Stores your preferences between visits so the service behaves consistently — including your language selection and display settings. No data is shared with third parties.",
    cookieCatFunctionalExamples: "Language setting (sv/en), UI preferences",
    cookieCatFunctionalRetention: "12 months",
    cookieCatAnalyticsLabel: "Analytics",
    cookieCatAnalyticsBasis: "GDPR Art. 6(1)(a) — consent",
    cookieCatAnalyticsDesc: "Collects anonymised data on how the service is used — pages visited, features engaged, and errors encountered — to help us improve the product. No individual user is identified or tracked across other websites.",
    cookieCatAnalyticsExamples: "Page views, feature usage, session duration, error reports",
    cookieCatAnalyticsRetention: "13 months",
    // Privacy policy page
    privTitle: "Privacy Policy",
    privIntro: "This policy describes how GlorifyTC (\"we\", \"us\" or \"Kvittino\") collects, uses, and protects your personal data when you use Kvittino. We process personal data in accordance with the EU General Data Protection Regulation (GDPR, EU 2016/679) and supplementary Swedish data protection legislation.",
    privUpdated: "Last updated: 18 July 2026",
    priv1Title: "1. Data Controller",
    priv1P1: "(reg. no. [xxxxxx-xxxx]) is the data controller for the processing of your personal data in connection with your account and your use of the service.",
    priv1ContactLabel: "Data protection contact:",
    priv1P3: "When you as a business user process third-party personal data (e.g. your employees' expenses) via Kvittino, GlorifyTC acts as your data processor. See our",
    priv1DpaLink: "data processing agreement (DPA)",
    priv2Title: "2. Data We Collect",
    priv2AccountLabel: "Account information",
    priv2AccountDesc: "Name, email address, encrypted password and login method (email/password or BankID). When logging in with BankID, your personal identity number is processed at the time of authentication as part of the authentication, but we do not store it; we only retain a reference to the completed authentication.",
    priv2CompanyLabel: "Company information",
    priv2CompanyDesc: "Company name, registration number, VAT number and postal address if you register a company in the service.",
    priv2BookLabel: "Accounting records",
    priv2BookDesc: "Receipt images and data extracted via OCR: supplier, date, amount, VAT rate and BAS account. This data may contain personal data if the supplier is a sole trader or if the receipt contains personal names.",
    priv2MileageLabel: "Mileage log data",
    priv2MileageDesc: "Start and end addresses, distance driven, date, purpose of journey and vehicle.",
    priv2InvoiceLabel: "Invoice data",
    priv2InvoiceDesc: "Invoice number, customer details (name, registration number, address), line items and amounts.",
    priv2PaymentLabel: "Payment information",
    priv2PaymentDesc: "Subscription type, billing period and payment status. Card details are handled exclusively by Stripe — we do not store them.",
    priv2SupportLabel: "Support tickets",
    priv2SupportDesc: "If you contact our support, we process your correspondence and the information you provide in the ticket.",
    priv2LogsLabel: "Logs and technical data",
    priv2LogsDesc: "IP address, timestamp and action type are logged at login and account activity. We also collect browser type and session data for security and debugging.",
    priv3Title: "3. Purpose and Legal Basis",
    priv3Col1: "Purpose",
    priv3Col2: "Legal basis (GDPR art. 6)",
    priv3R1P: "Provide and operate the service, including storage of your receipts and records",
    priv3R1B: "Performance of contract (6.1.b)",
    priv3R2P: "Manage subscriptions and payments",
    priv3R2B: "Performance of contract (6.1.b)",
    priv3R3P: "Retain our own accounting records (invoices to you, payment history) for seven years",
    priv3R3B: "Legal obligation (6.1.c) — Bookkeeping Act and tax legislation",
    priv3R4P: "Send transactional emails (receipts, password resets, invitations, deletion reminders)",
    priv3R4B: "Performance of contract (6.1.b)",
    priv3R5P: "Handle support tickets",
    priv3R5B: "Legitimate interest (6.1.f) — to be able to provide you with support",
    priv3R6P: "Prevent fraud, misuse and unauthorised access; security and audit logs",
    priv3R6B: "Legitimate interest (6.1.f)",
    priv3R7P: "Prevent repeated use of the free trial (pseudonymised token derived from email address, retained after account deletion)",
    priv3R7B: "Legitimate interest (6.1.f)",
    priv3R8P: "Improve the OCR model using your annotations (data is anonymised before such use)",
    priv3R8B: "Consent (6.1.a) — may be withdrawn at any time",
    priv3R9P: "Comply with legal requirements and respond to binding regulatory requests",
    priv3R9B: "Legal obligation (6.1.c)",
    priv3P1Pre: "When you as a business customer process your employees' or other third parties' personal data via the service, we act as data processor under our",
    priv3DpaLink: "data processing agreement",
    priv3P1Post: "; the legal basis for such processing is determined by you as the data controller.",
    priv3P2: "We rely on legitimate interest (art. 6.1.f) only where our interest in maintaining the security and functionality of the service outweighs your interest in protection. You always have the right to object to such processing (see section 7).",
    priv4Title: "4. Retention Periods",
    priv4Intro: "We distinguish between content we store on your behalf as part of the service and data we process on our own account.",
    priv4OwnLabel: "Content we store on your behalf",
    priv4Li1Strong: "Receipts, vouchers, mileage logs and invoices",
    priv4Li1Rest: "— during an active subscription and during an export period of twelve (12) months thereafter, in accordance with § 7 of the terms of service. Before deletion we send reminders 90, 30 and 7 days in advance, after which the data is deleted within 30 days. Note that the archiving obligation under the Bookkeeping Act (SFS 1999:1078) rests with you as the bookkeeping obligee — export your records before the export period expires.",
    priv4OurLabel: "Data we process on our own account",
    priv4Li2Strong: "Account data",
    priv4Li2Rest: "— until you delete your account, after which the data is removed within 30 days, except where law requires longer retention.",
    priv4Li3Strong: "Our own accounting records",
    priv4Li3Rest: "(invoices to you, payment history) — seven (7) years under the Bookkeeping Act and tax legislation.",
    priv4Li4Strong: "Security logs",
    priv4Li4Rest: "(IP address, sessions) — ninety (90) days.",
    priv4Li5Strong: "Voucher audit log",
    priv4Li5Rest: "(who changed what, without IP address) — for as long as the underlying record is stored.",
    priv4Li6Strong: "Support tickets",
    priv4Li6Rest: "— for as long as is needed to handle the matter and a reasonable time thereafter, but no longer than 24 months.",
    priv4Li7Strong: "Pseudonymised trial token",
    priv4Li7Rest: "— after you delete your account we retain a one-way encrypted (hashed) token derived from your normalised email address, solely to prevent repeated use of the free trial. The token cannot be reversed to your email address and is retained for a maximum of twenty-four (24) months, after which it is automatically deleted.",
    priv5Title: "5. Recipients and Sub-Processors",
    priv5P1Pre: "We share personal data only with suppliers who need it for us to provide the service. A complete and up-to-date list is available at",
    priv5P1Post: ". Examples of categories:",
    priv5Li1: "Cloud infrastructure and database (EU)",
    priv5Li2: "Receipt image storage (EU)",
    priv5Li3: "Payment processing (EU/US with appropriate safeguards)",
    priv5Li4: "Transactional email (US with appropriate safeguards)",
    priv5Li5: "OCR processing of receipts (EU)",
    priv5P2: "We never sell personal data to third parties and never share it for marketing purposes without your explicit consent. We may disclose data to authorities (e.g. the Swedish Tax Agency, the Police) if we are obliged to do so by law.",
    priv6Title: "6. Transfers to Third Countries",
    priv6P1: "Our primary storage takes place in Sweden and within the EU/EEA. Certain sub-processors are established in the USA. Such transfers take place exclusively on the basis of the European Commission's standard contractual clauses (SCC, art. 46.2.c GDPR) and/or the EU–US Data Privacy Framework where the supplier is certified.",
    priv6P2Pre: "You can request information about the safeguards applicable to a specific sub-processor by contacting us at",
    priv7Title: "7. Your Rights",
    priv7P1Pre: "Under the GDPR you have the following rights. Contact us at",
    priv7P1Post: "to exercise them. We respond within one (1) month.",
    priv7Li1Strong: "Access (art. 15)",
    priv7Li1Rest: "— right to receive confirmation of whether we process data about you and to receive a copy of it.",
    priv7Li2Strong: "Rectification (art. 16)",
    priv7Li2Rest: "— right to have inaccurate or incomplete data corrected. You can update most data directly via the profile settings.",
    priv7Li3Strong: "Erasure (art. 17)",
    priv7Li3Rest: "— right to request that we delete your data (\"the right to be forgotten\"), provided we do not have a legal obligation to retain it. When you exercise your right to erasure we remove your personal data, with the exception of the pseudonymised trial token described in the retention periods section and data we are required to retain by law.",
    priv7Li4Strong: "Restriction (art. 18)",
    priv7Li4Rest: "— right to request that processing be restricted in certain situations, e.g. if you dispute the accuracy of the data.",
    priv7Li5Strong: "Data portability (art. 20)",
    priv7Li5Rest: "— right to receive the data you have provided in a structured, machine-readable format (CSV, SIE, PDF). Export functions are available directly in the service.",
    priv7Li6Strong: "Objection (art. 21)",
    priv7Li6Rest: "— right to object to processing based on legitimate interest. We will cease the processing if we cannot demonstrate compelling legitimate grounds.",
    priv7Li7Strong: "Withdrawal of consent",
    priv7Li7Rest: "— if processing is based on consent (e.g. improvement of the OCR model) you may withdraw it at any time without affecting the lawfulness of prior processing.",
    priv8Title: "8. Right to Complain to the Supervisory Authority",
    priv8P1Pre: "If you believe that we process your personal data in breach of the GDPR you have the right to lodge a complaint with",
    priv8ImyStrong: "the Swedish Authority for Privacy Protection (IMY)",
    priv8P2: "We prefer that you contact us first so that we can resolve any issues directly.",
    priv9Title: "9. Security",
    priv9P1: "We take technical and organisational measures to protect your data against unauthorised access, loss and destruction. Measures include encryption in transit (TLS/HTTPS), encrypted passwords (bcrypt), time-limited signed URLs for receipt images and an audit log for account actions.",
    priv9P2: "In the event of a personal data breach we will notify the Swedish Authority for Privacy Protection (IMY) without undue delay and, where feasible, no later than 72 hours after becoming aware of it, in accordance with art. 33 GDPR. If the breach is likely to result in a high risk to your rights and freedoms we will also notify you without undue delay (art. 34). When we act as data processor we instead notify the data controller without undue delay.",
    priv9MoreInfo: "More information is available at",
    priv10Title: "10. Cookies and Tracking",
    priv10P1: "Kvittino uses necessary cookies to keep you logged in and protect your session (CSRF protection). We do not use tracking cookies for advertising.",
    priv10P2: "If we introduce analytical or non-essential cookies in the future we will obtain your consent via a cookie notice before they are activated.",
    priv11Title: "11. Automated Decision-Making",
    priv11P1: "Our OCR function automatically extracts data from receipts and suggests VAT rate and BAS account. This is a decision-support tool — you always review and approve the result before it is saved. Kvittino does not make automated decisions that produce legal or similarly significant effects for you within the meaning of GDPR art. 22.",
    priv12Title: "12. Changes to this Policy",
    priv12P1: "We may update this policy to reflect changes in the service or legislation. For material changes we will send a notification to your registered email address with at least 30 days' notice. The current date of the latest update is always shown at the top of the page.",
    priv13Title: "13. Contact",
    priv13P1Pre: "Questions about how we process your personal data can be sent to:",
    priv13P2Pre: "See also our",
    priv13DpaLink: "DPA",
    priv13SubprocessorsLink: "list of subprocessors",
    priv13And: "and",
    priv13TermsLink: "terms of service",
    privFooter: "Contact: legal@kvittino.se · GlorifyTC · Reg. no. [xxxxxx-xxxx]",
    // Terms of service page
    termsTitle: "Terms of Service",
    termsIntro: "These terms govern your use of Kvittino — an AI-powered service for receipt management, expense reporting and bookkeeping export adapted to Swedish VAT and bookkeeping rules.",
    termsUpdated: "Last updated: 18 July 2026",
    terms1Title: "§ 1 Parties",
    terms1P1: "(reg. no. [xxxxxx-xxxx]), hereafter referred to as \"we\", \"us\" or \"Kvittino\".",
    terms1P2: "The natural or legal person who registers an account and accepts these terms is referred to as \"you\", \"the Customer\" or \"the User\". If you accept the terms on behalf of a company you confirm that you have authority to bind that company.",
    terms2Title: "§ 2 Formation of Agreement",
    terms2P1: "The agreement takes effect when you create an account and indicate that you accept these terms.",
    terms2P2: "These terms apply to all plans — Free, Pro, Business and Enterprise — unless otherwise agreed in writing.",
    terms2P3: "Changes to the terms are handled in accordance with § 13. For consumers, material changes to your detriment require advance notice and the opportunity to terminate the agreement without charge before the change takes effect.",
    terms3Title: "§ 3 Scope of Service",
    terms3P1: "Kvittino is a web-based SaaS (Software as a Service) for scanning and managing receipts, mileage logging, expense approval, public transport recording and invoice management — adapted to Swedish VAT rates (6/12/25 %), the BAS chart of accounts and the requirements of the Bookkeeping Act.",
    terms3P2: "We strive for high availability but do not guarantee uninterrupted operation. Planned maintenance and unplanned outages may occur. The service is provided \"as-is\", with the limitations set out in § 12.",
    terms3P3: "AI-generated values — e.g. OCR readings of supplier, amount and VAT rate — are decision-support tools and do not constitute legally binding records. You are always responsible for checking and approving data before it is saved or exported. We do not make automated decisions with legal effect for you (see the automated decision-making section of the privacy policy).",
    terms4Title: "§ 4 Accounts and Access",
    terms4P1: "You are responsible for keeping your login credentials confidential and for all activity occurring via your account. Do not share your password with unauthorised parties.",
    terms4P2: "We reserve the right to suspend or delete accounts that (i) violate these terms, (ii) are used for unlawful purposes, or (iii) are suspected of being compromised — with immediate effect and without prior notice if security requires it. Upon suspension or termination by us, your right to export under § 14 applies.",
    terms4P3: "You must be at least 18 years of age and have legal capacity to enter into this agreement.",
    terms5Title: "§ 5 Subscription and Payment",
    terms5P1Pre: "Paid subscriptions are billed monthly in advance in SEK. Prices to consumers are shown inclusive of VAT. Payment is handled by",
    terms5P1Post: "Kvittino does not store any card details.",
    terms5P2: "The subscription renews automatically until you cancel it. Cancellation is done from your account settings and takes effect at the end of the current billing period — you retain access to paid features until then.",
    terms5P3: "We reserve the right to change prices with at least 30 days' written notice by email. If you do not accept the price change you may cancel the subscription without extra charge before the change takes effect.",
    terms5P4: "No refunds are given for already billed periods, except where mandatory law requires it (see § 6 on the right of withdrawal).",
    terms5P5Strong: "Trial period.",
    terms5P5Rest: "We may offer a free trial period of thirty (30) days. If you do not cancel the subscription before the trial ends it automatically converts to a paid subscription at the plan and price you chose at registration, and payment is then taken for the upcoming period. You may cancel the subscription at any time during the trial period without charge via your account settings. We will remind you by email before the first payment is taken.",
    terms5P6Strong: "The trial period may be used once (1) per user.",
    terms5P6Rest: "Entitlement to the trial period is assessed per person, not merely per account or email address. To prevent the trial from being used repeatedly through new accounts we may, after an account is deleted, retain a pseudonymised (one-way encrypted) token derived from your email address; further information is available in the privacy policy. We reserve the right to deny or terminate a trial period if misuse is suspected.",
    terms6Title: "§ 6 Right of Withdrawal (consumers)",
    terms6P1: "If you are a consumer (i.e. a natural person acting outside their professional capacity) you have the right to withdraw from this agreement within 14 days of the agreement being formed, without giving a reason, in accordance with the Distance and Off-Premises Contracts Act (2005:59).",
    terms6P2: "If you expressly request that the service begin during the withdrawal period, and at the same time confirm that you are aware that your right of withdrawal is lost when the service is fully performed, the right of withdrawal lapses when the service is fully performed. For an ongoing subscription that you withdraw during the period we are entitled to payment proportional to what has been delivered up until you notify us that you are withdrawing from the agreement.",
    terms6P3Pre: "To exercise the right of withdrawal you may use the Swedish Consumer Agency's standard withdrawal form, available",
    terms6AngerLink: "here",
    terms6P3Mid: ", or contact us at",
    terms6P3Post: "with your name, your email address and a clear statement that you are withdrawing from the agreement.",
    terms7Title: "§ 7 Storage, Archiving and Deletion of Records",
    terms7P1: "7.1 The Bookkeeping Act (1999:1078) requires those subject to bookkeeping obligations to retain accounting records until the end of the seventh year after the calendar year in which the financial year ended. This archiving obligation rests with you as the bookkeeping obligee. Kvittino does not, and shall not be deemed to have, assumed any archiving obligation under the Bookkeeping Act or other legislation, unless expressly agreed in writing.",
    terms7P2: "7.2 During the term of the agreement Kvittino stores your receipts, vouchers and other records as part of the service. If your paid subscription ends the account transitions to read mode, in which you have continued access for twelve (12) months from the end of the last paid period (the \"Export Period\") to all records for review and export via the service's export functions (SIE, CSV, PDF). In read mode the ability to upload new records may be limited.",
    terms7P3: "7.3 Kvittino undertakes to, before records are deleted pursuant to clause 7.4, send written reminders to your registered email address no later than ninety (90), thirty (30) and seven (7) days before the end of the Export Period. Each reminder shall state the date on which deletion will occur and refer to the export functions.",
    terms7P4: "7.4 After the Export Period ends, receipts, vouchers and associated images are permanently deleted within thirty (30) days. Deletion is documented in Kvittino's logs. Data that Kvittino is required to retain by law — including Kvittino's own accounting records relating to billing and payments — is retained for the period required by applicable legislation.",
    terms7P5: "7.5 It is your responsibility to export before the end of the Export Period all records you are required to retain. Provided that Kvittino has fulfilled its obligations under clauses 7.2–7.4, Kvittino is not liable for loss of accounting records deleted after the Export Period ends.",
    terms7P6: "7.6 For accounts on the free plan that have been inactive for twelve (12) consecutive months, the equivalent procedure under clauses 7.3–7.5 applies, with the Export Period calculated from the last login.",
    terms7P7Strong: "7.7 Export in read mode.",
    terms7P7Rest: "When your account transitions to read mode — whether after a completed trial period or after a paid subscription has ended — you retain full access to review and export your records. A complete export in CSV format and download of your original receipt and invoice files is always available, so that you can fulfil your archiving obligation under the Bookkeeping Act. Certain additional export features — including export in SIE and SIE4 format and direct integrations with bookkeeping software — require an active paid subscription.",
    terms8Title: "§ 8 Your Data and Ownership",
    terms8P1: "You own all data you upload to Kvittino — receipts, invoices, travel records and other documents. We make no claim of ownership over your content.",
    terms8P2Pre: "You grant us a limited, non-exclusive licence to process your data solely for the purpose of providing, operating and securing the service. With your explicit consent we may also use annotations from your receipts to improve our OCR model; such data is anonymised before being used for this purpose, and consent may be withdrawn at any time. See our",
    terms8PrivacyLink: "privacy policy",
    terms8P2Post: "for further information.",
    terms8P3: "We never share your personal data with third parties for marketing purposes.",
    terms9Title: "§ 9 Intellectual Property Rights",
    terms9P1: "The Kvittino platform — including software, design, graphics, trademarks and business logic — is owned by GlorifyTC and protected by copyright and other intellectual property laws.",
    terms9P2: "You may not copy, modify, distribute, sell or reverse-engineer the service or any of its components, in whole or in part, except to the extent expressly permitted by mandatory law.",
    terms10Title: "§ 10 Prohibited Use",
    terms10Intro: "It is prohibited to use Kvittino to:",
    terms10Li1: "store, upload or create false, forged or misleading accounting records,",
    terms10Li2: "launder money or finance unlawful activity,",
    terms10Li3: "send spam, malicious code or disrupt the service's infrastructure,",
    terms10Li4: "circumvent security features or access restrictions,",
    terms10Li5: "violate applicable law — including GDPR, bookkeeping law and tax legislation.",
    terms10P2: "Violations may lead to immediate account suspension under § 4 and may be reported to the relevant authorities.",
    terms11Title: "§ 11 Liability for Uploaded Content",
    terms11P1: "You are responsible for ensuring that content you upload to the service does not infringe third-party rights and that your processing of third-party personal data via the service complies with applicable data protection legislation.",
    terms11P2: "You undertake to indemnify Kvittino against claims from third parties — including reasonable legal costs — arising from content you have uploaded or from your use of the service in breach of these terms or applicable law. This undertaking does not apply to the extent that the claim was caused by Kvittino's negligence, and applies to consumers only to the extent compatible with mandatory law.",
    terms12Title: "§ 12 Personal Data Processing",
    terms12P1Pre: "Our processing of personal data is governed by",
    terms12PrivacyLink: "the privacy policy",
    terms12P1Mid: "and, for business customers,",
    terms12DpaLink: "the data processing agreement (DPA)",
    terms12P1Post: ". Kvittino acts as data controller for account-related data and as data processor for personal data you as a business customer process about third parties (e.g. your employees' expenses) via the service.",
    terms12P2Pre: "A list of engaged sub-processors is available at",
    terms12P2Post: ". Data is stored in Sweden and processed within the EU/EEA, with the exceptions for transfers to third countries set out in the privacy policy.",
    terms13Title: "§ 13 Limitation of Liability",
    terms13P1: "Kvittino is provided \"as is\". We give no warranties — express or implied — as to the service's fitness for a particular purpose, uninterrupted operation or freedom from errors, beyond what follows from mandatory law.",
    terms13P2: "Our total liability to you in a calendar year is limited to the total amount you have actually paid for the service during the three (3) months preceding the event giving rise to the claim. For damage consisting of data loss caused by Kvittino's negligence the liability is however limited to a maximum of ten thousand (10,000) SEK per calendar year.",
    terms13P3: "We are not liable for indirect damages, loss of profit, loss of revenue or consequential damages of any kind — regardless of whether we have been informed of the risk of such damages.",
    terms13P4: "Nothing in these terms excludes or limits liability that cannot be contracted out of under mandatory law (e.g. personal injury caused by gross negligence or intent).",
    terms13P5: "If you are a consumer the limitations in this § 13 apply only to the extent compatible with mandatory consumer protection legislation, including rules on consumer services and consumer purchases and the Standard Contract Terms (Consumer Contracts) Act (1994:1512). Such legislation may give you rights beyond those stated in these terms, and nothing in the terms restricts those rights.",
    terms14Title: "§ 14 Force Majeure",
    terms14P1: "A party is relieved from liability for failure to perform an obligation under this agreement if the failure is due to a circumstance outside the party's control that the party could not reasonably have foreseen at the time of formation of the agreement and whose consequences the party could not reasonably have avoided or overcome — such as war, regulatory action, new or amended legislation, industrial disputes, major disruption of an infrastructure sub-supplier, fire, flooding or accident of major proportions. If performance of the agreement is prevented for a period exceeding three (3) months, each party has the right to terminate the agreement with immediate effect.",
    terms15Title: "§ 15 Changes to the Terms",
    terms15P1: "We may change these terms. For material changes we will send a notification to the email address you have registered, with at least 30 days' notice before the change takes effect.",
    terms15P2: "For business customers, continued use of the service after the change takes effect constitutes acceptance of the updated terms. For consumers, a material change to your detriment takes effect only if you have not terminated the agreement before the change date; otherwise you may close your account and subscription without extra charge before the change date.",
    terms16Title: "§ 16 Term and Termination",
    terms16P1: "The agreement runs indefinitely and may be terminated by either party at any time. You may close your account via the profile settings. We may terminate the agreement with 30 days' notice, or with immediate effect for a serious breach of these terms.",
    terms16P2: "If Kvittino terminates the agreement, or suspends an account under § 4, Kvittino shall — except where incompatible with law, a regulatory decision or necessary security measures — give you access to the account in read mode for thirty (30) days for the export of your records. If criminal activity is suspected Kvittino may instead retain the records and disclose them to the competent authority.",
    terms16P3: "Upon termination your right to use the service ends. Provisions on liability for uploaded content, limitation of liability, intellectual property rights, data storage and deletion, and dispute resolution continue to apply after the agreement ends.",
    terms17Title: "§ 17 Assignment",
    terms17P1: "You may not assign your rights or obligations under this agreement without our written consent. Kvittino may assign the agreement to another legal entity in connection with a merger, acquisition or transfer of all or a substantial part of the business, provided that the acquirer assumes these terms. We will inform you of such an assignment by email or in the service; if you are a consumer you have the right to terminate the agreement without charge if the assignment is to your detriment.",
    terms18Title: "§ 18 Governing Law and Disputes",
    terms18P1: "These terms are governed by and construed in accordance with Swedish law, without regard to its conflict-of-laws rules.",
    terms18P2: "Disputes shall in the first instance be resolved by negotiation between the parties. For disputes with businesses, the District Court of Stockholm is agreed as the exclusive forum in the first instance. For consumers this choice of forum applies only to the extent compatible with mandatory law; a consumer always has the right to bring an action before the court of their place of domicile.",
    terms18P3Pre: "Consumers also have the right to refer to",
    terms18ArnStrong: "the National Board for Consumer Disputes (ARN)",
    terms18P3Mid: ", for alternative dispute resolution. The European Commission's online dispute resolution platform (ODR) is available at",
    terms19Title: "§ 19 Miscellaneous",
    terms19P1: "If a provision of these terms is found to be invalid or unenforceable the remaining provisions shall remain in full force. The invalid provision shall be replaced by a valid provision that as closely as possible reflects its intended meaning.",
    terms19P2: "These terms constitute the entire agreement between the parties regarding the use of the service and supersede all prior agreements on the same subject matter.",
    termsFooter: "Contact: legal@kvittino.se · GlorifyTC · Reg. no. [xxxxxx-xxxx]",
  },
};