import {
  formatBodyType,
  formatFuelType,
  formatSellerType,
  formatTransmission,
  type MarketplaceSearchParams,
} from "@repo/marketplace";
import { getCountryName } from "./listing-truth";
import { getLocalizedMarketplaceCityName } from "./marketplace-control-copy";

export interface ActiveFilterChip {
  id: string;
  label: string;
  updates: Partial<MarketplaceSearchParams>;
}

const resultTitleByCategoryEn: Record<
  MarketplaceSearchParams["category"],
  string
> = {
  car: "Cars for sale",
  lease: "Lease offers",
  motorbike: "Motorbikes for sale",
  truck: "Trucks for sale",
  van: "Vans for sale",
};

const resultTitleByCategoryBg: Record<
  MarketplaceSearchParams["category"],
  string
> = {
  car: "Автомобили за продажба",
  lease: "Лизингови оферти",
  motorbike: "Мотоциклети за продажба",
  truck: "Камиони за продажба",
  van: "Бусове за продажба",
};

const resultCountNounsBg: Record<
  MarketplaceSearchParams["category"],
  readonly [singular: string, plural: string]
> = {
  car: ["автомобил", "автомобила"],
  lease: ["лизингова оферта", "лизингови оферти"],
  motorbike: ["мотоциклет", "мотоциклета"],
  truck: ["камион", "камиона"],
  van: ["бус", "буса"],
};

const isBulgarianLocale = (locale?: string) =>
  locale?.toLowerCase().startsWith("bg") ?? false;

const numberFormatters = {
  bg: new Intl.NumberFormat("bg-BG"),
  en: new Intl.NumberFormat("en-US"),
} as const;

const countryNameFormatters = {
  bg: new Intl.DisplayNames(["bg"], { type: "region" }),
  en: new Intl.DisplayNames(["en"], { type: "region" }),
} as const;

const filterChipCopy = {
  bg: {
    deliveryTo: "Доставка до",
    from: "От",
    kilometres: "км",
    price: "Цена",
    priceSuffix: " лв.",
    search: "Търсене",
    to: "До",
    year: "Година",
  },
  en: {
    deliveryTo: "Deliver to",
    from: "From",
    kilometres: "km",
    price: "Price",
    priceSuffix: " BGN",
    search: "Search",
    to: "To",
    year: "Year",
  },
} as const;

const getFilterChipCopy = (locale?: string) =>
  filterChipCopy[isBulgarianLocale(locale) ? "bg" : "en"];

const getLocalizedCountryName = (countryCode: string, locale?: string) => {
  const language = isBulgarianLocale(locale) ? "bg" : "en";
  return (
    countryNameFormatters[language].of(countryCode.toUpperCase()) ??
    getCountryName(countryCode) ??
    countryCode.toUpperCase()
  );
};

const formatFilterNumber = (value: number, locale?: string) =>
  numberFormatters[isBulgarianLocale(locale) ? "bg" : "en"].format(value);

const formatRange = (
  min?: number,
  max?: number,
  suffix = "",
  locale?: string
) => {
  const isBg = isBulgarianLocale(locale);
  if (min && max) {
    return `${formatFilterNumber(min, locale)}${suffix}–${formatFilterNumber(max, locale)}${suffix}`;
  }
  if (min) {
    return `${isBg ? "От" : "From"} ${formatFilterNumber(min, locale)}${suffix}`;
  }
  if (max) {
    return `${isBg ? "До" : "To"} ${formatFilterNumber(max, locale)}${suffix}`;
  }
  return undefined;
};

const getMakeModelLabel = (
  filters: MarketplaceSearchParams,
  locale?: string
) => {
  if (filters.make && filters.model) {
    return [filters.make, filters.model, filters.derivative]
      .filter(Boolean)
      .join(" ");
  }
  return (
    filters.make ??
    (isBulgarianLocale(locale) ? "Марка и модел" : "Make and model")
  );
};

export const getMarketplaceResultTitle = (
  filters: MarketplaceSearchParams,
  locale?: string
) => {
  const isBg = isBulgarianLocale(locale);
  const title = isBg
    ? resultTitleByCategoryBg[filters.category]
    : resultTitleByCategoryEn[filters.category];
  if (!filters.deliverTo) {
    return title;
  }
  const countryName = getLocalizedCountryName(filters.deliverTo, locale);
  return isBg
    ? `${title} с доставка до ${countryName}`
    : `${title} for delivery to ${countryName}`;
};

export const formatVehicleCount = (
  totalListings: number,
  category: MarketplaceSearchParams["category"],
  locale?: string
) => {
  if (isBulgarianLocale(locale)) {
    const nouns = resultCountNounsBg[category];
    return `${formatFilterNumber(totalListings, locale)} ${
      totalListings === 1 ? nouns[0] : nouns[1]
    }`;
  }

  return `${formatFilterNumber(totalListings, locale)} ${
    totalListings === 1 ? "vehicle" : "vehicles"
  }`;
};

export const getActiveFilterChips = (
  filters: MarketplaceSearchParams,
  locale?: string
): ActiveFilterChip[] => {
  const chips: ActiveFilterChip[] = [];
  const copy = getFilterChipCopy(locale);

  if (filters.q) {
    chips.push({
      id: "q",
      label: `${copy.search}: ${filters.q}`,
      updates: { q: undefined },
    });
  }
  if (filters.make || filters.model || filters.derivative || filters.trim) {
    chips.push({
      id: "make-model",
      label: getMakeModelLabel(filters, locale),
      updates: {
        derivative: undefined,
        make: undefined,
        model: undefined,
        trim: undefined,
      },
    });
  }
  if (filters.location) {
    chips.push({
      id: "location",
      label: getLocalizedMarketplaceCityName(filters.location, locale),
      updates: { location: undefined, radius: undefined },
    });
  }
  if (filters.deliverTo) {
    chips.push({
      id: "deliver-to",
      label: `${copy.deliveryTo} ${getLocalizedCountryName(filters.deliverTo, locale)}`,
      updates: { deliverTo: undefined },
    });
  }
  if (filters.origin) {
    chips.push({
      id: "origin",
      label: `${copy.from} ${getLocalizedCountryName(filters.origin, locale)}`,
      updates: { origin: undefined },
    });
  }
  if (filters.priceMin || filters.priceMax) {
    chips.push({
      id: "price",
      label:
        formatRange(
          filters.priceMin,
          filters.priceMax,
          copy.priceSuffix,
          locale
        ) ?? copy.price,
      updates: {
        currency: undefined,
        priceMax: undefined,
        priceMin: undefined,
      },
    });
  }
  if (filters.yearMin || filters.yearMax) {
    chips.push({
      id: "year",
      label:
        formatRange(filters.yearMin, filters.yearMax, "", locale) ?? copy.year,
      updates: { yearMax: undefined, yearMin: undefined },
    });
  }
  if (filters.mileageMax) {
    chips.push({
      id: "mileage",
      label: `${copy.to} ${formatFilterNumber(
        filters.mileageMax,
        locale
      )} ${copy.kilometres}`,
      updates: { mileageMax: undefined },
    });
  }
  if (filters.body) {
    chips.push({
      id: "body",
      label: formatBodyType(filters.body, locale),
      updates: { body: undefined },
    });
  }
  if (filters.fuel) {
    chips.push({
      id: "fuel",
      label: formatFuelType(filters.fuel, locale),
      updates: { fuel: undefined },
    });
  }
  if (filters.transmission) {
    chips.push({
      id: "transmission",
      label: formatTransmission(filters.transmission, locale),
      updates: { transmission: undefined },
    });
  }
  if (filters.seller) {
    chips.push({
      id: "seller",
      label: formatSellerType(filters.seller, locale),
      updates: { seller: undefined },
    });
  }

  return chips;
};
