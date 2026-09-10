import {
  enforcePublicFormRateLimit,
  PublicFormRateLimitUnavailableError,
  TooManyPublicFormRequestsError,
} from "./public-form-rate-limit";

export class PublicLeadRateLimitUnavailableError extends Error {
  constructor() {
    super("Enquiries are temporarily unavailable. Please try again later.");
    this.name = "PublicLeadRateLimitUnavailableError";
  }
}

export class TooManyPublicLeadRequestsError extends Error {
  constructor() {
    super("Too many enquiries. Please try again later.");
    this.name = "TooManyPublicLeadRequestsError";
  }
}

interface PublicLeadRateLimitDependencies {
  check?: (rule: {
    duration: "1 d" | "1 h";
    key: string;
    limit: number;
    name: string;
  }) => Promise<{ success: boolean }>;
  nodeEnv?: string;
  redisConfigured?: boolean;
}

export const enforcePublicLeadRateLimit = async (
  input: { ipKey: string; listingId: string; senderKey: string },
  dependencies: PublicLeadRateLimitDependencies = {}
) => {
  try {
    await enforcePublicFormRateLimit(
      [
        {
          duration: "1 h",
          key: input.ipKey,
          limit: 12,
          name: "listing_lead_ip_hour",
        },
        {
          duration: "1 h",
          key: `${input.listingId}:${input.ipKey}`,
          limit: 5,
          name: "listing_lead_ip_listing_hour",
        },
        {
          duration: "1 d",
          key: input.senderKey,
          limit: 8,
          name: "listing_lead_sender_day",
        },
        {
          duration: "1 d",
          key: `${input.listingId}:${input.senderKey}`,
          limit: 3,
          name: "listing_lead_sender_listing_day",
        },
      ],
      dependencies
    );
  } catch (error) {
    if (error instanceof TooManyPublicFormRequestsError) {
      throw new TooManyPublicLeadRequestsError();
    }
    if (error instanceof PublicFormRateLimitUnavailableError) {
      throw new PublicLeadRateLimitUnavailableError();
    }
    throw new PublicLeadRateLimitUnavailableError();
  }
};
