import type { VehicleCategory } from "@repo/marketplace";

const discoveryTitles = {
  car: { bg: "Открий автомобил", en: "Find your next car" },
  lease: { bg: "Открий автомобил", en: "Find your next car" },
  motorbike: { bg: "Открий мотоциклет", en: "Find a motorcycle" },
  truck: { bg: "Открий камион", en: "Find a truck" },
  van: { bg: "Открий бус", en: "Find a van" },
} as const;

export const getMobileDiscoveryTitle = (
  category: VehicleCategory,
  isBg: boolean
) => discoveryTitles[category][isBg ? "bg" : "en"];
