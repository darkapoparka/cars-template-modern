import {
  type FuelType,
  formatBodyType,
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
  displayValue?: string;
  id: VehicleCardSpecFactId;
  mobileDisplayValue?: string;
  value: string;
}

type ShowroomVehicleCardSpecFact = Omit<VehicleCardSpecFact, "id"> & {
  id: VehicleCardSpecFactId | "variant" | "body";
};

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
  listing: Pick<VehicleListing, "spec" | "title">,
  _variant: VehicleCardVariant
) => {
  const yearPrefix = `${listing.spec.year} `;
  return listing.title.startsWith(yearPrefix)
    ? listing.title.slice(yearPrefix.length)
    : listing.title;
};

/** Keep the actual brand separate without dropping any model or trim text. */
export const getMobileVehicleCardHeading = (
  listing: Pick<VehicleListing, "spec" | "title">
) => {
  const brand = listing.spec.make.trim();
  const fullTitle = getVehicleCardTitle(listing, "comparison").trim();
  const hasBrandPrefix =
    brand &&
    fullTitle.toLocaleLowerCase().startsWith(`${brand.toLocaleLowerCase()} `);
  return {
    brand,
    fullTitle,
    title: hasBrandPrefix ? fullTitle.slice(brand.length).trim() : fullTitle,
  };
};

/** Split the actual listing title into a scannable model and variant; never invent stock details. */
export const getShowroomVehicleHeading = (
  listing: VehicleListing,
  locale?: string
) => {
  const model = [listing.spec.make.trim(), listing.spec.model.trim()]
    .filter(Boolean)
    .join(" ");
  const original = getVehicleCardTitle(listing, "comparison").trim();
  const sameModel = original.toLocaleLowerCase() === model.toLocaleLowerCase();
  let detail = sameModel ? "" : original;
  for (const prefix of [model, listing.spec.make.trim()]) {
    if (
      !sameModel &&
      prefix &&
      original.toLocaleLowerCase().startsWith(`${prefix.toLocaleLowerCase()} `)
    ) {
      detail = original.slice(prefix.length).trim();
      break;
    }
  }
  const bodyType = formatBodyType(listing.spec.bodyType, locale);
  return {
    detail,
    bodyType,
    title: `${listing.spec.year} ${model || original}`,
    subtitle: [detail, bodyType].filter(Boolean).join(" · "),
  };
};

const compactTransmissionLabels = {
  automatic: { bg: "Автоматик", en: "Automatic" },
  manual: { bg: "Ръчна", en: "Manual" },
  semi_automatic: { bg: "Полуавтоматик", en: "Semi-auto" },
} as const satisfies Record<Transmission, { bg: string; en: string }>;

const compactFuelLabels: Partial<Record<FuelType, { bg: string; en: string }>> =
  {
    electric: { bg: "Електро", en: "Electric" },
    plug_in_hybrid: { bg: "PHEV", en: "PHEV" },
  };

export const getVehicleCardSpecFacts = (
  listing: Pick<VehicleListing, "spec">,
  locale?: string
): VehicleCardSpecFact[] => {
  const language = locale?.toLowerCase().startsWith("bg") ? "bg" : "en";
  const fuelValue = formatFuelType(listing.spec.fuelType, locale);
  const fuelDisplayValue = compactFuelLabels[listing.spec.fuelType]?.[language];

  return (
    [
      { id: "year", value: String(listing.spec.year) },
      {
        id: "mileage",
        value: formatMileage(listing.spec.mileageValue, locale),
      },
      {
        id: "fuel",
        value: fuelValue,
        ...(fuelDisplayValue && fuelDisplayValue !== fuelValue
          ? { displayValue: fuelDisplayValue }
          : {}),
      },
      {
        id: "transmission",
        value: compactTransmissionLabels[listing.spec.transmission][language],
        ...(listing.spec.transmission === "automatic"
          ? { mobileDisplayValue: language === "bg" ? "Автом." : "Auto" }
          : {}),
        ...(listing.spec.transmission === "semi_automatic" && language === "bg"
          ? { displayValue: "Полуавт." }
          : {}),
      },
    ] satisfies VehicleCardSpecFact[]
  ).filter((fact) => fact.value);
};

/** Desktop badges retain the complete variant and body style alongside the shared vehicle facts. */
export const getShowroomVehicleCardSpecFacts = (
  listing: VehicleListing,
  locale?: string
): ShowroomVehicleCardSpecFact[] => {
  const heading = getShowroomVehicleHeading(listing, locale);
  const facts = getVehicleCardSpecFacts(listing, locale);
  return [
    ...facts.filter((fact) => fact.id === "year"),
    ...(
      [
        { id: "variant", value: heading.detail },
        { id: "body", value: heading.bodyType },
      ] satisfies ShowroomVehicleCardSpecFact[]
    ).filter((fact) => fact.value),
    ...facts.filter((fact) => fact.id !== "year"),
  ];
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

/** Presentation changes geometry, never currency or locale formatting. */
export const formatVehicleCardMoney = (
  money: Money,
  _variant: VehicleCardVariant,
  locale?: string
) => formatMoney(money, locale);
