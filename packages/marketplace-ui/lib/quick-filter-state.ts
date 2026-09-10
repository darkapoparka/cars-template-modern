import type {
  MarketplaceSearchParams,
  QuickFilterKey,
} from "@repo/marketplace";

export const getQuickFilterClearUpdates = (
  filter: QuickFilterKey
): Partial<MarketplaceSearchParams> => {
  switch (filter) {
    case "make-model":
      return {
        derivative: undefined,
        make: undefined,
        model: undefined,
        trim: undefined,
      };
    case "deliver-to":
      return { deliverTo: undefined };
    case "origin":
      return { origin: undefined };
    case "location":
      return { location: undefined, radius: undefined };
    case "price":
      return {
        currency: undefined,
        priceMax: undefined,
        priceMin: undefined,
      };
    case "year":
      return { yearMax: undefined, yearMin: undefined };
    case "mileage":
      return { mileageMax: undefined };
    case "fuel":
      return { fuel: undefined };
    case "transmission":
      return { transmission: undefined };
    case "sort":
      return { sort: "recommended" };
    default:
      return {};
  }
};
