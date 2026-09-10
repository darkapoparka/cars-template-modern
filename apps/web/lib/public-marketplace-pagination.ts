import {
  buildMarketplaceSearchHref,
  type MarketplaceSearchParams,
} from "@repo/marketplace";

interface MarketplacePageRedirectInput {
  basePath: string;
  filters: MarketplaceSearchParams;
  pageSize: number;
  totalListings: number;
}

export const getMarketplacePageRedirect = ({
  basePath,
  filters,
  pageSize,
  totalListings,
}: MarketplacePageRedirectInput): string | null => {
  const totalPages = Math.max(1, Math.ceil(totalListings / pageSize));

  return filters.page > totalPages
    ? buildMarketplaceSearchHref({ ...filters, page: totalPages }, basePath)
    : null;
};
