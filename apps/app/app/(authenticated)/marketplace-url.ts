import {
  buildMarketplaceSearchHref,
  type MarketplaceSearchParams,
} from "@repo/marketplace";

const localWebUrl = "http://localhost:3001";
const publicMarketplacePath = "/bg";
const trailingSlashPattern = /\/$/u;

export const getPublicWebBaseUrl = () => {
  if (process.env.NODE_ENV === "development") {
    return localWebUrl;
  }

  return process.env.NEXT_PUBLIC_WEB_URL ?? localWebUrl;
};

export const getPublicMarketplaceSearchHref = (
  filters: Partial<MarketplaceSearchParams> = {}
) =>
  `${getPublicWebBaseUrl().replace(
    trailingSlashPattern,
    ""
  )}${buildMarketplaceSearchHref(filters, publicMarketplacePath)}`;
