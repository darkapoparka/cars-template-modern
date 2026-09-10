import {
  formatBodyType,
  formatFuelType,
  formatSellerType,
  formatTransmission,
  type MarketplaceSearchParams,
} from "@repo/marketplace";
import {
  getLocalizedMarketplaceCityName,
  getLocalizedMarketplaceCountryName,
  isBulgarianMarketplaceLocale,
  type MarketplaceFilterView,
} from "./marketplace-control-copy";

type FullFilterView = Exclude<MarketplaceFilterView, "main">;
type SummaryFormatter = (
  filters: MarketplaceSearchParams,
  locale?: string
) => string | undefined;

const formatRange = (
  minimum: number | undefined,
  maximum: number | undefined,
  locale: string | undefined,
  suffix = ""
) => {
  const isBg = isBulgarianMarketplaceLocale(locale);

  if (minimum !== undefined && maximum !== undefined) {
    return `${minimum}${suffix}–${maximum}${suffix}`;
  }

  if (minimum !== undefined) {
    return `${isBg ? "От" : "From"} ${minimum}${suffix}`;
  }

  if (maximum !== undefined) {
    return `${isBg ? "До" : "To"} ${maximum}${suffix}`;
  }

  return undefined;
};

const filterSummaryFormatters: Record<FullFilterView, SummaryFormatter> = {
  body: (filters, locale) =>
    filters.body ? formatBodyType(filters.body, locale) : undefined,
  "deliver-to": (filters, locale) =>
    filters.deliverTo
      ? getLocalizedMarketplaceCountryName(filters.deliverTo, locale)
      : undefined,
  fuel: (filters, locale) =>
    filters.fuel ? formatFuelType(filters.fuel, locale) : undefined,
  location: (filters, locale) =>
    filters.location
      ? getLocalizedMarketplaceCityName(filters.location, locale)
      : undefined,
  mileage: (filters, locale) => {
    if (filters.mileageMax === undefined) {
      return undefined;
    }

    const isBg = isBulgarianMarketplaceLocale(locale);
    const value = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US").format(
      filters.mileageMax
    );
    return `${isBg ? "До" : "To"} ${value} km`;
  },
  origin: (filters, locale) =>
    filters.origin
      ? getLocalizedMarketplaceCountryName(filters.origin, locale)
      : undefined,
  price: (filters, locale) =>
    formatRange(
      filters.priceMin,
      filters.priceMax,
      locale,
      isBulgarianMarketplaceLocale(locale) ? " лв." : " BGN"
    ),
  seller: (filters, locale) =>
    filters.seller ? formatSellerType(filters.seller, locale) : undefined,
  transmission: (filters, locale) =>
    filters.transmission
      ? formatTransmission(filters.transmission, locale)
      : undefined,
  year: (filters, locale) =>
    formatRange(filters.yearMin, filters.yearMax, locale),
};

export const getMarketplaceFilterSummary = (
  view: FullFilterView,
  filters: MarketplaceSearchParams,
  locale?: string
) => filterSummaryFormatters[view](filters, locale);
