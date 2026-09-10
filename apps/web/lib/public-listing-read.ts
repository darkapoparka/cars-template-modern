import { cache } from "react";
import { getPublicMarketplaceListing } from "./public-marketplace-data";

export const getRequestCachedPublicMarketplaceListing = cache(
  (slug: string, destinationCountryCode?: string) =>
    getPublicMarketplaceListing(slug, {
      allowUnavailableDestination: true,
      destinationCountryCode,
    })
);
