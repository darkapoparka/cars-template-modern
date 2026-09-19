import type { Prisma } from "./generated/client";

/** Supplied by a trusted server configuration, never by public query parameters. */
export interface PublicInventoryScope {
  readonly dealerOrgId?: string;
}
export const scopePublicInventory = (
  where: Prisma.MarketplaceListingWhereInput,
  scope: PublicInventoryScope = {}
): Prisma.MarketplaceListingWhereInput => {
  if (scope.dealerOrgId === undefined) {
    return where;
  }
  if (!scope.dealerOrgId.trim() || scope.dealerOrgId.length > 128) {
    throw new Error("Invalid dealership binding");
  }
  return {
    AND: [
      where,
      {
        dealerOrgId: scope.dealerOrgId,
        dealerOrg: { deletedAt: null, clerkDeletedAt: null },
      },
    ],
  };
};
