import {
  createMarketplaceSearchParams,
  type MarketplaceSearchParams,
  type VehicleListing,
} from "@repo/marketplace";

const trailingSlashPattern = /\/$/;

/**
 * Sends a public-marketplace visitor to the authenticated search result where
 * the existing durable save mutation is available. The app proxy preserves
 * this destination through sign-in.
 */
export const getAccountListingSaveFlowHref = (
  appBaseUrl: string | undefined,
  listing: Pick<VehicleListing, "category" | "title">
) => {
  const normalizedBaseUrl = appBaseUrl
    ?.trim()
    .replace(trailingSlashPattern, "");

  if (!normalizedBaseUrl) {
    return undefined;
  }

  const params = createMarketplaceSearchParams({
    category: listing.category,
    q: listing.title,
  });

  return `${normalizedBaseUrl}/search?${params.toString()}`;
};

export const getAccountSavedSearchFlowHref = (
  appBaseUrl: string | undefined,
  filters: MarketplaceSearchParams
) => {
  const normalizedBaseUrl = appBaseUrl
    ?.trim()
    .replace(trailingSlashPattern, "");

  if (!normalizedBaseUrl) {
    return undefined;
  }

  const params = createMarketplaceSearchParams(filters);
  const query = params.toString();

  return query
    ? `${normalizedBaseUrl}/search?${query}`
    : `${normalizedBaseUrl}/search`;
};
