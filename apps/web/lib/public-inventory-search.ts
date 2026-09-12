import "server-only";

import { toInventorySearchListing } from "@repo/marketplace/inventory-search";
import { mockListings } from "@repo/marketplace/mock-data";
import type { VehicleCategory, VehicleListing } from "@repo/marketplace/types";
import { getCurrentPublicDataMode } from "./public-data-policy";

/** The data layer, never the UI, chooses between demo and live inventory. */
export const getPublicInventorySearchListings = (
  category: VehicleCategory,
  pageListings: readonly VehicleListing[]
) => {
  // Demo search keeps the category's inventory when results are filtered.
  // Live mode uses only supplied public results; never fill gaps with fixtures.
  const source =
    getCurrentPublicDataMode() === "demo"
      ? mockListings.filter((listing) => listing.category === category)
      : pageListings;
  return source.map(toInventorySearchListing);
};
