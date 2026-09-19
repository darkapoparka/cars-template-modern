import "server-only";
import { requiredSupplierCapabilities } from "@repo/marketplace-domain";
import type { Prisma } from "./generated/client";

export const authorityPublicationInclude = {
  inventoryRightsGrant: true,
  market: true,
  marketPermission: true,
  supplierOffer: {
    include: {
      inventorySource: true,
      supplierOrg: {
        include: {
          capabilities: true,
          supplierTrust: {
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  },
} satisfies Prisma.MarketPublicationInclude;

export type AuthorityPublication = Prisma.MarketPublicationGetPayload<{
  include: typeof authorityPublicationInclude;
}>;

const isAuthorizationCurrent = (
  status: string | null | undefined,
  expiresAt: Date | null | undefined,
  now: Date
) => status === "active" && (!expiresAt || expiresAt > now);

const hasCurrentRequiredCapabilities = (
  publication: AuthorityPublication,
  now: Date
) =>
  requiredSupplierCapabilities.every((capabilityKey) => {
    const capability = publication.supplierOffer.supplierOrg.capabilities.find(
      (item) => item.capabilityKey === capabilityKey
    );

    return isAuthorizationCurrent(
      capability?.status,
      capability?.expiresAt,
      now
    );
  });

const hasCurrentSupplierTrust = (
  publication: AuthorityPublication,
  now: Date
) => {
  const trust = publication.supplierOffer.supplierOrg.supplierTrust[0];
  return (
    trust?.status === "verified" && (!trust.expiresAt || trust.expiresAt > now)
  );
};

export const isPublicationAuthorityCurrent = (
  publication: AuthorityPublication,
  now: Date
) => {
  const { inventorySource, supplierOrg } = publication.supplierOffer;
  if (
    supplierOrg.deletedAt ||
    supplierOrg.onboardingStatus !== "approved" ||
    supplierOrg.kybStatus !== "verified" ||
    (supplierOrg.kybExpiresAt && supplierOrg.kybExpiresAt <= now)
  ) {
    return false;
  }
  if (
    inventorySource.deletedAt ||
    !(
      inventorySource.status === "active" ||
      inventorySource.status === "degraded"
    ) ||
    inventorySource.mediaRightsStatus !== "active"
  ) {
    return false;
  }
  if (
    publication.supplierOffer.status !== "available" ||
    publication.supplierOffer.freshUntil <= now ||
    publication.market.status !== "active"
  ) {
    return false;
  }
  if (
    !publication.marketPermission ||
    publication.marketPermission.validFrom > now ||
    !isAuthorizationCurrent(
      publication.marketPermission.status,
      publication.marketPermission.validUntil,
      now
    )
  ) {
    return false;
  }
  if (
    !publication.inventoryRightsGrant ||
    publication.inventoryRightsGrant.inventorySourceId !==
      publication.supplierOffer.inventorySourceId ||
    (publication.inventoryRightsGrant.marketId &&
      publication.inventoryRightsGrant.marketId !== publication.marketId) ||
    publication.inventoryRightsGrant.validFrom > now ||
    !isAuthorizationCurrent(
      publication.inventoryRightsGrant.status,
      publication.inventoryRightsGrant.validUntil,
      now
    )
  ) {
    return false;
  }

  return (
    hasCurrentRequiredCapabilities(publication, now) &&
    hasCurrentSupplierTrust(publication, now)
  );
};

export const findCurrentPublicMarketplacePublicationForInquiry = async (
  tx: Prisma.TransactionClient,
  input: {
    destinationCountryCode: string;
    now?: Date;
    supplierOfferId: string;
  }
) => {
  const now = input.now ?? new Date();
  const publications = await tx.marketPublication.findMany({
    include: authorityPublicationInclude,
    orderBy: { id: "asc" },
    where: {
      channel: "public_marketplace",
      eligibilityDecision: "eligible",
      freshUntil: { gt: now },
      market: {
        is: {
          countryCode: input.destinationCountryCode,
          status: "active",
        },
      },
      OR: [
        { eligibilityExpiresAt: null },
        { eligibilityExpiresAt: { gt: now } },
      ],
      status: "published",
      supplierOfferId: input.supplierOfferId,
    },
  });

  return (
    publications.find((publication) =>
      isPublicationAuthorityCurrent(publication, now)
    ) ?? null
  );
};
