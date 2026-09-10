import "server-only";

import { randomUUID } from "node:crypto";
import {
  canTransitionListingStatus,
  type ListingStatus as DomainListingStatus,
  isSourceManagedListing,
  type ListingInput,
} from "@repo/marketplace-domain";
import { assertActiveListingQuota, recordEntitlementUsage } from "./commerce";
import type {
  DealerRole,
  ListingStatus,
  MarketplaceListing,
  Prisma,
} from "./generated/client";
import { database } from "./index";

const PRICE_MINOR_SCALE = 100;
const DEALER_LISTING_WRITER_ROLES = [
  "owner",
  "manager",
  "sales",
] as const satisfies readonly DealerRole[];

export const SOURCE_MANAGED_EDIT_ERROR =
  "Source-managed listings can only be changed through inventory ingestion";
export const SOURCE_MANAGED_ACTIVATION_ERROR =
  "Source-managed listings can only be activated by inventory reconciliation";
export const OWNER_REVIEW_ACTIVATION_ERROR =
  "Listings pending review require a trusted approval before publication";
export const INVALID_LISTING_ACTOR_CONTEXT_ERROR =
  "Organization listing context is incomplete";
export const INVALID_LISTING_OWNER_CONTEXT_ERROR =
  "Listing ownership context is invalid";

export const assertOwnedListingIsManuallyEditable = (listing: {
  readonly inventoryOfferId?: string | null;
  readonly marketPublicationId?: string | null;
}): void => {
  if (isSourceManagedListing(listing)) {
    throw new Error(SOURCE_MANAGED_EDIT_ERROR);
  }
};

export const assertOwnedListingTransitionAllowed = (
  listing: {
    readonly inventoryOfferId?: string | null;
    readonly marketPublicationId?: string | null;
  },
  toStatus: DomainListingStatus
): void => {
  if (toStatus === "active" && isSourceManagedListing(listing)) {
    throw new Error(SOURCE_MANAGED_ACTIVATION_ERROR);
  }
};

export const assertOwnerModerationTransitionAllowed = (
  fromStatus: DomainListingStatus,
  toStatus: DomainListingStatus
): void => {
  if (fromStatus === "pending_review" && toStatus === "active") {
    throw new Error(OWNER_REVIEW_ACTIVATION_ERROR);
  }
};

export interface ListingActorInput {
  readonly city: string;
  readonly clerkOrgId?: string;
  readonly clerkUserId: string;
  readonly displayName: string;
  readonly orgRole?: string;
}

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const createSlug = (input: ListingInput) =>
  `${slugify(`${input.make}-${input.model}-${input.year}`)}-${randomUUID().slice(0, 8)}`;

const toListingData = (input: ListingInput) => ({
  bodyType: input.bodyType,
  category: input.category,
  colorExterior: input.colorExterior,
  derivative: input.derivative,
  description: input.description,
  enginePowerHp: input.enginePowerHp,
  fuelType: input.fuelType,
  locationCity: input.locationCity,
  locationCountry: input.locationCountry,
  locationRegion: input.locationRegion,
  make: input.make,
  mileageValue: input.mileageValue,
  model: input.model,
  monthlyAmountMinor:
    input.monthlyAmount === undefined
      ? undefined
      : input.monthlyAmount * PRICE_MINOR_SCALE,
  monthlyCurrency:
    input.monthlyAmount === undefined ? undefined : input.priceCurrency,
  priceAmountMinor: input.priceAmount * PRICE_MINOR_SCALE,
  priceCurrency: input.priceCurrency,
  priceType: input.priceType,
  title: input.title,
  transmission: input.transmission,
  trim: input.trim,
  vin: input.vin,
  vinLast4: input.vin?.slice(-4),
  year: input.year,
});

const getOwnershipWhere = (owner: {
  dealerOrgId?: string;
  sellerProfileId?: string;
}): Prisma.MarketplaceListingWhereInput => {
  if (owner.dealerOrgId && !owner.sellerProfileId) {
    return { dealerOrgId: owner.dealerOrgId, deletedAt: null };
  }

  if (owner.sellerProfileId && !owner.dealerOrgId) {
    return { deletedAt: null, sellerProfileId: owner.sellerProfileId };
  }

  throw new Error(INVALID_LISTING_OWNER_CONTEXT_ERROR);
};

const getEntitlementSubject = (owner: {
  readonly dealerOrgId?: string;
  readonly sellerProfileId?: string;
}) => {
  if (owner.dealerOrgId && !owner.sellerProfileId) {
    return { id: owner.dealerOrgId, kind: "dealer_org" } as const;
  }
  if (owner.sellerProfileId && !owner.dealerOrgId) {
    return { id: owner.sellerProfileId, kind: "private_seller" } as const;
  }
  throw new Error(INVALID_LISTING_OWNER_CONTEXT_ERROR);
};

const getCalendarMonthPeriod = (now: Date) => ({
  periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
});

const recordActiveListingUsage = async ({
  actorAccountId,
  client,
  delta,
  listingId,
  now,
  owner,
  version,
}: {
  readonly actorAccountId: string;
  readonly client: Prisma.TransactionClient;
  readonly delta: 1 | -1;
  readonly listingId: string;
  readonly now: Date;
  readonly owner: {
    readonly dealerOrgId?: string;
    readonly sellerProfileId?: string;
  };
  readonly version: number;
}) => {
  const period = getCalendarMonthPeriod(now);
  await recordEntitlementUsage(
    {
      actorAccountId,
      delta,
      featureKey: "active_listing",
      idempotencyKey: `listing:${listingId}:active:v${version}:delta:${delta}`,
      ...period,
      sourceEntityId: listingId,
      sourceEntityType: "listing",
      subject: getEntitlementSubject(owner),
    },
    client
  );
};

const resolveOwner = async (
  tx: Prisma.TransactionClient,
  actor: ListingActorInput,
  allowedDealerRoles?: readonly DealerRole[]
) => {
  const { ensureDealerActor, ensureSellerProfile } = await import("./accounts");
  const hasOrganizationId = Boolean(actor.clerkOrgId);
  const hasOrganizationRole = Boolean(actor.orgRole);

  if (hasOrganizationId !== hasOrganizationRole) {
    throw new Error(INVALID_LISTING_ACTOR_CONTEXT_ERROR);
  }

  if (actor.clerkOrgId && actor.orgRole) {
    const context = await ensureDealerActor(
      {
        allowedRoles: allowedDealerRoles,
        clerkOrgId: actor.clerkOrgId,
        clerkUserId: actor.clerkUserId,
        orgRole: actor.orgRole,
      },
      tx
    );

    if (!context.dealerOrg.city) {
      throw new Error(
        "Dealer organization profile must include a city before creating listings"
      );
    }

    return {
      account: context.account,
      dealerOrg: context.dealerOrg,
      dealerOrgId: context.dealerOrg.id,
      sellerCity: context.dealerOrg.city,
      sellerDisplayName: context.dealerOrg.displayName,
      sellerId: context.dealerOrg.id,
      sellerProfileId: undefined,
      sellerType: "dealer" as const,
      sellerVerificationStatus: context.dealerOrg.verificationStatus,
    };
  }

  const context = await ensureSellerProfile(
    {
      city: actor.city,
      clerkUserId: actor.clerkUserId,
      displayName: actor.displayName,
    },
    tx
  );

  return {
    account: context.account,
    dealerOrg: undefined,
    dealerOrgId: undefined,
    sellerCity: context.sellerProfile.city,
    sellerDisplayName: context.sellerProfile.displayName,
    sellerId: context.sellerProfile.id,
    sellerProfileId: context.sellerProfile.id,
    sellerType: "private" as const,
    sellerVerificationStatus: context.sellerProfile.verificationStatus,
  };
};

export const createListingDraft = async (
  input: ListingInput,
  actor: ListingActorInput
) =>
  database.$transaction(async (tx) => {
    const owner = await resolveOwner(tx, actor, DEALER_LISTING_WRITER_ROLES);
    const listing = await tx.marketplaceListing.create({
      data: {
        ...toListingData(input),
        createdByAccountId: owner.account.id,
        dealerOrgId: owner.dealerOrgId,
        sellerCity: owner.sellerCity,
        sellerDisplayName: owner.sellerDisplayName,
        sellerId: owner.sellerId,
        sellerProfileId: owner.sellerProfileId,
        sellerType: owner.sellerType,
        sellerVerificationStatus: owner.sellerVerificationStatus,
        slug: createSlug(input),
        statusEvents: {
          create: {
            actorAccountId: owner.account.id,
            actorDealerOrgId: owner.dealerOrgId,
            reasonCode: "created",
            toStatus: "draft",
          },
        },
        priceSnapshots: {
          create: {
            actorAccountId: owner.account.id,
            amountMinor: input.priceAmount * PRICE_MINOR_SCALE,
            currency: input.priceCurrency,
            monthlyAmountMinor:
              input.monthlyAmount === undefined
                ? undefined
                : input.monthlyAmount * PRICE_MINOR_SCALE,
            monthlyCurrency:
              input.monthlyAmount === undefined
                ? undefined
                : input.priceCurrency,
            priceType: input.priceType,
            source: "create",
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        action: "listing.created",
        actorAccountId: owner.account.id,
        actorType: "account",
        dealerOrgId: owner.dealerOrgId,
        entityId: listing.id,
        entityType: "listing",
      },
    });

    return listing;
  });

export const getOwnedListing = async (id: string, actor: ListingActorInput) =>
  database.$transaction(async (tx) => {
    const owner = await resolveOwner(tx, actor);
    return tx.marketplaceListing.findFirst({
      include: {
        images: {
          orderBy: { position: "asc" },
          where: { deletedAt: null, uploadStatus: "uploaded" },
        },
      },
      where: { id, ...getOwnershipWhere(owner) },
    });
  });

export const listOwnedListings = async (
  actor: ListingActorInput,
  options: { readonly cursor?: string; readonly limit?: number } = {}
) =>
  database.$transaction(async (tx) => {
    const owner = await resolveOwner(tx, actor);
    return tx.marketplaceListing.findMany({
      ...(options.cursor
        ? { cursor: { id: options.cursor }, skip: 1 }
        : undefined),
      include: {
        _count: { select: { leads: true } },
        images: {
          orderBy: { position: "asc" },
          take: 1,
          where: { deletedAt: null, uploadStatus: "uploaded" },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: Math.min(Math.max(options.limit ?? 50, 1), 100),
      where: getOwnershipWhere(owner),
    });
  });

export const updateOwnedListing = async (
  id: string,
  input: ListingInput,
  actor: ListingActorInput
) =>
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ownership, optimistic locking, snapshots and audit are one transaction.
  database.$transaction(async (tx) => {
    const now = new Date();
    const owner = await resolveOwner(tx, actor, DEALER_LISTING_WRITER_ROLES);
    const current = await tx.marketplaceListing.findFirst({
      where: { id, ...getOwnershipWhere(owner) },
    });

    if (!current) {
      throw new Error("Listing not found");
    }

    assertOwnedListingIsManuallyEditable(current);

    if (["sold", "expired", "archived"].includes(current.status)) {
      throw new Error("Listing can no longer be edited");
    }

    const nextStatus =
      current.status === "active" ? "pending_review" : current.status;
    const updateResult = await tx.marketplaceListing.updateMany({
      data: {
        ...toListingData(input),
        status: nextStatus,
        statusChangedAt:
          nextStatus === current.status ? current.statusChangedAt : now,
        submittedAt:
          nextStatus === "pending_review" ? now : current.submittedAt,
        version: { increment: 1 },
      },
      where: { id, version: current.version },
    });

    if (updateResult.count !== 1) {
      throw new Error("Listing changed in another session");
    }

    const priceChanged =
      current.priceAmountMinor !== input.priceAmount * PRICE_MINOR_SCALE ||
      current.priceCurrency !== input.priceCurrency ||
      current.priceType !== input.priceType ||
      current.monthlyAmountMinor !==
        (input.monthlyAmount === undefined
          ? null
          : input.monthlyAmount * PRICE_MINOR_SCALE);

    if (priceChanged) {
      await tx.listingPriceSnapshot.create({
        data: {
          actorAccountId: owner.account.id,
          amountMinor: input.priceAmount * PRICE_MINOR_SCALE,
          currency: input.priceCurrency,
          listingId: id,
          monthlyAmountMinor:
            input.monthlyAmount === undefined
              ? undefined
              : input.monthlyAmount * PRICE_MINOR_SCALE,
          monthlyCurrency:
            input.monthlyAmount === undefined ? undefined : input.priceCurrency,
          priceType: input.priceType,
          source: "edit",
        },
      });
    }

    if (nextStatus !== current.status) {
      await tx.listingStatusEvent.create({
        data: {
          actorAccountId: owner.account.id,
          actorDealerOrgId: owner.dealerOrgId,
          fromStatus: current.status,
          listingId: id,
          reasonCode: "material_edit",
          toStatus: nextStatus,
        },
      });
      if (current.status === "active") {
        await recordActiveListingUsage({
          actorAccountId: owner.account.id,
          client: tx,
          delta: -1,
          listingId: id,
          now,
          owner,
          version: current.version + 1,
        });
      }
    }

    await tx.auditLog.create({
      data: {
        action: "listing.updated",
        actorAccountId: owner.account.id,
        actorType: "account",
        dealerOrgId: owner.dealerOrgId,
        entityId: id,
        entityType: "listing",
      },
    });

    return tx.marketplaceListing.findUniqueOrThrow({ where: { id } });
  });

const getLifecycleTimestamps = (status: ListingStatus) => {
  const now = new Date();

  return {
    ...(status === "pending_review" ? { submittedAt: now } : {}),
    ...(status === "active" ? { pausedAt: null, publishedAt: now } : {}),
    ...(status === "paused" ? { pausedAt: now } : {}),
    ...(status === "sold" ? { soldAt: now } : {}),
    ...(status === "expired" ? { expiredAt: now } : {}),
    ...(status === "rejected" ? { rejectedAt: now } : {}),
    ...(status === "archived" ? { archivedAt: now } : {}),
  };
};

export const transitionOwnedListing = async (
  id: string,
  toStatus: DomainListingStatus,
  actor: ListingActorInput,
  reasonCode = "owner_action"
) =>
  database.$transaction(
    async (tx) => {
      const now = new Date();
      const owner = await resolveOwner(tx, actor, DEALER_LISTING_WRITER_ROLES);
      const current = await tx.marketplaceListing.findFirst({
        where: { id, ...getOwnershipWhere(owner) },
      });

      if (!current) {
        throw new Error("Listing not found");
      }

      assertOwnerModerationTransitionAllowed(current.status, toStatus);

      assertOwnedListingTransitionAllowed(current, toStatus);

      if (!canTransitionListingStatus(current.status, toStatus)) {
        throw new Error(
          `Invalid listing transition: ${current.status} -> ${toStatus}`
        );
      }

      if (toStatus === "active" && current.status !== "active") {
        await assertActiveListingQuota({
          client: tx,
          now,
          subject: getEntitlementSubject(owner),
        });
      }

      const result = await tx.marketplaceListing.updateMany({
        data: {
          ...getLifecycleTimestamps(toStatus as ListingStatus),
          status: toStatus as ListingStatus,
          statusChangedAt: now,
          version: { increment: 1 },
        },
        where: { id, version: current.version },
      });

      if (result.count !== 1) {
        throw new Error("Listing changed in another session");
      }

      await tx.listingStatusEvent.create({
        data: {
          actorAccountId: owner.account.id,
          actorDealerOrgId: owner.dealerOrgId,
          fromStatus: current.status,
          listingId: id,
          reasonCode,
          toStatus: toStatus as ListingStatus,
        },
      });
      if (current.status !== "active" && toStatus === "active") {
        await recordActiveListingUsage({
          actorAccountId: owner.account.id,
          client: tx,
          delta: 1,
          listingId: id,
          now,
          owner,
          version: current.version + 1,
        });
      } else if (current.status === "active" && toStatus !== "active") {
        await recordActiveListingUsage({
          actorAccountId: owner.account.id,
          client: tx,
          delta: -1,
          listingId: id,
          now,
          owner,
          version: current.version + 1,
        });
      }
      await tx.auditLog.create({
        data: {
          action: `listing.${toStatus}`,
          actorAccountId: owner.account.id,
          actorType: "account",
          dealerOrgId: owner.dealerOrgId,
          entityId: id,
          entityType: "listing",
        },
      });

      return tx.marketplaceListing.findUniqueOrThrow({ where: { id } });
    },
    { isolationLevel: "Serializable" }
  );

export const listingToMajorPrice = (listing: MarketplaceListing) => ({
  amount: Math.round(listing.priceAmountMinor / PRICE_MINOR_SCALE),
  currency: listing.priceCurrency,
});
