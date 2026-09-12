import type { VehicleListing } from "./types";

/** Only the public fields needed by search suggestions, not a listing record. */
export type InventorySearchListing = Pick<
  VehicleListing,
  "id" | "slug" | "title" | "category" | "price" | "monthlyEstimate"
> & {
  images: Pick<VehicleListing["images"][number], "url" | "alt">[];
  spec: Pick<
    VehicleListing["spec"],
    "make" | "model" | "trim" | "year" | "mileageValue" | "fuelType"
  >;
};

export const toInventorySearchListing = (
  listing: VehicleListing
): InventorySearchListing => ({
  id: listing.id,
  slug: listing.slug,
  title: listing.title,
  category: listing.category,
  price: listing.price,
  monthlyEstimate: listing.monthlyEstimate,
  images: listing.images.slice(0, 1).map(({ url, alt }) => ({ url, alt })),
  spec: {
    make: listing.spec.make,
    model: listing.spec.model,
    trim: listing.spec.trim,
    year: listing.spec.year,
    mileageValue: listing.spec.mileageValue,
    fuelType: listing.spec.fuelType,
  },
});
