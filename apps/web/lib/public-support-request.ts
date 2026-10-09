import { isoCountryCodeSchema } from "@repo/marketplace";
import { z } from "zod";
import { publicContactLimits } from "./public-contact-contract";

/** Transport validation only: no persistence, provider calls, or browser state. */
const validListingSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const maxPublicSupportFormBytes = 16 * 1024;

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && !value.trim()) {
    return undefined;
  }
  return value;
};

const optionalInteger = (minimum: number, maximum: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(minimum).max(maximum).optional()
  );

const publicSupportRequestSchema = z
  .object({
    budget: z.string().trim().max(80).optional(),
    company: z.string().trim().max(120),
    context: z.enum(["listing-delivery", "import-request"]).optional(),
    deliverTo: isoCountryCodeSchema.optional(),
    email: z.preprocess(
      emptyToUndefined,
      z
        .email()
        .max(publicContactLimits.email.max)
        .transform((value) => value.toLowerCase())
        .optional()
    ),
    listing: z
      .string()
      .trim()
      .max(180)
      .regex(validListingSlugPattern)
      .optional(),
    locale: z.enum(["bg", "en"]),
    intent: z.enum(["general", "finance", "trade_in"]).optional(),
    make: z.string().trim().max(80).optional(),
    message: z.string().trim().max(3000),
    mileage: optionalInteger(0, 10_000_000),
    model: z.string().trim().max(120).optional(),
    name: z
      .string()
      .trim()
      .min(publicContactLimits.name.min)
      .max(publicContactLimits.name.max),
    origin: z.enum(["CN", "DE", "US", "JP", "KR"]).optional(),
    phone: z
      .string()
      .trim()
      .min(publicContactLimits.phone.min)
      .max(publicContactLimits.phone.max)
      .optional(),
    sourceUrl: z.preprocess(
      emptyToUndefined,
      z
        .url({ protocol: /^https?$/ })
        .max(500)
        .optional()
    ),
    topic: z.enum(["dealer", "importer", "buyer", "other"]),
    website: z.string().trim().max(120),
    year: optionalInteger(1886, 2100),
  })
  .superRefine((request, context) => {
    if (!(request.phone || request.email)) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Provide a phone number or email address",
      });
    }
    if (request.context === "listing-delivery" && !request.listing) {
      context.addIssue({
        code: "custom",
        message: "Listing delivery context requires a listing",
        path: ["listing"],
      });
    }

    if (request.context !== "import-request" && request.message.length < 20) {
      context.addIssue({
        code: "too_small",
        minimum: 20,
        origin: "string",
        inclusive: true,
        message: "Message must be at least 20 characters",
        path: ["message"],
      });
    }

    if (request.context === "import-request") {
      if (!request.phone) {
        context.addIssue({
          code: "custom",
          message: "Import requests require a phone number",
          path: ["phone"],
        });
      }

      if (!(request.sourceUrl || (request.make && request.model))) {
        context.addIssue({
          code: "custom",
          message: "Import requests require a source URL or vehicle details",
          path: ["sourceUrl"],
        });
      }
    }
  });

export type PublicSupportRequest = z.infer<typeof publicSupportRequestSchema>;

/** Derive the admission allowlist from the schema so new fields cannot drift. */
export const publicSupportFields: ReadonlySet<string> = new Set(
  Object.keys(publicSupportRequestSchema.shape)
);

const getText = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const getOptionalText = (formData: FormData, key: string) =>
  getText(formData, key).trim() || undefined;

export const parsePublicSupportRequest = (formData: FormData) => {
  return publicSupportRequestSchema.safeParse({
    company: getText(formData, "company"),
    context: getOptionalText(formData, "context"),
    deliverTo: getOptionalText(formData, "deliverTo"),
    email: getOptionalText(formData, "email"),
    listing: getOptionalText(formData, "listing"),
    intent: getOptionalText(formData, "intent"),
    locale: getText(formData, "locale"),
    make: getOptionalText(formData, "make"),
    message: getText(formData, "message"),
    mileage: getOptionalText(formData, "mileage"),
    model: getOptionalText(formData, "model"),
    name: getText(formData, "name"),
    origin: getOptionalText(formData, "origin"),
    phone: getOptionalText(formData, "phone"),
    sourceUrl: getOptionalText(formData, "sourceUrl"),
    topic: getText(formData, "topic"),
    website: getText(formData, "website"),
    budget: getOptionalText(formData, "budget"),
    year: getOptionalText(formData, "year"),
  });
};
