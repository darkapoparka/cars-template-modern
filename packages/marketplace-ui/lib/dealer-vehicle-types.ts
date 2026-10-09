import type { MarketplaceSearchParams } from "@repo/marketplace";

export const dealerVehicleTypes = [
  { id: "car", artwork: "/images/categories/discovery-pill-car-v4.webp" },
  {
    id: "motorbike",
    artwork: "/images/categories/discovery-pill-motorbike-v2.webp",
  },
  { id: "van", artwork: "/images/categories/discovery-pill-van-v3.webp" },
  { id: "truck", artwork: "/images/categories/discovery-pill-truck-v2.webp" },
] as const;

export function getDealerVehicleTypeArtwork(
  category: MarketplaceSearchParams["category"]
) {
  return (
    dealerVehicleTypes.find(({ id }) => id === category)?.artwork ??
    dealerVehicleTypes[0].artwork
  );
}
