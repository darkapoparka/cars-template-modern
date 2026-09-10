import type {
  DeliveryEligibilityStatus,
  Money,
  VehicleListing,
  VehicleLocation,
} from "@repo/marketplace";

const countryNames: Record<string, string> = {
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  NL: "Netherlands",
  RO: "Romania",
};

const countryNamesBg: Record<string, string> = {
  AT: "Австрия",
  BE: "Белгия",
  BG: "България",
  DE: "Германия",
  FR: "Франция",
  IT: "Италия",
  NL: "Нидерландия",
  RO: "Румъния",
};

const locationLabelsBg: Record<string, string> = {
  Austria: "Австрия",
  Belgium: "Белгия",
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

const isBulgarianLocale = (locale?: string) =>
  locale?.trim().toLowerCase().startsWith("bg") ?? false;

const sourceKindLabels: Record<
  NonNullable<VehicleListing["supply"]>["provenance"]["sourceKind"],
  string
> = {
  api: "API inventory feed",
  csv: "CSV inventory feed",
  dms: "Dealer management system",
  https_feed: "HTTPS inventory feed",
  json: "JSON inventory feed",
  legacy: "Seller-provided listing",
  manual: "Manually supplied listing",
  sftp: "SFTP inventory feed",
  webhook: "Webhook inventory feed",
};

const sourceKindLabelsBg: typeof sourceKindLabels = {
  api: "API фийд за наличности",
  csv: "CSV фийд за наличности",
  dms: "Система за управление на дилърство",
  https_feed: "HTTPS фийд за наличности",
  json: "JSON фийд за наличности",
  legacy: "Обява, предоставена от продавача",
  manual: "Ръчно предоставена обява",
  sftp: "SFTP фийд за наличности",
  webhook: "Webhook фийд за наличности",
};

export const publicCountryOptions = [
  { code: "BG", label: countryNames.BG },
  { code: "DE", label: countryNames.DE },
  { code: "NL", label: countryNames.NL },
  { code: "IT", label: countryNames.IT },
  { code: "FR", label: countryNames.FR },
  { code: "BE", label: countryNames.BE },
  { code: "AT", label: countryNames.AT },
  { code: "RO", label: countryNames.RO },
] as const;

export const getCountryName = (
  countryCode?: string,
  locale?: string
): string | undefined => {
  if (!countryCode) {
    return undefined;
  }

  const normalizedCode = countryCode.toUpperCase();
  const names = isBulgarianLocale(locale) ? countryNamesBg : countryNames;

  return names[normalizedCode] ?? normalizedCode;
};

export const formatTruthDateTime = (
  value?: string,
  locale?: string
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat(isBulgarianLocale(locale) ? "bg-BG" : "en", {
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
};

export const formatVehicleLocation = (
  location: VehicleLocation,
  locale?: string
): string =>
  Array.from(
    new Set(
      [location.city, location.region, location.country]
        .filter((value): value is string => Boolean(value))
        .map((value) =>
          isBulgarianLocale(locale) ? (locationLabelsBg[value] ?? value) : value
        )
    )
  ).join(", ");

export const getPhysicalVehicleLocation = (
  listing: VehicleListing
): VehicleLocation => listing.supply?.origin ?? listing.location;

export const getPrimaryListingPrice = (listing: VehicleListing): Money =>
  listing.supply?.nativePrice ?? listing.price;

export const getApproximateConvertedPrice = (
  listing: VehicleListing
): Money | undefined => {
  const supply = listing.supply;

  return supply?.priceConversion.status === "converted_estimate"
    ? supply.convertedPrice
    : undefined;
};

export const isVerifiedImporter = (listing: VehicleListing): boolean => {
  const supplier = listing.supply?.supplier;

  return Boolean(
    supplier?.orgType === "importer" &&
      supplier.kybStatus === "verified" &&
      supplier.trustStatus === "verified"
  );
};

export type ListingSellerRole =
  | NonNullable<NonNullable<VehicleListing["supply"]>["supplier"]["orgType"]>
  | VehicleListing["seller"]["type"];

export type ListingOrganizationRole = Exclude<ListingSellerRole, "private">;

export type ListingSellerTrustKind =
  | "verified_business"
  | "verified_importer"
  | "verified_private_seller";

export const getListingSellerRole = (
  listing: VehicleListing,
  organizationRole?: ListingOrganizationRole
): ListingSellerRole =>
  listing.supply?.supplier.orgType ?? organizationRole ?? listing.seller.type;

export const getListingSellerRoleLabel = (
  role: ListingSellerRole,
  locale?: string
): string => {
  const labels = isBulgarianLocale(locale)
    ? {
        dealer: "Дилър",
        distributor: "Дистрибутор",
        importer: "Вносител",
        manufacturer: "Производител",
        private: "Частно лице",
      }
    : {
        dealer: "Dealer",
        distributor: "Distributor",
        importer: "Importer",
        manufacturer: "Manufacturer",
        private: "Private individual",
      };

  return labels[role];
};

export const getListingSellerTrustKind = (
  listing: VehicleListing,
  organizationRole?: ListingOrganizationRole
): ListingSellerTrustKind | undefined => {
  if (isVerifiedImporter(listing)) {
    return "verified_importer";
  }

  if (listing.seller.verificationStatus !== "verified") {
    return undefined;
  }

  return getListingSellerRole(listing, organizationRole) === "private"
    ? "verified_private_seller"
    : "verified_business";
};

export const getListingSellerTrustLabel = (
  kind: ListingSellerTrustKind,
  locale?: string
): string => {
  const labels = isBulgarianLocale(locale)
    ? {
        verified_business: "Проверена фирма",
        verified_importer: "Проверен вносител",
        verified_private_seller: "Проверен частен продавач",
      }
    : {
        verified_business: "Verified business",
        verified_importer: "Verified importer",
        verified_private_seller: "Verified private seller",
      };

  return labels[kind];
};

export interface DeliveryTruth {
  readonly actionLabel: string;
  readonly destinationCode?: string;
  readonly destinationLabel?: string;
  readonly detail: string;
  readonly label: string;
  readonly status: DeliveryEligibilityStatus;
  readonly unavailable: boolean;
}

const getDeliverySubject = (destinationLabel?: string, locale?: string) => {
  if (isBulgarianLocale(locale)) {
    return destinationLabel ? `Доставка до ${destinationLabel}` : "Доставка";
  }

  return destinationLabel ? `Delivery to ${destinationLabel}` : "Delivery";
};

interface DeliveryStatusCopy {
  readonly actionLabel: string;
  readonly detail: string;
  readonly statusLabel: string;
}

const getUnavailableDeliveryAction = (
  destinationLabel: string | undefined,
  isBg: boolean
) => {
  if (destinationLabel) {
    return isBg
      ? `Няма доставка до ${destinationLabel}`
      : `Unavailable to ${destinationLabel}`;
  }

  return isBg ? "Доставката не е възможна" : "Delivery unavailable";
};

const getDeliveryStatusCopy = (
  destinationLabel: string | undefined,
  locale?: string
): Record<DeliveryEligibilityStatus, DeliveryStatusCopy> => {
  const isBg = isBulgarianLocale(locale);

  if (isBg) {
    return {
      eligible: {
        actionLabel: "Попитай за доставка",
        detail:
          "Доставката е възможна, но срокът и разходите до дестинацията трябва да бъдат потвърдени.",
        statusLabel: "възможна",
      },
      quote_required: {
        actionLabel: "Поискай оферта за доставка",
        detail:
          "Необходима е оферта от доставчика, преди да са известни крайните условия за доставка.",
        statusLabel: "изисква оферта",
      },
      unavailable: {
        actionLabel: getUnavailableDeliveryAction(destinationLabel, true),
        detail:
          "В момента този автомобил не може да бъде доставен до избраната дестинация.",
        statusLabel: "не е възможна",
      },
      unknown: {
        actionLabel: "Провери възможността за доставка",
        detail: "Възможността за доставка на този автомобил не е потвърдена.",
        statusLabel: "не е потвърдена",
      },
    };
  }

  return {
    eligible: {
      actionLabel: "Ask about delivery",
      detail:
        "Delivery is eligible, but timing and destination charges still require confirmation.",
      statusLabel: "eligible",
    },
    quote_required: {
      actionLabel: "Request delivery quote",
      detail:
        "A supplier quote is required before final delivery terms are known.",
      statusLabel: "quote required",
    },
    unavailable: {
      actionLabel: getUnavailableDeliveryAction(destinationLabel, false),
      detail: "This destination is not currently available for this vehicle.",
      statusLabel: "unavailable",
    },
    unknown: {
      actionLabel: "Check delivery availability",
      detail: "Delivery eligibility has not been confirmed for this vehicle.",
      statusLabel: "not confirmed",
    },
  };
};

export const getDeliveryTruth = (
  listing: VehicleListing,
  locale?: string
): DeliveryTruth | undefined => {
  const delivery = listing.supply?.delivery ?? listing.delivery;
  if (!delivery) {
    return undefined;
  }

  const destinationCode = delivery.destinationCountryCode;
  const destinationLabel = getCountryName(destinationCode, locale);
  const destinationIsEligible =
    !destinationCode || delivery.eligibleCountryCodes.includes(destinationCode);
  const status = destinationIsEligible ? delivery.status : "unavailable";
  const subject = getDeliverySubject(destinationLabel, locale);
  const copy = getDeliveryStatusCopy(destinationLabel, locale)[status];

  return {
    actionLabel: copy.actionLabel,
    destinationCode,
    destinationLabel,
    detail: copy.detail,
    label: `${subject}: ${copy.statusLabel}`,
    status,
    unavailable: status === "unavailable",
  };
};

export const getLandedCostTruth = (
  listing: VehicleListing,
  locale?: string
): { detail: string; label: string } | undefined => {
  const status = listing.supply?.landedCostStatus;
  const isBg = isBulgarianLocale(locale);

  if (status === "quote_required") {
    return {
      detail: isBg
        ? "Крайните транспортни разходи и таксите до дестинацията не са изчислени. Поискайте оферта от доставчика."
        : "Final transport and destination charges are not calculated. Request a supplier quote.",
      label: isBg
        ? "Крайна цена с доставка: изисква оферта"
        : "Landed cost: quote required",
    };
  }

  if (status === "not_calculated") {
    return {
      detail: isBg
        ? "Няма приложено изчисление на крайните транспортни разходи и таксите до дестинацията."
        : "No final transport or destination-cost calculation is attached.",
      label: isBg
        ? "Крайна цена с доставка: не е изчислена"
        : "Landed cost: not calculated",
    };
  }

  if (status === "unavailable") {
    return {
      detail: isBg
        ? "За този автомобил няма налична оценка на крайната цена с доставка."
        : "A landed-cost estimate is not available for this vehicle.",
      label: isBg
        ? "Крайна цена с доставка: няма данни"
        : "Landed cost: unavailable",
    };
  }

  return undefined;
};

export const getSourceLabel = (
  listing: VehicleListing,
  locale?: string
): string => {
  const provenance = listing.supply?.provenance;

  if (!provenance) {
    return isBulgarianLocale(locale)
      ? "Обява, предоставена от продавача"
      : "Seller-provided listing";
  }

  return (
    provenance.sourceDisplayName ??
    (isBulgarianLocale(locale) ? sourceKindLabelsBg : sourceKindLabels)[
      provenance.sourceKind
    ]
  );
};

export const getFreshnessLabel = (
  listing: VehicleListing,
  locale?: string
): string => {
  const freshness = listing.supply?.provenance.freshnessStatus;
  const isBg = isBulgarianLocale(locale);

  if (freshness === "fresh") {
    return isBg ? "Актуален запис за наличност" : "Fresh inventory record";
  }

  if (freshness === "stale") {
    return isBg ? "Остарял запис за наличност" : "Stale inventory record";
  }

  return isBg ? "Актуалността не е потвърдена" : "Freshness not confirmed";
};

export interface ListingContactAction {
  readonly disabled: boolean;
  readonly label: string;
}

const getUnavailableListingContactLabel = (
  listing: VehicleListing,
  isBg: boolean
) => {
  if (listing.status === "sold") {
    return isBg ? "Автомобилът е продаден" : "Vehicle sold";
  }

  return isBg ? "Обявата не е активна" : "Listing unavailable";
};

export const getListingContactAction = (
  listing: VehicleListing,
  hasContactHref: boolean,
  locale?: string
): ListingContactAction => {
  const deliveryTruth = getDeliveryTruth(listing, locale);
  const isBg = isBulgarianLocale(locale);

  if (listing.status !== "active") {
    return {
      disabled: true,
      label: getUnavailableListingContactLabel(listing, isBg),
    };
  }

  if (deliveryTruth?.unavailable) {
    return { disabled: true, label: deliveryTruth.actionLabel };
  }

  if (deliveryTruth) {
    let label = deliveryTruth.actionLabel;

    if (!hasContactHref) {
      label = isBg
        ? `${deliveryTruth.actionLabel} — недостъпно`
        : `${deliveryTruth.actionLabel} unavailable`;
    }

    return {
      disabled: !hasContactHref,
      label,
    };
  }

  if (hasContactHref) {
    return {
      disabled: false,
      label: isBg ? "Свържи се с продавача" : "Contact seller",
    };
  }

  return {
    disabled: true,
    label: isBg ? "Контактът не е достъпен" : "Contact unavailable",
  };
};
