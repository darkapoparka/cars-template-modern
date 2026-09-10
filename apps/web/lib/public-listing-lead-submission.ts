// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: public lead gates remain in one auditable fail-closed sequence.
import {
  isoCountryCodeSchema,
  type PublicLeadInput,
  publicLeadFormInputSchema,
  publicLeadInputSchema,
} from "@repo/marketplace";
import {
  fingerprintPublicValue,
  inspectPublicFormData,
  type PublicRequestContext,
} from "./public-form-security";
import { TooManyPublicLeadRequestsError } from "./public-lead-rate-limit";

export type PublicListingLeadSubmissionStatus =
  | "invalid"
  | "listing-unavailable"
  | "rate-limited"
  | "success"
  | "unavailable";

export interface PublicListingLeadSubmissionResult {
  buyerCountryCode?: string;
  correlationId: string;
  deliveryState?: "delivered";
  receiptId?: string;
  status: PublicListingLeadSubmissionStatus;
  suppressed?: boolean;
}

interface PublicListingLeadSubmissionDependencies {
  available: boolean;
  findListing: (
    slug: string,
    buyerCountryCode?: string
  ) => Promise<{
    dealerOrgId?: string | null;
    id: string;
    supply?: unknown;
  } | null>;
  persistLead: (lead: PublicLeadInput) => Promise<{ id: string }>;
  rateLimit: (input: {
    ipKey: string;
    listingId: string;
    senderKey: string;
  }) => Promise<void>;
  report: (
    event: string,
    fields: Readonly<Record<string, boolean | number | string | undefined>>
  ) => void;
}

const validSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxPublicLeadFormBytes = 16 * 1024;
const publicLeadFields = new Set([
  "buyerCountryCode",
  "buyerLocale",
  "buyerName",
  "email",
  "inquiryDedupeKey",
  "intent",
  "locale",
  "message",
  "phone",
  "slug",
  "website",
]);

export const submitPublicListingLead = async (
  formData: FormData,
  requestContext: PublicRequestContext,
  dependencies: PublicListingLeadSubmissionDependencies
): Promise<PublicListingLeadSubmissionResult> => {
  const baseResult = { correlationId: requestContext.correlationId };
  const slug = String(formData.get("slug") ?? "").trim();
  const parsedBuyerCountryCode = isoCountryCodeSchema.safeParse(
    String(formData.get("buyerCountryCode") ?? "")
  );
  const resultContext = parsedBuyerCountryCode.success
    ? { ...baseResult, buyerCountryCode: parsedBuyerCountryCode.data }
    : baseResult;
  if (
    !(
      requestContext.sameOrigin &&
      inspectPublicFormData(formData, {
        allowedFields: publicLeadFields,
        maxBytes: maxPublicLeadFormBytes,
      })
    )
  ) {
    dependencies.report("public_listing_lead_rejected", {
      correlationId: requestContext.correlationId,
      reason: "request_context_or_body",
    });
    return { ...resultContext, status: "invalid" };
  }
  const parsedForm = publicLeadFormInputSchema.safeParse({
    buyerCountryCode:
      String(formData.get("buyerCountryCode") ?? "").trim() || undefined,
    buyerLocale: String(formData.get("buyerLocale") ?? "").trim() || undefined,
    buyerName: formData.get("buyerName"),
    email: formData.get("email"),
    intent: formData.get("intent"),
    inquiryDedupeKey:
      String(formData.get("inquiryDedupeKey") ?? "").trim() || undefined,
    message: formData.get("message"),
    phone: formData.get("phone"),
    website: formData.get("website") ?? "",
  });

  if (
    !(parsedForm.success && parsedForm.data.inquiryDedupeKey) ||
    slug.length > 180 ||
    !validSlugPattern.test(slug)
  ) {
    dependencies.report("public_listing_lead_rejected", {
      correlationId: requestContext.correlationId,
      reason: "validation",
    });
    return { ...resultContext, status: "invalid" };
  }

  const buyerCountryCode = parsedForm.data.buyerCountryCode;

  if (parsedForm.data.website) {
    dependencies.report("public_listing_lead_suppressed", {
      correlationId: requestContext.correlationId,
      reason: "honeypot",
    });
    return {
      ...resultContext,
      status: "success",
      suppressed: true,
    };
  }

  if (!dependencies.available) {
    return { ...resultContext, status: "unavailable" };
  }

  let listing: Awaited<
    ReturnType<PublicListingLeadSubmissionDependencies["findListing"]>
  >;
  try {
    listing = await dependencies.findListing(slug, buyerCountryCode);
  } catch (error) {
    dependencies.report("public_listing_lead_failed", {
      correlationId: requestContext.correlationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      stage: "listing_lookup",
    });
    return { ...resultContext, status: "unavailable" };
  }

  if (!listing?.dealerOrgId || (listing.supply && !buyerCountryCode)) {
    return { ...resultContext, status: "listing-unavailable" };
  }

  try {
    const sender =
      parsedForm.data.email || parsedForm.data.phone || "missing-contact";
    await dependencies.rateLimit({
      ipKey: requestContext.ipKey,
      listingId: listing.id,
      senderKey: fingerprintPublicValue("listing-lead-sender", sender),
    });
  } catch (error) {
    if (error instanceof TooManyPublicLeadRequestsError) {
      dependencies.report("public_listing_lead_rate_limited", {
        correlationId: requestContext.correlationId,
        listingId: listing.id,
      });
      return { ...resultContext, status: "rate-limited" };
    }
    dependencies.report("public_listing_lead_failed", {
      correlationId: requestContext.correlationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      listingId: listing.id,
      stage: "rate_limit",
    });
    return { ...resultContext, status: "unavailable" };
  }

  try {
    const lead = publicLeadInputSchema.parse({
      ...parsedForm.data,
      listingId: listing.id,
    });
    const persisted = await dependencies.persistLead(lead);
    dependencies.report("public_listing_lead_delivered", {
      correlationId: requestContext.correlationId,
      deliveryState: "delivered",
      listingId: listing.id,
      receiptId: persisted.id,
    });
    return {
      ...resultContext,
      deliveryState: "delivered",
      receiptId: persisted.id,
      status: "success",
    };
  } catch (error) {
    dependencies.report("public_listing_lead_failed", {
      correlationId: requestContext.correlationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      listingId: listing.id,
      stage: "persistence",
    });
    return { ...resultContext, status: "unavailable" };
  }
};
