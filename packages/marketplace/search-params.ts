import { defaultVehicleCategory } from "./categories";
import {
  type MarketplaceSearchParams,
  marketplaceSearchSchema,
} from "./filters";
import type { VehicleCategory } from "./types";

type SearchParamInput =
  | URLSearchParams
  | Record<string, string | string[] | number | undefined>;

const fromUrlSearchParams = (searchParams: URLSearchParams) => {
  const record: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams.entries()) {
    const previous = record[key];

    if (Array.isArray(previous)) {
      record[key] = [...previous, value];
    } else if (typeof previous === "string") {
      record[key] = [previous, value];
    } else {
      record[key] = value;
    }
  }

  return record;
};

export const parseMarketplaceSearchParams = (
  input: SearchParamInput = {}
): MarketplaceSearchParams =>
  marketplaceSearchSchema.parse(
    input instanceof URLSearchParams ? fromUrlSearchParams(input) : input
  );

export const createMarketplaceSearchParams = (
  filters: Partial<MarketplaceSearchParams>,
  options: { includeDefaults?: boolean } = {}
) => {
  const normalized = parseMarketplaceSearchParams(filters);
  const params = new URLSearchParams();

  const append = (key: keyof MarketplaceSearchParams, value: unknown) => {
    if (value === undefined || value === "" || value === null) {
      return;
    }

    params.set(String(key), String(value));
  };

  if (
    options.includeDefaults ||
    normalized.category !== defaultVehicleCategory
  ) {
    append("category", normalized.category);
  }

  append("q", normalized.q);
  append("make", normalized.make);
  append("model", normalized.model);
  append("derivative", normalized.derivative);
  append("trim", normalized.trim);
  append("location", normalized.location);
  append("origin", normalized.origin);
  append("deliverTo", normalized.deliverTo);
  append("radius", normalized.radius);
  append("priceMin", normalized.priceMin);
  append("priceMax", normalized.priceMax);
  append("currency", normalized.currency);
  append("yearMin", normalized.yearMin);
  append("yearMax", normalized.yearMax);
  append("mileageMax", normalized.mileageMax);
  append("fuel", normalized.fuel);
  append("transmission", normalized.transmission);
  append("body", normalized.body);
  append("seller", normalized.seller);

  if (normalized.sort !== "recommended") {
    append("sort", normalized.sort);
  }

  if (normalized.page > 1) {
    append("page", normalized.page);
  }

  return params;
};

export const withSearchParamUpdates = (
  current: MarketplaceSearchParams,
  updates: Partial<MarketplaceSearchParams>
) => {
  const nextFilters: Partial<MarketplaceSearchParams> = {
    ...current,
    ...updates,
    page: updates.page ?? 1,
  };
  const updatesMinimum = Object.hasOwn(updates, "priceMin");
  const updatesMaximum = Object.hasOwn(updates, "priceMax");

  if (
    updatesMaximum &&
    !updatesMinimum &&
    nextFilters.priceMin !== undefined &&
    nextFilters.priceMax !== undefined &&
    nextFilters.priceMin > nextFilters.priceMax
  ) {
    nextFilters.priceMin = undefined;
  }

  if (
    updatesMinimum &&
    !updatesMaximum &&
    nextFilters.priceMin !== undefined &&
    nextFilters.priceMax !== undefined &&
    nextFilters.priceMin > nextFilters.priceMax
  ) {
    nextFilters.priceMax = undefined;
  }

  return parseMarketplaceSearchParams(nextFilters);
};

export const withCategory = (
  current: MarketplaceSearchParams,
  category: VehicleCategory
) =>
  withSearchParamUpdates(current, {
    category,
    make: undefined,
    model: undefined,
    derivative: undefined,
    trim: undefined,
  });
