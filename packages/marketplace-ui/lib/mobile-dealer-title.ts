import type { VehicleCategory } from "@repo/marketplace";

const discoveryTitles = {
  car: { bg: "Открийте автомобил", en: "Find your next car" },
  lease: { bg: "Открийте автомобил", en: "Find your next car" },
  motorbike: { bg: "Открийте мотоциклет", en: "Find a motorcycle" },
  truck: { bg: "Открийте камион", en: "Find a truck" },
  van: { bg: "Открийте бус", en: "Find a van" },
} as const;

export const getMobileDiscoveryTitle = (
  category: VehicleCategory,
  isBg: boolean
) => discoveryTitles[category][isBg ? "bg" : "en"];
