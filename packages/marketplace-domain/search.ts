import { z } from "zod";
import {
  bodyTypeSchema,
  countryCodeSchema,
  defaultVehicleCategory,
  fuelTypeSchema,
  priceCurrencySchema,
  sellerTypeSchema,
  sortSchema,
  transmissionSchema,
  vehicleCategorySchema,
} from "./taxonomy";

const firstValue = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

const emptyToUndefined = (value: unknown) => {
  const normalized = firstValue(value);
  if (typeof normalized !== "string") {
    return normalized;
  }
  const trimmed = normalized.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const marketplaceSearchSchema = z
  .object({
    category: z
      .preprocess(emptyToUndefined, vehicleCategorySchema)
      .catch(defaultVehicleCategory),
    q: z.preprocess(emptyToUndefined, z.string().optional()).catch(undefined),
    make: z
      .preprocess(emptyToUndefined, z.string().optional())
      .catch(undefined),
    model: z
      .preprocess(emptyToUndefined, z.string().optional())
      .catch(undefined),
    derivative: z
      .preprocess(emptyToUndefined, z.string().optional())
      .catch(undefined),
    trim: z
      .preprocess(emptyToUndefined, z.string().optional())
      .catch(undefined),
    location: z
      .preprocess(emptyToUndefined, z.string().optional())
      .catch(undefined),
    origin: z
      .preprocess(emptyToUndefined, countryCodeSchema.optional())
      .catch(undefined),
    deliverTo: z
      .preprocess(emptyToUndefined, countryCodeSchema.optional())
      .catch(undefined),
    radius: z
      .preprocess(
        emptyToUndefined,
        z.coerce.number().int().min(1).max(500).optional()
      )
      .catch(undefined),
    priceMin: z
      .preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional())
      .catch(undefined),
    priceMax: z
      .preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional())
      .catch(undefined),
    currency: z
      .preprocess(emptyToUndefined, priceCurrencySchema.optional())
      .catch(undefined),
    yearMin: z
      .preprocess(
        emptyToUndefined,
        z.coerce.number().int().min(1900).optional()
      )
      .catch(undefined),
    yearMax: z
      .preprocess(
        emptyToUndefined,
        z.coerce.number().int().min(1900).optional()
      )
      .catch(undefined),
    mileageMax: z
      .preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional())
      .catch(undefined),
    fuel: z
      .preprocess(emptyToUndefined, fuelTypeSchema.optional())
      .catch(undefined),
    transmission: z
      .preprocess(emptyToUndefined, transmissionSchema.optional())
      .catch(undefined),
    body: z
      .preprocess(emptyToUndefined, bodyTypeSchema.optional())
      .catch(undefined),
    seller: z
      .preprocess(emptyToUndefined, sellerTypeSchema.optional())
      .catch(undefined),
    sort: z.preprocess(emptyToUndefined, sortSchema).catch("recommended"),
    page: z
      .preprocess(emptyToUndefined, z.coerce.number().int().min(1))
      .catch(1),
  })
  .transform((filters) => {
    const hasInvertedPriceRange =
      filters.priceMin !== undefined &&
      filters.priceMax !== undefined &&
      filters.priceMin > filters.priceMax;
    const priceMin = hasInvertedPriceRange
      ? filters.priceMax
      : filters.priceMin;
    const priceMax = hasInvertedPriceRange
      ? filters.priceMin
      : filters.priceMax;

    return {
      ...filters,
      priceMax,
      priceMin,
      currency:
        filters.currency ??
        (priceMin !== undefined ||
        priceMax !== undefined ||
        filters.sort === "price_asc" ||
        filters.sort === "price_desc"
          ? "BGN"
          : undefined),
    };
  });

export type MarketplaceSearchParams = z.infer<typeof marketplaceSearchSchema>;
