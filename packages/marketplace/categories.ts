import type { VehicleCategory } from "@repo/marketplace-domain";

export {
  defaultVehicleCategory,
  vehicleCategoryIds,
} from "@repo/marketplace-domain";

export interface VehicleCategoryOption {
  description: string;
  id: VehicleCategory;
  label: string;
  path: string;
  shortLabel: string;
}

export const vehicleCategories = [
  {
    id: "car",
    label: "Cars",
    shortLabel: "Cars",
    path: "/cars",
    description: "Passenger cars, SUVs, wagons, coupes, and hatchbacks",
  },
  {
    id: "truck",
    label: "Trucks",
    shortLabel: "Trucks",
    path: "/trucks",
    description: "Commercial trucks, pickups, and heavy duty vehicles",
  },
  {
    id: "motorbike",
    label: "Motorbikes",
    shortLabel: "Bikes",
    path: "/motorbikes",
    description: "Motorcycles, scooters, and touring bikes",
  },
  {
    id: "van",
    label: "Vans",
    shortLabel: "Vans",
    path: "/vans",
    description: "Cargo vans, passenger vans, and minibuses",
  },
  {
    id: "lease",
    label: "Lease",
    shortLabel: "Lease",
    path: "/lease",
    description: "Lease-ready vehicles and monthly offers",
  },
] as const satisfies readonly VehicleCategoryOption[];

export const getVehicleCategory = (category: VehicleCategory) =>
  vehicleCategories.find((item) => item.id === category) ??
  vehicleCategories[0];

export const getVehicleCategoryLabel = (category: VehicleCategory) =>
  getVehicleCategory(category).label;
