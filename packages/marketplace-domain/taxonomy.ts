import { z } from "zod";
import type { VehicleCategory } from "./types";

export const vehicleCategoryIds = [
  "car",
  "truck",
  "motorbike",
  "van",
  "lease",
] as const satisfies readonly VehicleCategory[];

export const defaultVehicleCategory: VehicleCategory = "car";

export const fuelTypes = [
  "gasoline",
  "diesel",
  "hybrid",
  "plug_in_hybrid",
  "electric",
  "lpg",
  "cng",
  "other",
] as const;

export const transmissionTypes = [
  "automatic",
  "manual",
  "semi_automatic",
] as const;

export const bodyTypes = [
  "hatchback",
  "sedan",
  "wagon",
  "suv",
  "coupe",
  "convertible",
  "pickup",
  "van",
  "minibus",
  "motorcycle",
  "scooter",
  "truck",
  "other",
] as const;

export const sellerTypes = ["private", "dealer"] as const;

export const sortOptions = [
  "recommended",
  "newest",
  "price_asc",
  "price_desc",
  "mileage_asc",
  "year_desc",
] as const;

export const priceCurrencies = ["BGN", "EUR"] as const;

export const vehicleCategorySchema = z.enum(vehicleCategoryIds);
export const fuelTypeSchema = z.enum(fuelTypes);
export const transmissionSchema = z.enum(transmissionTypes);
export const bodyTypeSchema = z.enum(bodyTypes);
export const sellerTypeSchema = z.enum(sellerTypes);
export const sortSchema = z.enum(sortOptions);
export const priceCurrencySchema = z.enum(priceCurrencies);
export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/);
