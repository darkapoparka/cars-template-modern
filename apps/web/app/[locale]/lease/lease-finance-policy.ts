import {
  type FuelType,
  getIsoCountryName,
  leadSite,
  type MarketplaceSearchParams,
  type VehicleListing,
} from "@repo/marketplace";

export interface FinancingVehicleOption {
  detailHref: string;
  filterData: Pick<
    VehicleListing,
    "category" | "spec" | "seller" | "location" | "supply" | "delivery"
  >;
  fuelLabel: string;
  fuelType: FuelType;
  id: string;
  imageAlt: string;
  imageUrl: string;
  mileageLabel: string;
  monthlyLabel?: string;
  priceAmount: number;
  priceLabel: string;
  title: string;
  transmissionLabel: string;
  year: number;
  yearLabel: string;
}

export const matchesLeaseVehicleFilters = (
  vehicle: FinancingVehicleOption,
  filters: Partial<MarketplaceSearchParams>
) =>
  (filters.priceMin === undefined || vehicle.priceAmount >= filters.priceMin) &&
  (filters.priceMax === undefined || vehicle.priceAmount <= filters.priceMax) &&
  (filters.yearMin === undefined || vehicle.year >= filters.yearMin) &&
  (filters.yearMax === undefined || vehicle.year <= filters.yearMax) &&
  (!filters.fuel || vehicle.fuelType === filters.fuel) &&
  matchesLeaseVehicleDetails(vehicle.filterData, filters);

const matchesLeaseVehicleDetails = (
  data: FinancingVehicleOption["filterData"],
  filters: Partial<MarketplaceSearchParams>
) => {
  const localCountryCode = [
    leadSite.country,
    getIsoCountryName(leadSite.countryCode),
  ].some(
    (country) => data.location.country.toLowerCase() === country.toLowerCase()
  )
    ? leadSite.countryCode
    : data.location.country;
  const delivery = data.supply?.delivery ?? data.delivery;
  const exactMatches = [
    [filters.category, data.category],
    [filters.make, data.spec.make],
    [filters.model, data.spec.model],
    [filters.derivative, data.spec.derivative],
    [filters.trim, data.spec.trim],
    [filters.body, data.spec.bodyType],
    [filters.transmission, data.spec.transmission],
    [filters.seller, data.seller.type],
    [filters.location, data.location.city],
    [filters.origin, data.supply?.origin.countryCode ?? localCountryCode],
  ];
  return (
    exactMatches.every(
      ([expected, actual]) =>
        !expected || expected.toLowerCase() === actual?.toLowerCase()
    ) &&
    (filters.mileageMax === undefined ||
      data.spec.mileageValue <= filters.mileageMax) &&
    (!filters.deliverTo ||
      (delivery
        ? delivery.eligibleCountryCodes.includes(filters.deliverTo)
        : filters.deliverTo === localCountryCode))
  );
};

export const leaseSelectorCopy = {
  bg: {
    clearSelection: "Премахнете избора",
    depositLabel: "Предпочитана първоначална вноска",
    depositShortLabel: "Вноска",
    depositOptions: [
      { label: "Ще уточним", value: "flexible" },
      { label: "10%", value: "10" },
      { label: "20%", value: "20" },
      { label: "30%", value: "30" },
    ],
    detailAction: "Вижте автомобила",
    durationLabel: "Изберете срок",
    empty: "В момента няма автомобили за избор.",
    estimateLabel: "Ориентировъчна вноска",
    note: "Посочената месечна вноска е ориентировъчна и не представлява обвързваща оферта.",
    phoneAction: "Обадете се за оферта",
    priceLabel: "Цена",
    searchPlaceholder: "Търсете автомобил…",
    searchTitle: "Изберете автомобил",
    selectionLabel: "Вашият избор",
    termLabel: "Предпочитан срок",
    termShortLabel: "Срок",
    termOptions: [
      { label: "Ще уточним", value: "flexible" },
      { label: "24 месеца", value: "24" },
      { label: "36 месеца", value: "36" },
      { label: "48 месеца", value: "48" },
      { label: "60 месеца", value: "60" },
    ],
    vehicleLabel: "Изберете автомобил",
    changeVehicle: "Променете автомобила",
    mobileDepositLabel: "Първоначална вноска",
  },
  en: {
    clearSelection: "Clear selection",
    depositLabel: "Preferred initial payment",
    depositShortLabel: "Initial payment",
    depositOptions: [
      { label: "To be discussed", value: "flexible" },
      { label: "10%", value: "10" },
      { label: "20%", value: "20" },
      { label: "30%", value: "30" },
    ],
    detailAction: "View vehicle",
    durationLabel: "Choose a term",
    empty: "There are currently no vehicles to choose from.",
    estimateLabel: "Indicative payment",
    note: "The monthly payment shown is indicative and is not a binding offer.",
    phoneAction: "Call for an offer",
    priceLabel: "Price",
    searchPlaceholder: "Search vehicles…",
    searchTitle: "Choose a vehicle",
    selectionLabel: "Your selection",
    termLabel: "Preferred term",
    termShortLabel: "Term",
    termOptions: [
      { label: "To be discussed", value: "flexible" },
      { label: "24 months", value: "24" },
      { label: "36 months", value: "36" },
      { label: "48 months", value: "48" },
      { label: "60 months", value: "60" },
    ],
    vehicleLabel: "Choose a vehicle",
    changeVehicle: "Change vehicle",
    mobileDepositLabel: "Initial payment",
  },
} as const;

export const leaseSelectClassName =
  "h-11 w-full rounded-lg border border-transparent bg-secondary px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const getLeaseSelectedVehicle = (
  vehicles: FinancingVehicleOption[],
  vehicleId: string
) => vehicles.find((vehicle) => vehicle.id === vehicleId) ?? vehicles[0];

export const buildLeaseFinancingRequestHref = ({
  contactHref,
  deposit,
  term,
  vehicleTitle,
}: {
  contactHref: string;
  deposit?: string;
  term: string;
  vehicleTitle?: string;
}) => {
  const params = new URLSearchParams({
    intent: "leasing",
    term,
    vehicle: vehicleTitle ?? "",
  });

  if (deposit) {
    params.set("deposit", deposit);
  }
  return `${contactHref}?${params.toString()}`;
};
