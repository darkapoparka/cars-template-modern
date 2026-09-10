import {
  formatFuelType,
  formatTransmission,
  leadSite,
  type MarketplaceSearchParams,
  type QuickFilterKey,
} from "@repo/marketplace";
import {
  getLocalizedMarketplaceCityName,
  getLocalizedMarketplaceCountryName,
  getMarketplaceControlCopy,
  isBulgarianMarketplaceLocale,
} from "./marketplace-control-copy";
import { marketplaceCurrency } from "./marketplace-filter-config";
import { getCanonicalPublicPath, getLocalizedPublicPath } from "./public-path";

const trailingSlashPattern = /\/$/;
const filterNumberFormatters = {
  bg: new Intl.NumberFormat("bg-BG"),
  en: new Intl.NumberFormat("en-US"),
} as const;

export const cleanMarketplaceBaseUrl = (baseUrl?: string) =>
  baseUrl?.replace(trailingSlashPattern, "") ?? "";

export const formatMarketplaceRangeLabel = (
  minimum?: number,
  maximum?: number,
  suffix = "",
  locale?: string
) => {
  const isBg = isBulgarianMarketplaceLocale(locale);
  const formatter = filterNumberFormatters[isBg ? "bg" : "en"];
  const formatValue = (value: number) => formatter.format(value);

  if (minimum !== undefined && maximum !== undefined) {
    return `${formatValue(minimum)}${suffix}–${formatValue(maximum)}${suffix}`;
  }
  if (minimum !== undefined) {
    return `${isBg ? "От" : "From"} ${formatValue(minimum)}${suffix}`;
  }
  if (maximum !== undefined) {
    return `${isBg ? "До" : "To"} ${formatValue(maximum)}${suffix}`;
  }

  return undefined;
};

const getCountryChipLabel = (
  countryCode: string | undefined,
  prefix: string,
  fallback: string,
  locale?: string
) =>
  countryCode
    ? `${prefix} ${getLocalizedMarketplaceCountryName(countryCode, locale)}`
    : fallback;

const getMakeModelChipLabel = (
  filters: MarketplaceSearchParams,
  fallback: string
) => {
  if (filters.make && filters.model) {
    return [filters.make, filters.model, filters.derivative]
      .filter(Boolean)
      .join(" ");
  }

  return filters.make ?? fallback;
};

export const getMarketplaceQuickFilterLabel = (
  chip: QuickFilterKey,
  filters: MarketplaceSearchParams,
  locale?: string
) => {
  const copy = getMarketplaceControlCopy(locale);

  switch (chip) {
    case "make-model":
      return getMakeModelChipLabel(filters, copy.chips["make-model"]);
    case "deliver-to":
      return getCountryChipLabel(
        filters.deliverTo,
        copy.chips["deliver-to"],
        copy.chips["deliver-to"],
        locale
      );
    case "origin":
      return getCountryChipLabel(
        filters.origin,
        isBulgarianMarketplaceLocale(locale) ? "От" : "From",
        copy.chips.origin,
        locale
      );
    case "location":
      return filters.location
        ? getLocalizedMarketplaceCityName(filters.location, locale)
        : copy.chips.location;
    case "price":
      return (
        formatMarketplaceRangeLabel(
          filters.priceMin,
          filters.priceMax,
          isBulgarianMarketplaceLocale(locale) && marketplaceCurrency === "BGN"
            ? " лв."
            : ` ${marketplaceCurrency}`,
          locale
        ) ?? copy.chips.price
      );
    case "year":
      return (
        formatMarketplaceRangeLabel(
          filters.yearMin,
          filters.yearMax,
          "",
          locale
        ) ?? copy.chips.year
      );
    case "mileage":
      return (
        formatMarketplaceRangeLabel(
          undefined,
          filters.mileageMax,
          isBulgarianMarketplaceLocale(locale) ? " км" : " km",
          locale
        ) ?? copy.chips.mileage
      );
    case "fuel":
      return filters.fuel
        ? formatFuelType(filters.fuel, locale)
        : copy.chips.fuel;
    case "transmission":
      return filters.transmission
        ? formatTransmission(filters.transmission, locale)
        : copy.chips.transmission;
    case "sort":
      return copy.sort[filters.sort];
    default:
      return chip;
  }
};

export const isMarketplaceQuickFilterActive = (
  chip: QuickFilterKey,
  filters: MarketplaceSearchParams
) => {
  switch (chip) {
    case "make-model":
      return Boolean(
        filters.make || filters.model || filters.derivative || filters.trim
      );
    case "deliver-to":
      return Boolean(filters.deliverTo);
    case "origin":
      return Boolean(filters.origin);
    case "location":
      return Boolean(filters.location);
    case "price":
      return filters.priceMin !== undefined || filters.priceMax !== undefined;
    case "year":
      return filters.yearMin !== undefined || filters.yearMax !== undefined;
    case "mileage":
      return filters.mileageMax !== undefined;
    case "fuel":
      return Boolean(filters.fuel);
    case "transmission":
      return Boolean(filters.transmission);
    case "sort":
      return filters.sort !== "recommended";
    default:
      return false;
  }
};

export const getMarketplaceMobileDiscoverySummary = (
  filters: MarketplaceSearchParams,
  locale: string | undefined,
  categoryLabel: string
) => {
  const isBg = isBulgarianMarketplaceLocale(locale);
  let compactCategoryLabel = categoryLabel;
  if (filters.category === "car") {
    compactCategoryLabel = isBg ? "Коли" : "Cars";
  }

  let makeLabel = [filters.make, filters.model].filter(Boolean).join(" ");
  if (!makeLabel) {
    makeLabel = isBg ? "Всички марки" : "All makes";
  }

  const summaryParts = [makeLabel];
  if (filters.category !== "car") {
    summaryParts.unshift(compactCategoryLabel);
  }

  return summaryParts.join(" · ");
};

export const getMarketplaceCurrentPath = ({
  basePath,
  locale,
  pathname,
}: {
  basePath?: string;
  locale?: string;
  pathname: string;
}) =>
  getCanonicalPublicPath(
    locale,
    basePath ??
      (leadSite.staticDemoMode
        ? getLocalizedPublicPath(locale, "/cars")
        : pathname)
  );
