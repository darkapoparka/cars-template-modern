import { createHash } from "node:crypto";
import type { EmailDeliveryReceipt } from "@repo/email/delivery";
import {
  fingerprintPublicValue,
  inspectPublicFormData,
  type PublicRequestContext,
} from "./public-form-security";
import {
  PublicSupportRateLimitUnavailableError,
  TooManyPublicSupportRequestsError,
} from "./public-support-rate-limit";

import {
  maxPublicSupportFormBytes,
  type PublicSupportRequest,
  parsePublicSupportRequest,
  publicSupportFields,
} from "./public-support-request";

export type { PublicSupportRequest } from "./public-support-request";

export type PublicSupportSubmissionStatus =
  | "failed"
  | "invalid"
  | "rate-limited"
  | "received"
  | "sent"
  | "suppressed"
  | "unavailable";

export interface PublicSupportSubmissionResult {
  readonly correlationId: string;
  readonly inquiryId?: string;
  readonly receipt?: EmailDeliveryReceipt;
  readonly status: PublicSupportSubmissionStatus;
}

interface PublicSupportSubmissionDependencies {
  readonly available: boolean;
  readonly deliver: (
    request: PublicSupportRequest,
    context: { readonly correlationId: string; readonly idempotencyKey: string }
  ) => Promise<EmailDeliveryReceipt>;
  readonly isRequestAllowed?: (request: PublicSupportRequest) => boolean;
  readonly notify?: boolean;
  readonly persist?: (
    request: PublicSupportRequest,
    context: { readonly idempotencyKey: string; readonly correlationId: string }
  ) => Promise<{ id: string }>;
  readonly rateLimit: (input: {
    readonly ipKey: string;
    readonly senderKey: string;
  }) => Promise<void>;
  readonly report: (
    event: string,
    fields: Readonly<Record<string, boolean | number | string | undefined>>
  ) => void;
}

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
        intent: request.intent,
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

const deliverAcceptedSupportRequest = async (
  request: PublicSupportRequest,
  requestContext: PublicRequestContext,
  dependencies: PublicSupportSubmissionDependencies
): Promise<PublicSupportSubmissionResult> => {
  const baseResult = { correlationId: requestContext.correlationId };
  const deliveryContext = {
    correlationId: requestContext.correlationId,
    idempotencyKey: getDeliveryIdempotencyKey(request),
  };
  let inquiryId: string | undefined;
  if (dependencies.persist) {
    try {
      const inquiry = await dependencies.persist(request, deliveryContext);
      inquiryId = inquiry.id;
      dependencies.report("public_support_received", {
        correlationId: requestContext.correlationId,
        receiptId: inquiryId,
      });
    } catch {
      dependencies.report("public_support_failed", {
        correlationId: requestContext.correlationId,
        stage: "persistence",
      });
      return { ...baseResult, status: "unavailable" };
    }
    if (!dependencies.notify) {
      return { ...baseResult, inquiryId, status: "received" };
    }
  }

  try {
    const receipt = await dependencies.deliver(request, deliveryContext);
    dependencies.report("public_support_sent", {
      attempts: receipt.attempts,
      correlationId: requestContext.correlationId,
      deliveryState: receipt.state,
      provider: receipt.provider,
      providerReceiptId: receipt.providerMessageId,
    });
    return {
      ...baseResult,
      receipt,
      inquiryId,
      status: inquiryId ? "received" : "sent",
    };
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
    // Inbox acceptance is durable even if the optional email notification fails.
    return {
      ...baseResult,
      inquiryId,
      status: inquiryId ? "received" : "failed",
    };
  }
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

  const parsedRequest = parsePublicSupportRequest(formData);
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

  if (
    !dependencies.available ||
    dependencies.isRequestAllowed?.(request) === false
  ) {
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

  return await deliverAcceptedSupportRequest(
    request,
    requestContext,
    dependencies
  );
};
