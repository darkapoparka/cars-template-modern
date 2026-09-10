import { leadSite } from "./lead-site";
import type {
  BodyType,
  FuelType,
  ListingBadge,
  Money,
  PriceType,
  SellerType,
  Transmission,
} from "./types";

const fuelTypeLabels: Record<FuelType, string> = {
  cng: "CNG",
  diesel: "Diesel",
  electric: "Electric",
  gasoline: "Gasoline",
  hybrid: "Hybrid",
  lpg: "LPG",
  other: "Other",
  plug_in_hybrid: "Plug-in hybrid",
};

const transmissionLabels: Record<Transmission, string> = {
  automatic: "Automatic",
  manual: "Manual",
  semi_automatic: "Semi-auto",
};

const bodyTypeLabels: Record<BodyType, string> = {
  convertible: "Convertible",
  coupe: "Coupe",
  hatchback: "Hatchback",
  minibus: "Minibus",
  motorcycle: "Motorcycle",
  other: "Other",
  pickup: "Pickup",
  scooter: "Scooter",
  sedan: "Sedan",
  suv: "SUV",
  truck: "Truck",
  van: "Van",
  wagon: "Wagon",
};

const sellerTypeLabels: Record<SellerType, string> = {
  dealer: "Dealer",
  private: "Private seller",
};

const priceTypeLabels: Record<PriceType, string> = {
  finance_estimate: "Finance estimate",
  fixed: "Fixed price",
  lease_monthly: "Monthly lease",
  negotiable: "Negotiable",
};

const listingBadgeLabels: Record<ListingBadge, string> = {
  certified: "Certified",
  lease: "Lease",
  new: "New",
  promoted: "Promoted",
  used: "Used",
  verified: "Verified",
};

const fuelTypeLabelsBg: Record<FuelType, string> = {
  cng: "CNG",
  diesel: "Дизел",
  electric: "Електрически",
  gasoline: "Бензин",
  hybrid: "Хибрид",
  lpg: "LPG",
  other: "Друго",
  plug_in_hybrid: "Плъгин хибрид",
};

const transmissionLabelsBg: Record<Transmission, string> = {
  automatic: "Автоматична",
  manual: "Ръчна",
  semi_automatic: "Полуавтоматична",
};

const bodyTypeLabelsBg: Record<BodyType, string> = {
  convertible: "Кабриолет",
  coupe: "Купе",
  hatchback: "Хечбек",
  minibus: "Микробус",
  motorcycle: "Мотоциклет",
  other: "Друго",
  pickup: "Пикап",
  scooter: "Скутер",
  sedan: "Седан",
  suv: "SUV",
  truck: "Камион",
  van: "Бус",
  wagon: "Комби",
};

const sellerTypeLabelsBg: Record<SellerType, string> = {
  dealer: "Дилър",
  private: "Частен продавач",
};

const priceTypeLabelsBg: Record<PriceType, string> = {
  finance_estimate: "Примерна месечна вноска",
  fixed: "Фиксирана цена",
  lease_monthly: "Месечен лизинг",
  negotiable: "По договаряне",
};

const listingBadgeLabelsBg: Record<ListingBadge, string> = {
  certified: "Сертифициран",
  lease: "Лизинг",
  new: "Нов",
  promoted: "Промотирана",
  used: "Употребяван",
  verified: "Проверен",
};

const isBulgarianLocale = (locale?: string) =>
  locale?.toLowerCase().startsWith("bg") ?? false;

const normalizeFormattingLocale = (locale?: string) => {
  if (leadSite.staticDemoMode) {
    return leadSite.locale;
  }

  return locale?.toLowerCase().startsWith("bg") ? "bg-BG" : "en-BG";
};

export const formatMoney = (money: Money, locale?: string) =>
  new Intl.NumberFormat(normalizeFormattingLocale(locale), {
    currency: money.currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(money.amount);

export const formatMileage = (value: number, locale?: string) =>
  `${new Intl.NumberFormat(normalizeFormattingLocale(locale)).format(value)} ${
    isBulgarianLocale(locale) ? "км" : "km"
  }`;

export const formatFuelType = (fuelType: FuelType, locale?: string) =>
  isBulgarianLocale(locale)
    ? fuelTypeLabelsBg[fuelType]
    : fuelTypeLabels[fuelType];

export const formatTransmission = (
  transmission: Transmission,
  locale?: string
) =>
  isBulgarianLocale(locale)
    ? transmissionLabelsBg[transmission]
    : transmissionLabels[transmission];

export const formatBodyType = (bodyType: BodyType, locale?: string) =>
  isBulgarianLocale(locale)
    ? bodyTypeLabelsBg[bodyType]
    : bodyTypeLabels[bodyType];

export const formatSellerType = (sellerType: SellerType, locale?: string) =>
  isBulgarianLocale(locale)
    ? sellerTypeLabelsBg[sellerType]
    : sellerTypeLabels[sellerType];

export const formatPriceType = (priceType: PriceType, locale?: string) =>
  isBulgarianLocale(locale)
    ? priceTypeLabelsBg[priceType]
    : priceTypeLabels[priceType];

export const formatListingBadge = (badge: ListingBadge, locale?: string) =>
  isBulgarianLocale(locale)
    ? listingBadgeLabelsBg[badge]
    : listingBadgeLabels[badge];
