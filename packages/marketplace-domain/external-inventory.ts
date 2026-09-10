import { z } from "zod";
import {
  inventoryLocationSchema,
  inventoryMoneySchema,
  isoCountryCodeSchema,
} from "./inventory-contract";
import { bodyTypes, fuelTypes, transmissionTypes } from "./taxonomy";

const publicHttpUrlSchema = z
  .url()
  .max(2048)
  .refine((value) => {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  });

export const externalInventoryDiscoveryListingSchema = z
  .object({
    externalId: z.string().trim().min(1).max(240),
    offer: z
      .object({
        dealerName: z.string().trim().min(1).max(180),
        mileageKm: z.number().int().min(0).max(10_000_000),
        nativePrice: inventoryMoneySchema,
        physicalLocation: inventoryLocationSchema,
        status: z.enum(["available", "reserved"]),
      })
      .strict(),
    source: z
      .object({
        displayName: z.string().trim().min(1).max(120),
        listingUrl: publicHttpUrlSchema,
        providerId: z.string().trim().min(1).max(120),
      })
      .strict(),
    sourceUpdatedAt: z.iso.datetime({ offset: true }),
    title: z.string().trim().min(3).max(180),
    vehicle: z
      .object({
        bodyType: z.enum(bodyTypes),
        fuelType: z.enum(fuelTypes),
        make: z.string().trim().min(1).max(80),
        model: z.string().trim().min(1).max(80),
        transmission: z.enum(transmissionTypes),
        trim: z.string().trim().min(1).max(120).optional(),
        vin: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-HJ-NPR-Z0-9]{17}$/)
          .optional(),
        year: z.number().int().min(1886).max(2100),
      })
      .strict(),
  })
  .strict();

const externalInventorySourceSchema = z
  .object({
    attributionUrl: publicHttpUrlSchema,
    displayName: z.string().trim().min(1).max(120),
    providerId: z.string().trim().min(1).max(120),
  })
  .strict();

export const externalInventoryDiscoveryResponseSchema = z.discriminatedUnion(
  "status",
  [
    z
      .object({
        listings: z.array(externalInventoryDiscoveryListingSchema).max(20),
        nextCursor: z.string().trim().min(1).max(2048).optional(),
        originCountryCode: isoCountryCodeSchema,
        retrievedAt: z.iso.datetime({ offset: true }),
        source: externalInventorySourceSchema,
        status: z.literal("ok"),
      })
      .strict(),
    z
      .object({
        listings: z.tuple([]),
        originCountryCode: isoCountryCodeSchema,
        reason: z.enum(["not_configured", "unsupported_origin"]),
        status: z.literal("disabled"),
      })
      .strict(),
    z
      .object({
        listings: z.tuple([]),
        originCountryCode: isoCountryCodeSchema,
        reason: z.enum([
          "invalid_response",
          "provider_error",
          "rate_limited",
          "timeout",
        ]),
        status: z.literal("unavailable"),
      })
      .strict(),
  ]
);

export type ExternalInventoryDiscoveryListing = z.infer<
  typeof externalInventoryDiscoveryListingSchema
>;
export type ExternalInventoryDiscoveryResponse = z.infer<
  typeof externalInventoryDiscoveryResponseSchema
>;
