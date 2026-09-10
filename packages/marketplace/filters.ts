import {
  buildVehicleTaxonomyOptions,
  curatedVehicleTaxonomy,
} from "@repo/marketplace-domain";

export type { MarketplaceSearchParams } from "@repo/marketplace-domain";
export {
  bodyTypeSchema,
  bodyTypes,
  countryCodeSchema,
  fuelTypeSchema,
  fuelTypes,
  marketplaceSearchSchema,
  priceCurrencies,
  priceCurrencySchema,
  sellerTypeSchema,
  sellerTypes,
  sortOptions,
  sortSchema,
  transmissionSchema,
  transmissionTypes,
  vehicleCategorySchema,
} from "@repo/marketplace-domain";

export const quickFilterKeys = [
  "make-model",
  "deliver-to",
  "origin",
  "location",
  "price",
  "year",
  "mileage",
  "fuel",
  "transmission",
  "sort",
] as const;

export type QuickFilterKey = (typeof quickFilterKeys)[number];

export const filterLabels = {
  fuel: {
    gasoline: "Gasoline",
    diesel: "Diesel",
    hybrid: "Hybrid",
    plug_in_hybrid: "Plug-in hybrid",
    electric: "Electric",
    lpg: "LPG",
    cng: "CNG",
    other: "Other",
  },
  transmission: {
    automatic: "Automatic",
    manual: "Manual",
    semi_automatic: "Semi-auto",
  },
  sort: {
    recommended: "Recommended",
    newest: "Newest",
    price_asc: "Price low",
    price_desc: "Price high",
    mileage_asc: "Lowest km",
    year_desc: "Newest year",
  },
} as const;

export const fallbackVehicleTaxonomy = buildVehicleTaxonomyOptions(
  curatedVehicleTaxonomy,
  "car"
);

export const vehicleModelsByMake: Readonly<Record<string, readonly string[]>> =
  Object.fromEntries(
    fallbackVehicleTaxonomy.map((make) => [
      make.name,
      make.models.map((model) => model.name),
    ])
  );

export const vehicleMakes = fallbackVehicleTaxonomy.map((make) => make.name);
