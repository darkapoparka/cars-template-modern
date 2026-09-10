import type { VehicleCategory } from "@repo/marketplace";

export const isBuyMarketplaceCategory = (category: VehicleCategory) =>
  category !== "lease";
