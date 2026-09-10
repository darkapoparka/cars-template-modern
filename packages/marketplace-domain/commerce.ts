export const COMMERCE_POLICY_VERSION = "launch-hypothesis-2026-07-26";

export type CommerceLocale = "bg" | "en";
export type CommercePlanKey =
  | "dealer-growth"
  | "dealer-scale"
  | "dealer-starter"
  | "private-free";
export type EntitlementSubject =
  | Readonly<{ id: string; kind: "dealer_org" }>
  | Readonly<{ id: string; kind: "private_seller" }>;
export type EntitlementLifecycleState =
  | "active"
  | "expired"
  | "fail_closed"
  | "grace"
  | "suspended"
  | "trial";
export type AnalyticsEntitlement = "advanced" | "basic" | "none";
export type PublicProfileEntitlement = "basic" | "enhanced" | "none";

export interface CommerceEntitlements {
  readonly activeListingLimit: number;
  readonly aiCreditPeriod: "month";
  readonly aiCreditsPerPeriod: number;
  readonly analytics: AnalyticsEntitlement;
  readonly apiAccess: boolean;
  readonly bulkImport: boolean;
  readonly feedAccess: boolean;
  readonly includedPromotionCreditsPerPeriod: number;
  readonly includedPromotionPeriod: "month";
  readonly locationLimit: number;
  readonly negotiatedCapacityAvailable: boolean;
  readonly publicProfile: PublicProfileEntitlement;
  readonly seatLimit: number;
  readonly slaReady: boolean;
}

export interface CommercePlanDefinition {
  readonly audience: "dealer" | "private";
  readonly entitlements: CommerceEntitlements;
  readonly key: CommercePlanKey;
  readonly label: Readonly<Record<CommerceLocale, string>>;
  readonly validationStatus: "launch_hypothesis";
}

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

export const parseCommerceEntitlements = (
  value: unknown
): CommerceEntitlements | null => {
  if (!(value && typeof value === "object" && !Array.isArray(value))) {
    return null;
  }

  const candidate = value as Partial<CommerceEntitlements>;
  if (
    !(
      isNonNegativeInteger(candidate.activeListingLimit) &&
      isNonNegativeInteger(candidate.aiCreditsPerPeriod)
    ) ||
    candidate.aiCreditPeriod !== "month" ||
    !["advanced", "basic", "none"].includes(candidate.analytics ?? "") ||
    typeof candidate.apiAccess !== "boolean" ||
    typeof candidate.bulkImport !== "boolean" ||
    typeof candidate.feedAccess !== "boolean" ||
    !isNonNegativeInteger(candidate.includedPromotionCreditsPerPeriod) ||
    candidate.includedPromotionPeriod !== "month" ||
    !isNonNegativeInteger(candidate.locationLimit) ||
    typeof candidate.negotiatedCapacityAvailable !== "boolean" ||
    !["basic", "enhanced", "none"].includes(candidate.publicProfile ?? "") ||
    !isNonNegativeInteger(candidate.seatLimit) ||
    typeof candidate.slaReady !== "boolean"
  ) {
    return null;
  }

  return candidate as CommerceEntitlements;
};

const privateFree: CommercePlanDefinition = {
  audience: "private",
  entitlements: {
    activeListingLimit: 2,
    aiCreditsPerPeriod: 0,
    aiCreditPeriod: "month",
    analytics: "none",
    apiAccess: false,
    bulkImport: false,
    feedAccess: false,
    includedPromotionCreditsPerPeriod: 0,
    includedPromotionPeriod: "month",
    locationLimit: 1,
    negotiatedCapacityAvailable: false,
    publicProfile: "none",
    seatLimit: 1,
    slaReady: false,
  },
  key: "private-free",
  label: { bg: "Частен безплатен", en: "Private Free" },
  validationStatus: "launch_hypothesis",
};

const dealerStarter: CommercePlanDefinition = {
  audience: "dealer",
  entitlements: {
    activeListingLimit: 10,
    aiCreditsPerPeriod: 0,
    aiCreditPeriod: "month",
    analytics: "basic",
    apiAccess: false,
    bulkImport: false,
    feedAccess: false,
    includedPromotionCreditsPerPeriod: 0,
    includedPromotionPeriod: "month",
    locationLimit: 1,
    negotiatedCapacityAvailable: false,
    publicProfile: "basic",
    seatLimit: 1,
    slaReady: false,
  },
  key: "dealer-starter",
  label: { bg: "Начален", en: "Dealer Starter" },
  validationStatus: "launch_hypothesis",
};

const dealerGrowth: CommercePlanDefinition = {
  audience: "dealer",
  entitlements: {
    activeListingLimit: 50,
    aiCreditsPerPeriod: 100,
    aiCreditPeriod: "month",
    analytics: "advanced",
    apiAccess: false,
    bulkImport: true,
    feedAccess: false,
    includedPromotionCreditsPerPeriod: 1,
    includedPromotionPeriod: "month",
    locationLimit: 1,
    negotiatedCapacityAvailable: false,
    publicProfile: "enhanced",
    seatLimit: 3,
    slaReady: false,
  },
  key: "dealer-growth",
  label: { bg: "Развитие", en: "Dealer Growth" },
  validationStatus: "launch_hypothesis",
};

const dealerScale: CommercePlanDefinition = {
  audience: "dealer",
  entitlements: {
    activeListingLimit: 200,
    aiCreditsPerPeriod: 500,
    aiCreditPeriod: "month",
    analytics: "advanced",
    apiAccess: true,
    bulkImport: true,
    feedAccess: true,
    includedPromotionCreditsPerPeriod: 4,
    includedPromotionPeriod: "month",
    locationLimit: 5,
    negotiatedCapacityAvailable: true,
    publicProfile: "enhanced",
    seatLimit: 10,
    slaReady: true,
  },
  key: "dealer-scale",
  label: { bg: "Мащаб", en: "Dealer Scale" },
  validationStatus: "launch_hypothesis",
};

export const commercePlanCatalog: Readonly<
  Record<CommercePlanKey, CommercePlanDefinition>
> = {
  "dealer-growth": dealerGrowth,
  "dealer-scale": dealerScale,
  "dealer-starter": dealerStarter,
  "private-free": privateFree,
};

type CommerceEntitlementOverrides = Partial<
  Record<CommercePlanKey, Partial<CommerceEntitlements>>
>;

const assertPositiveInteger = (value: number, label: string): void => {
  if (!(Number.isSafeInteger(value) && value > 0)) {
    throw new Error(`${label} must be a positive integer`);
  }
};

export const createCommercePlanCatalog = (
  overrides: CommerceEntitlementOverrides = {}
): Readonly<Record<CommercePlanKey, CommercePlanDefinition>> => {
  const catalog = Object.fromEntries(
    Object.entries(commercePlanCatalog).map(([key, plan]) => {
      const planKey = key as CommercePlanKey;
      return [
        planKey,
        {
          ...plan,
          entitlements: {
            ...plan.entitlements,
            ...overrides[planKey],
          },
        },
      ];
    })
  ) as unknown as Record<CommercePlanKey, CommercePlanDefinition>;

  for (const [key, plan] of Object.entries(catalog)) {
    assertPositiveInteger(
      plan.entitlements.activeListingLimit,
      `${key}.activeListingLimit`
    );
    assertPositiveInteger(
      plan.entitlements.locationLimit,
      `${key}.locationLimit`
    );
    assertPositiveInteger(plan.entitlements.seatLimit, `${key}.seatLimit`);
    if (
      !(
        Number.isSafeInteger(plan.entitlements.aiCreditsPerPeriod) &&
        plan.entitlements.aiCreditsPerPeriod >= 0
      )
    ) {
      throw new Error(
        `${key}.aiCreditsPerPeriod must be a non-negative integer`
      );
    }
  }

  return catalog;
};

export type EntitlementSource =
  | Readonly<{ kind: "private_free" }>
  | Readonly<{
      effectiveFrom: Date;
      effectiveUntil?: Date | null;
      entitlements?: CommerceEntitlements | null;
      graceUntil?: Date | null;
      kind: "grant";
      planKey: string;
      status:
        | "active"
        | "expired"
        | "grace"
        | "revoked"
        | "suspended"
        | "trialing";
    }>
  | Readonly<{
      currentPeriodEnd?: Date | null;
      currentPeriodStart?: Date | null;
      entitlements?: CommerceEntitlements | null;
      kind: "subscription";
      planKey: string;
      status:
        | "active"
        | "canceled"
        | "incomplete"
        | "past_due"
        | "paused"
        | "trialing";
      trialEnd?: Date | null;
    }>
  | Readonly<{ kind: "unavailable" }>;

export interface ResolvedEntitlement {
  readonly effectivePeriod: Readonly<{
    endsAt: Date | null;
    startsAt: Date | null;
  }>;
  readonly entitlements: CommerceEntitlements;
  readonly plan: CommercePlanDefinition | null;
  readonly policyVersion: typeof COMMERCE_POLICY_VERSION;
  readonly source: EntitlementSource["kind"];
  readonly state: EntitlementLifecycleState;
  readonly subject: EntitlementSubject;
}

const failClosedEntitlements: CommerceEntitlements = {
  ...privateFree.entitlements,
  activeListingLimit: 0,
  locationLimit: 0,
  publicProfile: "none",
  seatLimit: 0,
};

const isBefore = (candidate: Date | null | undefined, now: Date): boolean =>
  Boolean(candidate && candidate.getTime() > now.getTime());

const resolveGrantState = (
  source: Extract<EntitlementSource, { kind: "grant" }>,
  now: Date
): EntitlementLifecycleState => {
  if (source.effectiveFrom.getTime() > now.getTime()) {
    return "fail_closed";
  }
  if (source.status === "revoked" || source.status === "suspended") {
    return "suspended";
  }
  if (source.status === "expired") {
    return "expired";
  }
  if (source.status === "grace") {
    return isBefore(source.graceUntil, now) ? "grace" : "expired";
  }
  if (source.effectiveUntil && !isBefore(source.effectiveUntil, now)) {
    return isBefore(source.graceUntil, now) ? "grace" : "expired";
  }
  return source.status === "trialing" ? "trial" : "active";
};

const resolveSubscriptionState = (
  source: Extract<EntitlementSource, { kind: "subscription" }>,
  now: Date
): EntitlementLifecycleState => {
  if (source.status === "paused") {
    return "suspended";
  }
  if (source.status === "canceled" || source.status === "incomplete") {
    return "expired";
  }
  if (source.status === "past_due") {
    return "grace";
  }
  const periodEnd =
    source.status === "trialing" ? source.trialEnd : source.currentPeriodEnd;
  if (!(periodEnd && isBefore(periodEnd, now))) {
    return "expired";
  }
  if (
    source.currentPeriodStart &&
    source.currentPeriodStart.getTime() > now.getTime()
  ) {
    return "fail_closed";
  }
  return source.status === "trialing" ? "trial" : "active";
};

export const resolveEntitlement = ({
  catalog = commercePlanCatalog,
  now = new Date(),
  source,
  subject,
}: {
  readonly catalog?: Readonly<Record<CommercePlanKey, CommercePlanDefinition>>;
  readonly now?: Date;
  readonly source: EntitlementSource;
  readonly subject: EntitlementSubject;
}): ResolvedEntitlement => {
  if (subject.kind === "private_seller") {
    return {
      effectivePeriod: { endsAt: null, startsAt: null },
      entitlements: catalog["private-free"].entitlements,
      plan: catalog["private-free"],
      policyVersion: COMMERCE_POLICY_VERSION,
      source: "private_free",
      state: "active",
      subject,
    };
  }

  if (source.kind === "unavailable" || source.kind === "private_free") {
    return {
      effectivePeriod: { endsAt: null, startsAt: null },
      entitlements: failClosedEntitlements,
      plan: null,
      policyVersion: COMMERCE_POLICY_VERSION,
      source: source.kind,
      state: "fail_closed",
      subject,
    };
  }

  const plan = catalog[source.planKey as CommercePlanKey];
  if (!(plan && plan.audience === "dealer")) {
    return {
      effectivePeriod: { endsAt: null, startsAt: null },
      entitlements: failClosedEntitlements,
      plan: null,
      policyVersion: COMMERCE_POLICY_VERSION,
      source: source.kind,
      state: "fail_closed",
      subject,
    };
  }

  if (source.entitlements === null) {
    return {
      effectivePeriod: { endsAt: null, startsAt: null },
      entitlements: failClosedEntitlements,
      plan: null,
      policyVersion: COMMERCE_POLICY_VERSION,
      source: source.kind,
      state: "fail_closed",
      subject,
    };
  }

  return {
    effectivePeriod:
      source.kind === "grant"
        ? {
            endsAt: source.effectiveUntil ?? null,
            startsAt: source.effectiveFrom,
          }
        : {
            endsAt:
              source.status === "trialing"
                ? (source.trialEnd ?? null)
                : (source.currentPeriodEnd ?? null),
            startsAt: source.currentPeriodStart ?? null,
          },
    entitlements: source.entitlements ?? plan.entitlements,
    plan,
    policyVersion: COMMERCE_POLICY_VERSION,
    source: source.kind,
    state:
      source.kind === "grant"
        ? resolveGrantState(source, now)
        : resolveSubscriptionState(source, now),
    subject,
  };
};

export type ListingQuotaDecisionCode =
  | "allowed"
  | "already_active"
  | "entitlement_expired"
  | "entitlement_grace"
  | "entitlement_suspended"
  | "plan_unavailable"
  | "quota_reached";

export interface ListingQuotaDecision {
  readonly allowed: boolean;
  readonly code: ListingQuotaDecisionCode;
  readonly limit: number;
  readonly overage: number;
  readonly remaining: number;
  readonly usage: number;
}

export const evaluateActiveListingQuota = ({
  activeListingCount,
  entitlement,
  listingAlreadyActive = false,
}: {
  readonly activeListingCount: number;
  readonly entitlement: ResolvedEntitlement;
  readonly listingAlreadyActive?: boolean;
}): ListingQuotaDecision => {
  const limit = entitlement.entitlements.activeListingLimit;
  const usage = Math.max(0, activeListingCount);
  const overage = Math.max(0, usage - limit);
  const remaining = Math.max(0, limit - usage);

  if (listingAlreadyActive) {
    return {
      allowed: true,
      code: "already_active",
      limit,
      overage,
      remaining,
      usage,
    };
  }

  const stateCode: Partial<
    Record<EntitlementLifecycleState, ListingQuotaDecisionCode>
  > = {
    expired: "entitlement_expired",
    fail_closed: "plan_unavailable",
    grace: "entitlement_grace",
    suspended: "entitlement_suspended",
  };
  const blockedCode = stateCode[entitlement.state];
  if (blockedCode) {
    return {
      allowed: false,
      code: blockedCode,
      limit,
      overage,
      remaining,
      usage,
    };
  }

  if (usage >= limit) {
    return {
      allowed: false,
      code: "quota_reached",
      limit,
      overage,
      remaining,
      usage,
    };
  }

  return {
    allowed: true,
    code: "allowed",
    limit,
    overage,
    remaining,
    usage,
  };
};

export const quotaRecoveryCopy: Readonly<
  Record<
    Exclude<ListingQuotaDecisionCode, "allowed" | "already_active">,
    Readonly<Record<CommerceLocale, string>>
  >
> = {
  entitlement_expired: {
    bg: "Планът е изтекъл. Активните обяви не се изтриват, но ново публикуване е спряно до потвърден план.",
    en: "The plan has expired. Active listings are not deleted, but new publishing is blocked until a plan is confirmed.",
  },
  entitlement_grace: {
    bg: "Акаунтът е в гратисен период. Текущите обяви остават, но ново публикуване е спряно до уреждане на плана.",
    en: "The account is in grace. Current listings remain, but new publishing is blocked until the plan is resolved.",
  },
  entitlement_suspended: {
    bg: "Правото за публикуване е временно спряно. Обявите не се изтриват; свържете се с поддръжката.",
    en: "Publishing access is suspended. Listings are not deleted; contact support.",
  },
  plan_unavailable: {
    bg: "Няма надеждно потвърден план. Не активираме обявата и не симулираме платен достъп.",
    en: "No reliable plan is confirmed. The listing is not activated and paid access is not simulated.",
  },
  quota_reached: {
    bg: "Достигнат е лимитът за активни обяви. Поставете активна обява на пауза или прегледайте плановете.",
    en: "The active-listing limit is reached. Pause an active listing or review the plans.",
  },
};

export const getQuotaRecoveryCopy = (
  code: ListingQuotaDecisionCode,
  locale: CommerceLocale
): string | null =>
  code === "allowed" || code === "already_active"
    ? null
    : quotaRecoveryCopy[code][locale];

export const QUOTA_TRANSITION_POLICY = {
  deletesListings: false,
  downgradeBehavior:
    "Keep active inventory visible; block additional activation while usage is at or above the new limit.",
  expiryBehavior:
    "Keep inventory records; block activation and require explicit pause/archive reconciliation rather than deletion.",
  pausedAndDraftUsage: "Paused and draft listings do not consume active quota.",
  providerOutageBehavior:
    "Honor a durable in-period grant or subscription snapshot; otherwise fail closed without changing listing status.",
} as const;

export type PromotionPlacement =
  | "category_featured"
  | "lease_partner"
  | "search_top";

export interface PromotionCatalogProduct {
  readonly description: Readonly<Record<CommerceLocale, string>>;
  readonly disclosureLabel: Readonly<Record<CommerceLocale, string>>;
  readonly durationDays: 7 | 14 | 30;
  readonly id:
    | "promo-category-featured-14"
    | "promo-lease-partner-30"
    | "promo-search-top-7";
  readonly label: Readonly<Record<CommerceLocale, string>>;
  readonly placement: PromotionPlacement;
}

export const promotionProductCatalog: readonly PromotionCatalogProduct[] = [
  {
    description: {
      bg: "Отделен спонсориран слот само когато обявата отговаря на органичните критерии.",
      en: "A separate sponsored slot only when the listing matches the organic criteria.",
    },
    disclosureLabel: { bg: "Спонсорирана", en: "Sponsored" },
    durationDays: 7,
    id: "promo-search-top-7",
    label: {
      bg: "Водеща позиция в търсенето",
      en: "Search top placement",
    },
    placement: "search_top",
  },
  {
    description: {
      bg: "Обозначена препоръчана карта в подходящи страници по категория.",
      en: "A labeled featured card on eligible category pages.",
    },
    disclosureLabel: { bg: "Спонсорирана", en: "Sponsored" },
    durationDays: 14,
    id: "promo-category-featured-14",
    label: {
      bg: "Препоръчана в категория",
      en: "Category featured",
    },
    placement: "category_featured",
  },
  {
    description: {
      bg: "Обозначено позициониране само за обяви, допустими за финансиране.",
      en: "Labeled placement only for finance-eligible listings.",
    },
    disclosureLabel: { bg: "Спонсорирана", en: "Sponsored" },
    durationDays: 30,
    id: "promo-lease-partner-30",
    label: {
      bg: "Позиция при лизингов партньор",
      en: "Lease partner placement",
    },
    placement: "lease_partner",
  },
] as const;

export const promotionPlacementPolicy = {
  maxConcurrentPerListing: 1,
  maxImpressionsPerViewerPerDay: 3,
  maxSponsoredSlotsPerResult: 3,
  organicEligibilityRequired: true,
  rankingBoundary: "separate_sponsored_lane",
} as const;

export type PromotionPaymentStatus =
  | "canceled"
  | "failed"
  | "included_credit"
  | "paid"
  | "partially_refunded"
  | "pending"
  | "refund_pending"
  | "refunded"
  | "unpaid";

export type PromotionEligibilityCode =
  | "already_promoted"
  | "eligible"
  | "listing_inactive"
  | "organization_mismatch"
  | "product_unknown";

export interface PromotionEligibilityDecision {
  readonly allowed: boolean;
  readonly code: PromotionEligibilityCode;
  readonly product: PromotionCatalogProduct | null;
}

export const getPromotionCatalogProduct = (
  productId?: string
): PromotionCatalogProduct | undefined =>
  promotionProductCatalog.find((product) => product.id === productId);

export const evaluatePromotionEligibility = ({
  activePromotionCount,
  actorDealerOrgId,
  listing,
  productId,
}: {
  readonly activePromotionCount: number;
  readonly actorDealerOrgId: string;
  readonly listing: Readonly<{
    dealerOrgId: string | null;
    deletedAt?: Date | null;
    status: string;
  }>;
  readonly productId: string;
}): PromotionEligibilityDecision => {
  const product = getPromotionCatalogProduct(productId) ?? null;
  if (!product) {
    return { allowed: false, code: "product_unknown", product };
  }
  if (listing.dealerOrgId !== actorDealerOrgId) {
    return { allowed: false, code: "organization_mismatch", product };
  }
  if (listing.deletedAt || listing.status !== "active") {
    return { allowed: false, code: "listing_inactive", product };
  }
  if (
    activePromotionCount >= promotionPlacementPolicy.maxConcurrentPerListing
  ) {
    return { allowed: false, code: "already_promoted", product };
  }
  return { allowed: true, code: "eligible", product };
};

export interface PromotionActivationState {
  readonly activatedAt?: Date | null;
  readonly activatedByEventId?: string | null;
  readonly dealerOrgId: string;
  readonly endsAt: Date;
  readonly listingStatus: string;
  readonly paymentStatus: PromotionPaymentStatus;
  readonly startsAt: Date;
  readonly status: "active" | "canceled" | "ended" | "paused" | "scheduled";
}

export type PromotionActivationDecision =
  | Readonly<{ code: "activated"; next: PromotionActivationState }>
  | Readonly<{ code: "idempotent"; next: PromotionActivationState }>
  | Readonly<{
      code:
        | "organization_mismatch"
        | "outside_window"
        | "payment_unverified"
        | "promotion_terminal"
        | "listing_inactive";
      next: PromotionActivationState;
    }>;

export const evaluatePromotionActivation = ({
  actorDealerOrgId,
  eventId,
  now = new Date(),
  promotion,
}: {
  readonly actorDealerOrgId: string;
  readonly eventId: string;
  readonly now?: Date;
  readonly promotion: PromotionActivationState;
}): PromotionActivationDecision => {
  if (promotion.activatedByEventId === eventId) {
    return { code: "idempotent", next: promotion };
  }
  if (promotion.dealerOrgId !== actorDealerOrgId) {
    return { code: "organization_mismatch", next: promotion };
  }
  if (promotion.status === "canceled" || promotion.status === "ended") {
    return { code: "promotion_terminal", next: promotion };
  }
  if (promotion.listingStatus !== "active") {
    return { code: "listing_inactive", next: promotion };
  }
  if (
    promotion.paymentStatus !== "paid" &&
    promotion.paymentStatus !== "included_credit"
  ) {
    return { code: "payment_unverified", next: promotion };
  }
  if (
    promotion.startsAt.getTime() > now.getTime() ||
    promotion.endsAt.getTime() <= now.getTime()
  ) {
    return { code: "outside_window", next: promotion };
  }

  return {
    code: "activated",
    next: {
      ...promotion,
      activatedAt: promotion.activatedAt ?? now,
      activatedByEventId: eventId,
      status: "active",
    },
  };
};

export interface SponsoredPromotionCandidate {
  readonly endsAt: Date;
  readonly id: string;
  readonly listingId: string;
  readonly listingStatus: string;
  readonly organicallyEligible: boolean;
  readonly paymentStatus: PromotionPaymentStatus;
  readonly startsAt: Date;
  readonly status: string;
  readonly viewerImpressionsToday: number;
}

export const selectSponsoredPromotions = ({
  candidates,
  now = new Date(),
}: {
  readonly candidates: readonly SponsoredPromotionCandidate[];
  readonly now?: Date;
}): readonly SponsoredPromotionCandidate[] =>
  candidates
    .filter(
      (candidate) =>
        candidate.status === "active" &&
        candidate.listingStatus === "active" &&
        candidate.organicallyEligible &&
        (candidate.paymentStatus === "paid" ||
          candidate.paymentStatus === "included_credit") &&
        candidate.startsAt.getTime() <= now.getTime() &&
        candidate.endsAt.getTime() > now.getTime() &&
        candidate.viewerImpressionsToday <
          promotionPlacementPolicy.maxImpressionsPerViewerPerDay
    )
    .sort(
      (left, right) =>
        left.startsAt.getTime() - right.startsAt.getTime() ||
        left.id.localeCompare(right.id)
    )
    .slice(0, promotionPlacementPolicy.maxSponsoredSlotsPerResult);

export type MeteredEntitlementKey = "ai_credit" | "included_promotion";

export interface MeteredQuotaDecision {
  readonly allowed: boolean;
  readonly code: "allowed" | "entitlement_not_active" | "metered_quota_reached";
  readonly limit: number;
  readonly remaining: number;
  readonly requested: number;
  readonly usage: number;
}

export const getMeteredEntitlementLimit = (
  entitlement: ResolvedEntitlement,
  featureKey: MeteredEntitlementKey
): number =>
  featureKey === "ai_credit"
    ? entitlement.entitlements.aiCreditsPerPeriod
    : entitlement.entitlements.includedPromotionCreditsPerPeriod;

export const evaluateMeteredEntitlementQuota = ({
  entitlement,
  featureKey,
  requested,
  usage,
}: {
  readonly entitlement: ResolvedEntitlement;
  readonly featureKey: MeteredEntitlementKey;
  readonly requested: number;
  readonly usage: number;
}): MeteredQuotaDecision => {
  if (!(Number.isSafeInteger(requested) && requested > 0)) {
    throw new Error("Metered entitlement request must be a positive integer");
  }
  const limit = getMeteredEntitlementLimit(entitlement, featureKey);
  const normalizedUsage = Math.max(0, usage);
  const remaining = Math.max(0, limit - normalizedUsage);
  if (entitlement.state !== "active" && entitlement.state !== "trial") {
    return {
      allowed: false,
      code: "entitlement_not_active",
      limit,
      remaining,
      requested,
      usage: normalizedUsage,
    };
  }
  if (requested > remaining) {
    return {
      allowed: false,
      code: "metered_quota_reached",
      limit,
      remaining,
      requested,
      usage: normalizedUsage,
    };
  }
  return {
    allowed: true,
    code: "allowed",
    limit,
    remaining: remaining - requested,
    requested,
    usage: normalizedUsage,
  };
};

export type EntitlementUsageInput = {
  readonly actorAccountId?: string;
  readonly delta: number;
  readonly featureKey: string;
  readonly idempotencyKey: string;
  readonly periodEnd: Date;
  readonly periodStart: Date;
  readonly sourceEntityId?: string;
  readonly sourceEntityType?: string;
  readonly subject: EntitlementSubject;
};

export interface EntitlementUsagePort {
  getEntitlement(
    subject: EntitlementSubject,
    now?: Date
  ): Promise<ResolvedEntitlement>;
  recordUsage(input: EntitlementUsageInput): Promise<"created" | "idempotent">;
  reserveUsage(
    input: Omit<
      EntitlementUsageInput,
      "delta" | "featureKey" | "periodEnd" | "periodStart"
    > & {
      readonly featureKey: MeteredEntitlementKey;
      readonly now?: Date;
      readonly quantity: number;
    }
  ): Promise<
    Readonly<{
      decision: MeteredQuotaDecision;
      status: "created" | "idempotent";
    }>
  >;
}

export type PromotionCheckoutResult =
  | Readonly<{
      reason:
        | "provider_disabled"
        | "provider_misconfigured"
        | "projection_unavailable";
      status: "unavailable";
    }>
  | Readonly<{
      checkoutSessionId: string;
      redirectUrl: string;
      status: "created";
    }>;

export interface PromotionCheckoutPort {
  createCheckout(input: {
    readonly dealerOrgId: string;
    readonly idempotencyKey: string;
    readonly listingId: string;
    readonly productId: PromotionCatalogProduct["id"];
  }): Promise<PromotionCheckoutResult>;
}

export const providerDisabledPromotionCheckoutPort: PromotionCheckoutPort = {
  createCheckout: async () => ({
    reason: "provider_disabled",
    status: "unavailable",
  }),
};
