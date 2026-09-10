import {
  filterLabels,
  formatSellerType,
  type MarketplaceSearchParams,
  vehicleCategories,
} from "@repo/marketplace";
import {
  getLocalizedMarketplaceCityName,
  getLocalizedMarketplaceCountryName,
} from "./marketplace-control-copy";
import {
  getMarketplaceCurrencyLabel,
  localizeMarketplace,
  marketplaceBodyFilterOptions,
  marketplaceFuelLabelsBg,
  marketplaceSortLabelsBg,
  marketplaceTransmissionLabelsBg,
} from "./marketplace-filter-config";

export interface DesktopQuickFilterLabels {
  body: string;
  deliverTo: string;
  fuel: string;
  location: string;
  makeModel: string;
  mileage: string;
  origin: string;
  seller: string;
  sort: string;
  transmission: string;
  year: string;
}

export const formatDesktopNumericFilterLabel = ({
  fallback,
  formatValue,
  isBg,
  maximum,
  minimum,
}: {
  fallback: string;
  formatValue: (value: number) => string;
  isBg: boolean;
  maximum?: number;
  minimum?: number;
}) => {
  if (minimum !== undefined && maximum !== undefined) {
    return `${formatValue(minimum)} – ${formatValue(maximum)}`;
  }
  if (minimum !== undefined) {
    return `${localizeMarketplace(isBg, "От", "From")} ${formatValue(minimum)}`;
  }
  if (maximum !== undefined) {
    return `${localizeMarketplace(isBg, "До", "To")} ${formatValue(maximum)}`;
  }
  return fallback;
};

export const getDesktopPriceQuickFilterLabel = (
  filters: MarketplaceSearchParams,
  isBg: boolean,
  numberFormatter: Intl.NumberFormat
) => {
  const fallback = localizeMarketplace(isBg, "Цена", "Price");
  const rangeLabel = formatDesktopNumericFilterLabel({
    fallback,
    formatValue: (value) => numberFormatter.format(value),
    isBg,
    maximum: filters.priceMax,
    minimum: filters.priceMin,
  });

  return rangeLabel === fallback
    ? fallback
    : `${rangeLabel} ${getMarketplaceCurrencyLabel(isBg)}`;
};

const getCountryQuickFilterLabel = (
  countryCode: string | undefined,
  isBg: boolean,
  emptyLabelBg: string,
  emptyLabelEn: string
) => {
  if (!countryCode) {
    return localizeMarketplace(isBg, emptyLabelBg, emptyLabelEn);
  }

  return getLocalizedMarketplaceCountryName(countryCode, isBg ? "bg" : "en");
};

export const getLocalizedDesktopCategoryLabel = (
  category: MarketplaceSearchParams["category"],
  isBg: boolean
) => {
  if (!isBg) {
    return (
      vehicleCategories.find((item) => item.id === category)?.label ?? "Cars"
    );
  }

  return {
    car: "Автомобили",
    truck: "Камиони",
    motorbike: "Мотори",
    van: "Бусове",
    lease: "Лизинг",
  }[category];
};

export const getDesktopQuickFilterLabels = (
  filters: MarketplaceSearchParams,
  isBg: boolean,
  numberFormatter: Intl.NumberFormat
): DesktopQuickFilterLabels => {
  let makeModel = localizeMarketplace(isBg, "Марка и модел", "Make and model");
  if (filters.make) {
    makeModel = [filters.make, filters.model].filter(Boolean).join(" ");
  }

  let body = localizeMarketplace(isBg, "Тип купе", "Body type");
  const selectedBody = marketplaceBodyFilterOptions.find(
    (option) => option.value === filters.body
  );
  if (selectedBody) {
    body = isBg ? selectedBody.labelBg : selectedBody.labelEn;
  }

  const mileage = formatDesktopNumericFilterLabel({
    fallback: localizeMarketplace(isBg, "Пробег", "Mileage"),
    formatValue: (value) =>
      `${numberFormatter.format(value)} ${isBg ? "км" : "km"}`,
    isBg,
    maximum: filters.mileageMax,
  });

  const fuel = filters.fuel
    ? isBg
      ? marketplaceFuelLabelsBg[filters.fuel]
      : filterLabels.fuel[filters.fuel]
    : localizeMarketplace(isBg, "Гориво", "Fuel");
  const transmission = filters.transmission
    ? isBg
      ? marketplaceTransmissionLabelsBg[filters.transmission]
      : filterLabels.transmission[filters.transmission]
    : localizeMarketplace(isBg, "Скорости", "Gearbox");
  const year = formatDesktopNumericFilterLabel({
    fallback: localizeMarketplace(isBg, "Година", "Year"),
    formatValue: (value) => value.toString(),
    isBg,
    maximum: filters.yearMax,
    minimum: filters.yearMin,
  });

  return {
    body,
    deliverTo: getCountryQuickFilterLabel(
      filters.deliverTo,
      isBg,
      "Доставка до",
      "Deliver to"
    ),
    fuel,
    location: filters.location
      ? getLocalizedMarketplaceCityName(filters.location, isBg ? "bg" : "en")
      : localizeMarketplace(isBg, "Местоположение", "Location"),
    makeModel,
    mileage,
    origin: getCountryQuickFilterLabel(
      filters.origin,
      isBg,
      "Произход",
      "Origin"
    ),
    seller: filters.seller
      ? formatSellerType(filters.seller, isBg ? "bg" : "en")
      : localizeMarketplace(isBg, "Продавач", "Seller"),
    sort: isBg
      ? marketplaceSortLabelsBg[filters.sort]
      : filterLabels.sort[filters.sort],
    transmission,
    year,
  };
};
