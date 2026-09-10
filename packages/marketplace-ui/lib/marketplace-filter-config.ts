import {
  type BodyType,
  type FuelType,
  leadSite,
  type MarketplaceSearchParams,
  type Transmission,
  type VehicleCategory,
  vehicleCategories,
} from "@repo/marketplace";

export const marketplaceCategorySelectorOptions = vehicleCategories.filter(
  (category) => category.id !== "lease"
);

export const marketplaceBodyTypesByCategory = {
  car: [
    "suv",
    "hatchback",
    "sedan",
    "wagon",
    "coupe",
    "convertible",
    "pickup",
    "other",
  ],
  lease: [
    "suv",
    "hatchback",
    "sedan",
    "wagon",
    "coupe",
    "convertible",
    "pickup",
    "other",
  ],
  motorbike: ["motorcycle", "scooter", "other"],
  truck: ["truck", "pickup", "other"],
  van: ["van", "minibus", "other"],
} as const satisfies Record<VehicleCategory, readonly BodyType[]>;

export const marketplaceCityOptions = [
  "Sofia",
  "Plovdiv",
  "Varna",
  "Burgas",
  "Ruse",
  "Stara Zagora",
] as const;

export const marketplacePriceRange = [0, 200_000] as const;
export const marketplaceYearRange = [1990, 2026] as const;
export const marketplaceMileageRange = [0, 250_000] as const;

export const marketplacePricePresets = [40_000, 60_000, 100_000, 150_000] as const;
export const marketplaceYearPresets = [2018, 2020, 2022, 2024] as const;
export const marketplaceMileagePresets = [50_000, 100_000, 150_000, 200_000] as const;

export const marketplaceBodyFilterOptions: readonly {
  labelBg: string;
  labelEn: string;
  value: NonNullable<MarketplaceSearchParams["body"]>;
}[] = [
  { value: "suv", labelEn: "SUV", labelBg: "SUV" },
  { value: "hatchback", labelEn: "Hatchback", labelBg: "Хечбек" },
  { value: "sedan", labelEn: "Sedan", labelBg: "Седан" },
  { value: "wagon", labelEn: "Wagon", labelBg: "Комби" },
  { value: "coupe", labelEn: "Coupe", labelBg: "Купе" },
  { value: "convertible", labelEn: "Convertible", labelBg: "Кабрио" },
  { value: "pickup", labelEn: "Pickup", labelBg: "Пикап" },
  { value: "van", labelEn: "Van", labelBg: "Ван" },
];

export const marketplaceFuelOptions: readonly FuelType[] = [
  "diesel",
  "gasoline",
  "hybrid",
  "plug_in_hybrid",
  "electric",
  "lpg",
];

export const marketplaceTransmissionOptions: readonly Transmission[] = [
  "automatic",
  "manual",
  "semi_automatic",
];

export const marketplaceFuelLabelsBg: Record<FuelType, string> = {
  gasoline: "Бензин",
  diesel: "Дизел",
  hybrid: "Хибрид",
  plug_in_hybrid: "Plug-in хибрид",
  electric: "Електрически",
  lpg: "Газ",
  cng: "Метан",
  other: "Друго",
};

export const marketplaceTransmissionLabelsBg: Record<Transmission, string> = {
  automatic: "Автоматик",
  manual: "Ръчни",
  semi_automatic: "Полуавтоматик",
};

export const marketplaceSortLabelsBg: Record<MarketplaceSearchParams["sort"], string> = {
  recommended: "Препоръчани",
  newest: "Най-нови",
  price_asc: "Цена нагоре",
  price_desc: "Цена надолу",
  mileage_asc: "Най-нисък пробег",
  year_desc: "Най-нова година",
};

export const marketplaceCurrency = leadSite.staticDemoMode ? leadSite.currency : "BGN";

export const marketplaceSearchCurrency: MarketplaceSearchParams["currency"] =
  leadSite.currency === "BGN" || leadSite.currency === "EUR"
    ? leadSite.currency
    : undefined;

export const getMarketplaceCurrencyLabel = (isBg: boolean) => {
  if (isBg && marketplaceCurrency === "BGN") {
    return "лв.";
  }

  return marketplaceCurrency;
};

export const localizeMarketplace = (isBg: boolean, bg: string, en: string) =>
  isBg ? bg : en;
