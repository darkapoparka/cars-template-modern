import { z } from "zod";
import {
  bodyTypes,
  fuelTypes,
  priceCurrencies,
  transmissionTypes,
  vehicleCategorySchema,
} from "./taxonomy";

const optionalText = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => value || undefined);

export const listingInputSchema = z.object({
  bodyType: z.enum(bodyTypes),
  category: vehicleCategorySchema,
  colorExterior: optionalText,
  description: z.string().trim().min(20).max(10_000),
  derivative: optionalText,
  enginePowerHp: z.coerce.number().int().min(1).max(2500).optional(),
  fuelType: z.enum(fuelTypes),
  locationCity: z.string().trim().min(2).max(120),
  locationCountry: z.string().trim().min(2).max(120).default("Bulgaria"),
  locationRegion: optionalText,
  make: z.string().trim().min(1).max(80),
  mileageValue: z.coerce.number().int().min(0).max(10_000_000),
  model: z.string().trim().min(1).max(80),
  monthlyAmount: z.coerce.number().int().min(0).optional(),
  priceAmount: z.coerce.number().int().min(0).max(20_000_000),
  priceCurrency: z.enum(priceCurrencies),
  priceType: z.enum([
    "fixed",
    "negotiable",
    "lease_monthly",
    "finance_estimate",
  ]),
  title: z.string().trim().min(3).max(160),
  transmission: z.enum(transmissionTypes),
  trim: optionalText,
  vin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  year: z.coerce.number().int().min(1886).max(2100),
});

export type ListingInput = z.infer<typeof listingInputSchema>;
