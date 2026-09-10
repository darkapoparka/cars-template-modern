import { formatPriceType, type VehicleListing } from "@repo/marketplace";
import {
  formatVehicleLocation,
  getDeliveryTruth,
  getFreshnessLabel,
  getListingSellerRole,
  getListingSellerRoleLabel,
  getPhysicalVehicleLocation,
  getSourceLabel,
  type ListingOrganizationRole,
} from "./listing-truth";
import {
  formatVehicleCardMoney,
  type VehicleCardPricePolicy,
  type VehicleCardVariant,
} from "./vehicle-card-policy";

export const vehicleCardPlaceholder = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
    <rect width="800" height="500" fill="#eef0f3"/>
    <path d="M210 315h380l-36-92a55 55 0 0 0-51-35H332a55 55 0 0 0-48 28l-74 99Z" fill="#c9ced5"/>
    <path d="M282 276h270l-23-52a24 24 0 0 0-22-14H344a24 24 0 0 0-21 12l-41 54Z" fill="#f8f9fa"/>
    <circle cx="294" cy="326" r="44" fill="#68707a"/>
    <circle cx="294" cy="326" r="20" fill="#eef0f3"/>
    <circle cx="520" cy="326" r="44" fill="#68707a"/>
    <circle cx="520" cy="326" r="20" fill="#eef0f3"/>
  </svg>
`)}`;

export const vehicleCardToneClassNames = {
  caution: "text-amber-800",
  neutral: "text-muted-foreground",
  positive: "text-emerald-800",
} as const;

const cardCopy = {
  bg: {
    body: "Купе",
    confirmed: "потвърдено",
    financeFrom: "от",
    fuel: "Гориво",
    gearbox: "Скоростна кутия",
    landedCostNotCalculated: "Крайна цена с доставка: не е изчислена",
    landedCostQuoteRequired: "Крайна цена с доставка: изисква оферта",
    landedCostUnavailable: "Крайна цена с доставка: няма данни",
    landedCostUnknown: "Крайна цена с доставка: не е потвърдена",
    mileage: "Пробег",
    monthSuffix: "/мес.",
    photos: "снимки",
    specs: "Основни характеристики",
    featured: "Препоръчана",
    imported: "Внос",
    rateSnapshot: "курс към",
    vehicleIn: "Автомобил в",
    verifiedImporter: "Проверен вносител",
    verifiedSeller: "Проверен продавач",
    year: "Година",
  },
  en: {
    body: "Body",
    confirmed: "confirmed",
    financeFrom: "from",
    fuel: "Fuel",
    gearbox: "Gearbox",
    landedCostNotCalculated: "Landed cost: not calculated",
    landedCostQuoteRequired: "Landed cost: quote required",
    landedCostUnavailable: "Landed cost: unavailable",
    landedCostUnknown: "Landed cost: not confirmed",
    mileage: "Mileage",
    monthSuffix: "/mo",
    photos: "photos",
    specs: "Key specs",
    featured: "Featured",
    imported: "Import",
    rateSnapshot: "rate snapshot",
    vehicleIn: "Vehicle in",
    verifiedImporter: "Verified importer",
    verifiedSeller: "Verified seller",
    year: "Year",
  },
} as const;

const locationLabelsBg: Record<string, string> = {
  Austria: "Австрия",
  Belgium: "Белгия",
  Berlin: "Берлин",
  Bulgaria: "България",
  Burgas: "Бургас",
  France: "Франция",
  Germany: "Германия",
  Italy: "Италия",
  Netherlands: "Нидерландия",
  Plovdiv: "Пловдив",
  Romania: "Румъния",
  Ruse: "Русе",
  Sofia: "София",
  "Sofia City": "София-град",
  "Stara Zagora": "Стара Загора",
  Varna: "Варна",
};

const genericSellerDisplayNames = new Set([
  "Dealer",
  "Private seller",
  "Verified owner",
]);

export const isBulgarianVehicleCardLocale = (locale?: string) =>
  locale?.toLowerCase().startsWith("bg") ?? false;

export const getVehicleCardCopy = (locale?: string) =>
  cardCopy[isBulgarianVehicleCardLocale(locale) ? "bg" : "en"];

export const getVehicleCardViewListingLabel = (title: string, locale?: string) =>
  isBulgarianVehicleCardLocale(locale) ? `Виж ${title}` : `View ${title}`;

export const getVehicleCardSaveListingLabel = (title: string, locale?: string) =>
  isBulgarianVehicleCardLocale(locale)
    ? `Отвори профила, за да запазиш ${title}`
    : `Open your account to save ${title}`;

export const getLocalizedVehicleCardLocationPart = (
  value: string,
  locale?: string
) =>
  isBulgarianVehicleCardLocale(locale) ? (locationLabelsBg[value] ?? value) : value;

export const formatLocalizedVehicleCardLocation = (
  location: ReturnType<typeof getPhysicalVehicleLocation>,
  locale?: string
) => {
  if (!isBulgarianVehicleCardLocale(locale)) {
    return formatVehicleLocation(location);
  }

  return Array.from(
    new Set(
      [location.city, location.region, location.country]
        .filter((value): value is string => Boolean(value))
        .map((value) => getLocalizedVehicleCardLocationPart(value, locale))
    )
  ).join(", ");
};

export const getLocalizedVehicleCardSellerName = (
  listing: VehicleListing,
  locale?: string,
  sellerOrganizationRole?: ListingOrganizationRole
) => {
  if (genericSellerDisplayNames.has(listing.seller.displayName)) {
    return getListingSellerRoleLabel(
      getListingSellerRole(listing, sellerOrganizationRole),
      locale
    );
  }
  return listing.seller.displayName;
};

export const getLocalizedVehicleCardDeliveryLabel = (
  deliveryTruth: NonNullable<ReturnType<typeof getDeliveryTruth>>,
  locale?: string
) => {
  if (!isBulgarianVehicleCardLocale(locale)) {
    return deliveryTruth.label;
  }

  const destination = deliveryTruth.destinationLabel
    ? getLocalizedVehicleCardLocationPart(deliveryTruth.destinationLabel, locale)
    : undefined;
  const subject = destination ? `Доставка до ${destination}` : "Доставка";
  const statusLabels: Record<typeof deliveryTruth.status, string> = {
    eligible: "възможна",
    quote_required: "изисква оферта",
    unavailable: "не е възможна",
    unknown: "не е потвърдена",
  };
  return `${subject}: ${statusLabels[deliveryTruth.status]}`;
};

export const getLocalizedVehicleCardLandedCostLabel = (
  listing: VehicleListing,
  fallbackLabel: string,
  locale?: string
) => {
  if (!isBulgarianVehicleCardLocale(locale)) {
    return fallbackLabel;
  }

  const copy = getVehicleCardCopy(locale);
  const labels = {
    not_calculated: copy.landedCostNotCalculated,
    quote_required: copy.landedCostQuoteRequired,
    unavailable: copy.landedCostUnavailable,
    unknown: copy.landedCostUnknown,
  } as const;
  return listing.supply?.landedCostStatus
    ? labels[listing.supply.landedCostStatus]
    : fallbackLabel;
};

export const getCompactVehicleCardLandedCostLabel = (
  listing: VehicleListing,
  fallbackLabel: string,
  locale?: string
) => {
  const labels = isBulgarianVehicleCardLocale(locale)
    ? {
        not_calculated: "Доставката не е изчислена",
        quote_required: "Оферта за доставка",
        unavailable: "Няма цена за доставка",
        unknown: "Непотвърдена доставка",
      }
    : {
        not_calculated: "Delivery not calculated",
        quote_required: "Delivery quote",
        unavailable: "No delivery price",
        unknown: "Delivery unconfirmed",
      };
  return listing.supply?.landedCostStatus
    ? labels[listing.supply.landedCostStatus]
    : fallbackLabel;
};

export const getLocalizedVehicleCardSourceLabel = (
  listing: VehicleListing,
  locale?: string
) => getSourceLabel(listing, locale);

export const getLocalizedVehicleCardFreshnessLabel = (
  listing: VehicleListing,
  locale?: string
) => {
  if (!isBulgarianVehicleCardLocale(locale)) {
    return getFreshnessLabel(listing);
  }

  const freshness = listing.supply?.provenance.freshnessStatus;
  if (freshness === "fresh") {
    return "Актуална наличност";
  }
  if (freshness === "stale") {
    return "Наличността може да е остаряла";
  }
  return "Актуалността не е потвърдена";
};

export const getVehicleCardMediaClassName = (
  isCompact: boolean,
  isGrid: boolean,
  isDesktopGrid: boolean
) => {
  if (isGrid) {
    if (isDesktopGrid) {
      return "lg:aspect-[16/10]";
    }
    return isCompact ? "lg:aspect-[16/10]" : "lg:aspect-square";
  }
  return isCompact
    ? "lg:aspect-[3/2] lg:min-h-0 lg:self-start"
    : "lg:aspect-[16/10]";
};

export const getVehicleCardSecondaryPriceLabel = (
  listing: VehicleListing,
  locale: string | undefined,
  variant: VehicleCardVariant,
  pricePolicy: VehicleCardPricePolicy
) => {
  const copy = getVehicleCardCopy(locale);

  if (pricePolicy.showNegotiable) {
    return formatPriceType(listing.priceType, locale);
  }
  if (variant === "comparison" && pricePolicy.approximatePrice) {
    return `≈ ${formatVehicleCardMoney(
      pricePolicy.approximatePrice,
      variant,
      locale
    )}`;
  }
  if (pricePolicy.monthlyEstimate) {
    return `${copy.financeFrom} ${formatVehicleCardMoney(
      pricePolicy.monthlyEstimate,
      variant,
      locale
    )}${copy.monthSuffix}`;
  }
  return undefined;
};

export const getVehicleCardImageSizes = (
  isCompact: boolean,
  isGrid: boolean,
  isDesktopGrid: boolean
) => {
  if (isDesktopGrid) {
    return "(max-width: 1023px) 240px, (max-width: 1279px) 33vw, 25vw";
  }
  if (isCompact) {
    return isGrid
      ? "(max-width: 1023px) 240px, (max-width: 1280px) 28vw, 20vw"
      : "(max-width: 1023px) 240px, (max-width: 1280px) 13rem, 15rem";
  }
  return isGrid
    ? "(max-width: 1023px) 240px, 25vw"
    : "(max-width: 1023px) 240px, 50vw";
};
