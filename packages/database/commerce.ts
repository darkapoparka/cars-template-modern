import "server-only";

import {
  type EntitlementSubject,
  type EntitlementUsagePort,
  evaluateActiveListingQuota,
  evaluateMeteredEntitlementQuota,
  getQuotaRecoveryCopy,
  type ListingQuotaDecision,
  type MeteredQuotaDecision,
  parseCommerceEntitlements,
  type ResolvedEntitlement,
  resolveEntitlement,
} from "@repo/marketplace-domain/commerce";
import type { Prisma } from "./generated/client";
import { database } from "./index";

type CommerceClient = Prisma.TransactionClient;

const asCommerceClient = () => database as unknown as CommerceClient;

const getSubscriptionSource = async (
  client: CommerceClient,
  dealerOrgId: string
) => {
  const billingAccount = await client.dealerBillingAccount.findUnique({
    select: {
      subscriptions: {
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
          currentPeriodEnd: true,
          currentPeriodStart: true,
          entitlementsSnapshot: true,
          planKey: true,
          status: true,
          trialEnd: true,
        },
        take: 1,
        where: {
          status: {
            in: [
              "active",
              "canceled",
              "incomplete",
              "past_due",
              "paused",
              "trialing",
            ],
          },
        },
      },
    },
    where: { dealerOrgId },
  });
  const subscription = billingAccount?.subscriptions.at(0);
  if (!subscription) {
    return null;
  }

  return {
    currentPeriodEnd: subscription.currentPeriodEnd,
    currentPeriodStart: subscription.currentPeriodStart,
    entitlements:
      subscription.entitlementsSnapshot === null
        ? undefined
        : parseCommerceEntitlements(subscription.entitlementsSnapshot),
    kind: "subscription" as const,
    planKey: subscription.planKey,
    status: subscription.status,
    trialEnd: subscription.trialEnd,
  };
};

const getGrantSource = async (
  client: CommerceClient,
  dealerOrgId: string,
  now: Date
) => {
  const grant = await client.entitlementGrant.findFirst({
    orderBy: [{ effectiveFrom: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    select: {
      effectiveFrom: true,
      effectiveUntil: true,
      entitlementsSnapshot: true,
      graceUntil: true,
      planKey: true,
      status: true,
    },
    where: {
      dealerOrgId,
      effectiveFrom: { lte: now },
      OR: [
        { effectiveUntil: null },
        { effectiveUntil: { gt: now } },
        { graceUntil: { gt: now } },
        { status: { in: ["revoked", "suspended"] } },
      ],
      status: {
        in: ["active", "grace", "revoked", "suspended", "trialing"],
      },
    },
  });
  if (!grant) {
    return null;
  }

  return {
    effectiveFrom: grant.effectiveFrom,
    effectiveUntil: grant.effectiveUntil,
    entitlements: parseCommerceEntitlements(grant.entitlementsSnapshot),
    graceUntil: grant.graceUntil,
    kind: "grant" as const,
    planKey: grant.planKey,
    status: grant.status,
  };
};

export const getCommerceEntitlement = async (
  subject: EntitlementSubject,
  now = new Date(),
  client: CommerceClient = asCommerceClient()
): Promise<ResolvedEntitlement> => {
  if (subject.kind === "private_seller") {
    return resolveEntitlement({
      now,
      source: { kind: "private_free" },
      subject,
    });
  }

  const grant = await getGrantSource(client, subject.id, now);
  if (grant) {
    return resolveEntitlement({ now, source: grant, subject });
  }

  const subscription = await getSubscriptionSource(client, subject.id);
  return resolveEntitlement({
    now,
    source: subscription ?? { kind: "unavailable" },
    subject,
  });
};

export interface ActiveListingQuotaView {
  readonly decision: ListingQuotaDecision;
  readonly entitlement: ResolvedEntitlement;
}

const getSubjectActiveListingWhere = (
  subject: EntitlementSubject
): Prisma.MarketplaceListingWhereInput =>
  subject.kind === "dealer_org"
    ? { dealerOrgId: subject.id, deletedAt: null, status: "active" }
    : { sellerProfileId: subject.id, deletedAt: null, status: "active" };

export const getActiveListingQuotaView = async (
  subject: EntitlementSubject,
  now = new Date(),
  client: CommerceClient = asCommerceClient()
): Promise<ActiveListingQuotaView> => {
  const [entitlement, activeListingCount] = await Promise.all([
    getCommerceEntitlement(subject, now, client),
    client.marketplaceListing.count({
      where: getSubjectActiveListingWhere(subject),
    }),
  ]);

  return {
    decision: evaluateActiveListingQuota({
      activeListingCount,
      entitlement,
    }),
    entitlement,
  };
};

export class ActiveListingQuotaError extends Error {
  readonly decision: ListingQuotaDecision;
  readonly recovery: Readonly<Record<"bg" | "en", string>>;

  constructor(decision: ListingQuotaDecision) {
    const en =
      getQuotaRecoveryCopy(decision.code, "en") ??
      "The listing activation is not allowed.";
    super(en);
    this.name = "ActiveListingQuotaError";
    this.decision = decision;
    this.recovery = {
      bg:
        getQuotaRecoveryCopy(decision.code, "bg") ??
        "Активирането на обявата не е разрешено.",
      en,
    };
  }
}

export const assertActiveListingQuota = async ({
  client,
  now = new Date(),
  subject,
}: {
  readonly client: CommerceClient;
  readonly now?: Date;
  readonly subject: EntitlementSubject;
}): Promise<ActiveListingQuotaView> => {
  const view = await getActiveListingQuotaView(subject, now, client);
  if (!view.decision.allowed) {
    throw new ActiveListingQuotaError(view.decision);
  }
  return view;
};

const sameUsageSubject = (
  event: {
    readonly dealerOrgId: string | null;
    readonly sellerProfileId: string | null;
  },
  subject: EntitlementSubject
): boolean =>
  subject.kind === "dealer_org"
    ? event.dealerOrgId === subject.id && event.sellerProfileId === null
    : event.sellerProfileId === subject.id && event.dealerOrgId === null;

export const recordEntitlementUsage = async (
  input: Parameters<EntitlementUsagePort["recordUsage"]>[0],
  client: CommerceClient = asCommerceClient()
): Promise<"created" | "idempotent"> => {
  const existing = await client.entitlementUsageEvent.findUnique({
    select: {
      dealerOrgId: true,
      delta: true,
      featureKey: true,
      periodEnd: true,
      periodStart: true,
      sellerProfileId: true,
      sourceEntityId: true,
      sourceEntityType: true,
    },
    where: { idempotencyKey: input.idempotencyKey },
  });

  if (existing) {
    const matches =
      sameUsageSubject(existing, input.subject) &&
      existing.delta === input.delta &&
      existing.featureKey === input.featureKey &&
      existing.periodStart.getTime() === input.periodStart.getTime() &&
      existing.periodEnd.getTime() === input.periodEnd.getTime() &&
      existing.sourceEntityId === (input.sourceEntityId ?? null) &&
      existing.sourceEntityType === (input.sourceEntityType ?? null);
    if (!matches) {
      throw new Error("Entitlement usage idempotency conflict");
    }
    return "idempotent";
  }

  await client.entitlementUsageEvent.create({
    data: {
      actorAccountId: input.actorAccountId,
      dealerOrgId:
        input.subject.kind === "dealer_org" ? input.subject.id : undefined,
      delta: input.delta,
      featureKey: input.featureKey,
      idempotencyKey: input.idempotencyKey,
      periodEnd: input.periodEnd,
      periodStart: input.periodStart,
      sellerProfileId:
        input.subject.kind === "private_seller" ? input.subject.id : undefined,
      sourceEntityId: input.sourceEntityId,
      sourceEntityType: input.sourceEntityType,
    },
  });
  return "created";
};

type MeteredUsageReservationInput = Parameters<
  EntitlementUsagePort["reserveUsage"]
>[0];

export class MeteredEntitlementQuotaError extends Error {
  readonly decision: MeteredQuotaDecision;

  constructor(decision: MeteredQuotaDecision) {
    super(
      decision.code === "entitlement_not_active"
        ? "The entitlement is not active."
        : "The metered entitlement quota has been reached."
    );
    this.name = "MeteredEntitlementQuotaError";
    this.decision = decision;
  }
}

const getMonthlyUsagePeriod = (
  now: Date
): Readonly<{ periodEnd: Date; periodStart: Date }> => ({
  periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
});

const getMeteredUsageWhere = (
  input: Pick<MeteredUsageReservationInput, "featureKey" | "subject">,
  period: Readonly<{ periodEnd: Date; periodStart: Date }>
): Prisma.EntitlementUsageEventWhereInput => ({
  dealerOrgId:
    input.subject.kind === "dealer_org" ? input.subject.id : undefined,
  featureKey: input.featureKey,
  periodEnd: period.periodEnd,
  periodStart: period.periodStart,
  sellerProfileId:
    input.subject.kind === "private_seller" ? input.subject.id : undefined,
});

const reserveEntitlementUsageInTransaction = async (
  input: MeteredUsageReservationInput,
  client: CommerceClient
): Promise<
  Readonly<{
    decision: MeteredQuotaDecision;
    status: "created" | "idempotent";
  }>
> => {
  const existing = await client.entitlementUsageEvent.findUnique({
    select: {
      dealerOrgId: true,
      delta: true,
      featureKey: true,
      periodEnd: true,
      periodStart: true,
      sellerProfileId: true,
      sourceEntityId: true,
      sourceEntityType: true,
    },
    where: { idempotencyKey: input.idempotencyKey },
  });
  const now = input.now ?? new Date();
  const entitlement = await getCommerceEntitlement(input.subject, now, client);

  if (existing) {
    await recordEntitlementUsage(
      {
        actorAccountId: input.actorAccountId,
        delta: input.quantity,
        featureKey: input.featureKey,
        idempotencyKey: input.idempotencyKey,
        periodEnd: existing.periodEnd,
        periodStart: existing.periodStart,
        sourceEntityId: input.sourceEntityId,
        sourceEntityType: input.sourceEntityType,
        subject: input.subject,
      },
      client
    );
    const aggregate = await client.entitlementUsageEvent.aggregate({
      _sum: { delta: true },
      where: getMeteredUsageWhere(input, {
        periodEnd: existing.periodEnd,
        periodStart: existing.periodStart,
      }),
    });
    const usage = Math.max(0, aggregate._sum.delta ?? 0);
    const limit = Math.max(
      usage,
      input.featureKey === "ai_credit"
        ? entitlement.entitlements.aiCreditsPerPeriod
        : entitlement.entitlements.includedPromotionCreditsPerPeriod
    );
    return {
      decision: {
        allowed: true,
        code: "allowed",
        limit,
        remaining: Math.max(0, limit - usage),
        requested: input.quantity,
        usage,
      },
      status: "idempotent",
    };
  }

  const period = getMonthlyUsagePeriod(now);
  const aggregate = await client.entitlementUsageEvent.aggregate({
    _sum: { delta: true },
    where: getMeteredUsageWhere(input, period),
  });
  const decision = evaluateMeteredEntitlementQuota({
    entitlement,
    featureKey: input.featureKey,
    requested: input.quantity,
    usage: aggregate._sum.delta ?? 0,
  });
  if (!decision.allowed) {
    throw new MeteredEntitlementQuotaError(decision);
  }

  const status = await recordEntitlementUsage(
    {
      actorAccountId: input.actorAccountId,
      delta: input.quantity,
      featureKey: input.featureKey,
      idempotencyKey: input.idempotencyKey,
      periodEnd: period.periodEnd,
      periodStart: period.periodStart,
      sourceEntityId: input.sourceEntityId,
      sourceEntityType: input.sourceEntityType,
      subject: input.subject,
    },
    client
  );
  return { decision, status };
};

export const reserveEntitlementUsage = async (
  input: MeteredUsageReservationInput
): Promise<
  Readonly<{
    decision: MeteredQuotaDecision;
    status: "created" | "idempotent";
  }>
> =>
  database.$transaction(
    (client) => reserveEntitlementUsageInTransaction(input, client),
    { isolationLevel: "Serializable" }
  );

export const commerceEntitlementPort: EntitlementUsagePort = {
  getEntitlement: (subject, now) => getCommerceEntitlement(subject, now),
  recordUsage: (input) => recordEntitlementUsage(input),
  reserveUsage: (input) => reserveEntitlementUsage(input),
};
