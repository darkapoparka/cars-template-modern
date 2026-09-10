import { createHash } from "node:crypto";
import type { EmailDeliveryReceipt } from "@repo/email/delivery";
import { isoCountryCodeSchema } from "@repo/marketplace";
import { z } from "zod";
import {
  fingerprintPublicValue,
  inspectPublicFormData,
  type PublicRequestContext,
} from "./public-form-security";
import {
  PublicSupportRateLimitUnavailableError,
  TooManyPublicSupportRequestsError,
} from "./public-support-rate-limit";

const validListingSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxPublicSupportFormBytes = 16 * 1024;
const publicSupportFields = new Set([
  "budget",
  "company",
  "context",
  "deliverTo",
  "email",
  "listing",
  "locale",
  "make",
  "message",
  "mileage",
  "model",
  "name",
  "origin",
  "phone",
  "sourceUrl",
  "topic",
  "website",
  "year",
]);

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
        .max(254)
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
    make: z.string().trim().max(80).optional(),
    message: z.string().trim().max(3000),
    mileage: optionalInteger(0, 10_000_000),
    model: z.string().trim().max(120).optional(),
    name: z.string().trim().min(2).max(100),
    origin: z.enum(["CN", "DE", "US", "JP", "KR"]).optional(),
    phone: z.string().trim().min(7).max(40).optional(),
    sourceUrl: z.preprocess(emptyToUndefined, z.url().max(500).optional()),
    topic: z.enum(["dealer", "importer", "buyer", "other"]),
    website: z.string().trim().max(120),
    year: optionalInteger(1886, 2100),
  })
  .superRefine((request, context) => {
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

export type PublicSupportSubmissionStatus =
  | "failed"
  | "invalid"
  | "rate-limited"
  | "sent"
  | "suppressed"
  | "unavailable";

export interface PublicSupportSubmissionResult {
  readonly correlationId: string;
  readonly receipt?: EmailDeliveryReceipt;
  readonly status: PublicSupportSubmissionStatus;
}

interface PublicSupportSubmissionDependencies {
  readonly available: boolean;
  readonly deliver: (
    request: PublicSupportRequest,
    context: { readonly correlationId: string; readonly idempotencyKey: string }
  ) => Promise<EmailDeliveryReceipt>;
  readonly rateLimit: (input: {
    readonly ipKey: string;
    readonly senderKey: string;
  }) => Promise<void>;
  readonly report: (
    event: string,
    fields: Readonly<Record<string, boolean | number | string | undefined>>
  ) => void;
}

const getText = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

const getOptionalText = (formData: FormData, key: string) =>
  getText(formData, key).trim() || undefined;

const getDeliveryIdempotencyKey = (request: PublicSupportRequest) => {
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        budget: request.budget,
        company: request.company,
        context: request.context,
        deliverTo: request.deliverTo,
        email: request.email,
        listing: request.listing,
        locale: request.locale,
        make: request.make,
        message: request.message,
        mileage: request.mileage,
        model: request.model,
        name: request.name,
        origin: request.origin,
        phone: request.phone,
        sourceUrl: request.sourceUrl,
        topic: request.topic,
        year: request.year,
      })
    )
    .digest("hex");

  return `support:${hash}`;
};

export const submitPublicSupportRequest = async (
  formData: FormData,
  requestContext: PublicRequestContext,
  dependencies: PublicSupportSubmissionDependencies
): Promise<PublicSupportSubmissionResult> => {
  const baseResult = { correlationId: requestContext.correlationId };
  if (
    !(
      requestContext.sameOrigin &&
      inspectPublicFormData(formData, {
        allowedFields: publicSupportFields,
        maxBytes: maxPublicSupportFormBytes,
      })
    )
  ) {
    dependencies.report("public_support_rejected", {
      correlationId: requestContext.correlationId,
      reason: "request_context_or_body",
    });
    return { ...baseResult, status: "invalid" };
  }

  const parsedRequest = publicSupportRequestSchema.safeParse({
    company: getText(formData, "company"),
    context: getOptionalText(formData, "context"),
    deliverTo: getOptionalText(formData, "deliverTo"),
    email: getOptionalText(formData, "email"),
    listing: getOptionalText(formData, "listing"),
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
  if (!parsedRequest.success) {
    dependencies.report("public_support_rejected", {
      correlationId: requestContext.correlationId,
      reason: "validation",
    });
    return { ...baseResult, status: "invalid" };
  }

  const request = parsedRequest.data;
  if (request.website) {
    dependencies.report("public_support_suppressed", {
      correlationId: requestContext.correlationId,
      reason: "honeypot",
    });
    return { ...baseResult, status: "suppressed" };
  }

  if (!dependencies.available) {
    return { ...baseResult, status: "unavailable" };
  }

  const senderKey = fingerprintPublicValue(
    "support-sender",
    request.email ?? request.phone ?? "missing-contact"
  );
  try {
    await dependencies.rateLimit({
      ipKey: requestContext.ipKey,
      senderKey,
    });
  } catch (error) {
    if (error instanceof TooManyPublicSupportRequestsError) {
      dependencies.report("public_support_rate_limited", {
        correlationId: requestContext.correlationId,
      });
      return { ...baseResult, status: "rate-limited" };
    }
    if (error instanceof PublicSupportRateLimitUnavailableError) {
      dependencies.report("public_support_failed", {
        correlationId: requestContext.correlationId,
        errorCode: "rate_limit_unavailable",
      });
      return { ...baseResult, status: "unavailable" };
    }
    dependencies.report("public_support_failed", {
      correlationId: requestContext.correlationId,
      errorCode: "rate_limit_unknown",
    });
    return { ...baseResult, status: "unavailable" };
  }

  try {
    const receipt = await dependencies.deliver(request, {
      correlationId: requestContext.correlationId,
      idempotencyKey: getDeliveryIdempotencyKey(request),
    });
    dependencies.report("public_support_sent", {
      attempts: receipt.attempts,
      correlationId: requestContext.correlationId,
      deliveryState: receipt.state,
      provider: receipt.provider,
      providerReceiptId: receipt.providerMessageId,
    });
    return { ...baseResult, receipt, status: "sent" };
  } catch (error) {
    const safeError =
      error && typeof error === "object"
        ? (error as {
            attempts?: number;
            code?: string;
            name?: string;
            retryable?: boolean;
          })
        : {};
    dependencies.report("public_support_failed", {
      attempts: safeError.attempts,
      correlationId: requestContext.correlationId,
      errorCode: safeError.code ?? "provider_unknown",
      errorName: safeError.name ?? "UnknownError",
      retryable: safeError.retryable,
    });
    return { ...baseResult, status: "failed" };
  }
};
