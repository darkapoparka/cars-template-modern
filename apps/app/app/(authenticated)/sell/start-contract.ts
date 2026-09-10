import { vehicleMakes } from "@repo/marketplace";
import { z } from "zod";

export const MINIMUM_DRAFT_DESCRIPTION =
  "Чернова от основните данни. Добавете снимки и потвърдете всички полета преди публикуване.";

const sellerVehicleCategories = ["car", "motorbike", "truck", "van"] as const;
const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;

export const minimumVehicleBasicsSchema = z
  .object({
    category: z.enum(sellerVehicleCategories),
    identityMethod: z.enum(["manual", "registration", "vin"]),
    identifier: z.string().trim().max(20).default(""),
    make: z
      .string()
      .trim()
      .refine((value) => vehicleMakes.includes(value), "Unknown vehicle make"),
    model: z.string().trim().min(1).max(80),
    year: z.coerce.number().int().min(1886).max(2100),
  })
  .superRefine((value, context) => {
    if (
      value.identityMethod === "vin" &&
      !vinPattern.test(value.identifier.toUpperCase())
    ) {
      context.addIssue({
        code: "custom",
        message: "VIN must contain 17 valid characters",
        path: ["identifier"],
      });
    }
    if (
      value.identityMethod === "registration" &&
      (value.identifier.length < 2 || value.identifier.length > 20)
    ) {
      context.addIssue({
        code: "custom",
        message: "Registration must contain 2 to 20 characters",
        path: ["identifier"],
      });
    }
  });

export type MinimumVehicleBasics = z.infer<typeof minimumVehicleBasicsSchema>;
