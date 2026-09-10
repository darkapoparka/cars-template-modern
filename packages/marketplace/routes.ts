import { getVehicleCategory } from "./categories";
import type { MarketplaceSearchParams } from "./filters";
import { createMarketplaceSearchParams } from "./search-params";
import type { VehicleCategory } from "./types";

export {
  getListingHref,
  getListingPath,
} from "@repo/marketplace-domain/listing-routes";

const trailingSlashPattern = /\/$/;

const cleanBaseUrl = (baseUrl?: string) =>
  baseUrl?.replace(trailingSlashPattern, "") ?? "";

export const getCategoryPath = (category: VehicleCategory) =>
  getVehicleCategory(category).path;

export const getDealerPath = (dealerSlug: string) => `/dealers/${dealerSlug}`;

export const slugifyMakeModel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const getMakePath = (make: string) => `/cars/${slugifyMakeModel(make)}`;

export const getModelPath = (make: string, model: string) =>
  `${getMakePath(make)}/${slugifyMakeModel(model)}`;

export const deslugMakeModel = (slug: string, candidates: readonly string[]) =>
  candidates.find((candidate) => slugifyMakeModel(candidate) === slug);

export const getCollectionPath = (collectionSlug: string) =>
  `/collections/${collectionSlug}`;

export const buildMarketplaceSearchHref = (
  filters: Partial<MarketplaceSearchParams>,
  basePath = "/"
) => {
  const params = createMarketplaceSearchParams(filters);
  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
};

export const getMarketplaceSearchHref = (
  filters: Partial<MarketplaceSearchParams>,
  baseUrl?: string
) => `${cleanBaseUrl(baseUrl)}${buildMarketplaceSearchHref(filters)}`;
