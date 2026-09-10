import type { VehicleListing } from "./types";

const trailingSlashPattern = /\/$/;

const cleanBaseUrl = (baseUrl?: string) =>
  baseUrl?.replace(trailingSlashPattern, "") ?? "";

export const getListingPath = (listing: Pick<VehicleListing, "slug">) =>
  `/listing/${listing.slug}`;

export const getListingHref = (
  listing: Pick<VehicleListing, "slug">,
  baseUrl?: string
) => `${cleanBaseUrl(baseUrl)}${getListingPath(listing)}`;
