import {
  formatFuelType,
  formatListingBadge,
  formatMileage,
  formatMoney,
  type ListingViewMode,
  type Money,
  type Transmission,
  type VehicleListing,
} from "@repo/marketplace";
import {
  getApproximateConvertedPrice,
  getPrimaryListingPrice,
} from "./listing-truth";

export type VehicleCardVariant = "comparison" | "compact-list" | "standard";

export type VehicleCardSpecFactId =
  | "fuel"
  | "mileage"
  | "transmission"
  | "year";

export interface VehicleCardSpecFact {
  id: VehicleCardSpecFactId;
  value: string;
}

export interface VehicleCardBadgeCopy {
  featured: string;
  imported: string;
}

export interface VehicleCardPricePolicy {
  approximatePrice?: Money;
  isMonthlyPrice: boolean;
  monthlyEstimate?: Money;
  primaryPrice: Money;
  showConversionTime: boolean;
  showNegotiable: boolean;
}

interface VehicleCardVariantInput {
  density: "compact" | "default";
  desktopLayout: "grid" | "list";
  viewMode: ListingViewMode;
}

const isBulgarianLocale = (locale?: string) =>
  locale?.toLowerCase().startsWith("bg") ?? false;

export const getVehicleCardVariant = ({
  density,
  desktopLayout,
  viewMode,
}: VehicleCardVariantInput): VehicleCardVariant => {
  if (
    viewMode === "grid" ||
    (density === "compact" && desktopLayout === "grid")
  ) {
    return "comparison";
  }

  return density === "compact" ? "compact-list" : "standard";
};

export const getVehicleCardTitle = (
  listing: VehicleListing,
  _variant: VehicleCardVariant
) => {
  const yearPrefix = `${listing.spec.year} `;
  return listing.title.startsWith(yearPrefix)
    ? listing.title.slice(yearPrefix.length)
    : listing.title;
};

const compactTransmissionLabels = {
  automatic: { bg: "Автоматик", en: "Automatic" },
  manual: { bg: "Ръчна", en: "Manual" },
  semi_automatic: { bg: "Полуавтоматик", en: "Semi-auto" },
} as const satisfies Record<Transmission, { bg: string; en: string }>;

export const getVehicleCardSpecFacts = (
  listing: VehicleListing,
  locale?: string
): VehicleCardSpecFact[] => {
  const language = locale?.toLowerCase().startsWith("bg") ? "bg" : "en";

  return (
    [
      { id: "year", value: String(listing.spec.year) },
      {
        id: "mileage",
        value: formatMileage(listing.spec.mileageValue, locale),
      },
      { id: "fuel", value: formatFuelType(listing.spec.fuelType, locale) },
      {
        id: "transmission",
        value: compactTransmissionLabels[listing.spec.transmission][language],
      },
    ] satisfies VehicleCardSpecFact[]
  ).filter((fact) => fact.value);
};

export const getVehicleCardBadgeLabels = (
  listing: VehicleListing,
  locale: string | undefined,
  copy: VehicleCardBadgeCopy
) => {
  const labels: string[] = [];

  if (listing.promoted) {
    labels.push(copy.featured);
  }

  if (listing.supply) {
    labels.push(copy.imported);
  }

  for (const badge of listing.badges) {
    if (badge === "promoted" || badge === "used" || badge === "verified") {
      continue;
    }

    labels.push(formatListingBadge(badge, locale));
  }

  return Array.from(new Set(labels)).slice(0, 2);
};

export const getVehicleCardPricePolicy = (
  listing: VehicleListing,
  variant: VehicleCardVariant
): VehicleCardPricePolicy => {
  const approximatePrice = getApproximateConvertedPrice(listing);
  const isMonthlyPrice =
    listing.priceType === "lease_monthly" ||
    listing.priceType === "finance_estimate";
  const monthlyEstimate =
    approximatePrice || isMonthlyPrice || listing.priceType === "negotiable"
      ? undefined
      : listing.monthlyEstimate;

  return {
    approximatePrice,
    isMonthlyPrice,
    monthlyEstimate,
    primaryPrice: getPrimaryListingPrice(listing),
    showConversionTime: variant !== "comparison",
    showNegotiable: listing.priceType === "negotiable",
  };
};

const formatComparisonCardMoney = (money: Money, locale?: string) => {
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  })
    .format(money.amount)
    .replaceAll(",", "\u00A0");
  let currency = money.currency;

  if (money.currency === "BGN") {
    currency = isBulgarianLocale(locale) ? "лв." : "BGN";
  } else if (money.currency === "EUR") {
    currency = "€";
  }

  return `${amount} ${currency}`;
};

export const formatVehicleCardMoney = (
  money: Money,
  variant: VehicleCardVariant,
  locale?: string
) =>
  variant === "comparison"
    ? formatComparisonCardMoney(money, locale)
    : formatMoney(money, locale);
