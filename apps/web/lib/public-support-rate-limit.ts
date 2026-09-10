import {
  enforcePublicFormRateLimit,
  PublicFormRateLimitUnavailableError,
  TooManyPublicFormRequestsError,
} from "./public-form-rate-limit";

export class PublicSupportRateLimitUnavailableError extends Error {
  constructor() {
    super("Support requests are temporarily unavailable");
    this.name = "PublicSupportRateLimitUnavailableError";
  }
}

export class TooManyPublicSupportRequestsError extends Error {
  constructor() {
    super("Too many support requests");
    this.name = "TooManyPublicSupportRequestsError";
  }
}

interface PublicSupportRateLimitDependencies {
  check?: (rule: {
    duration: "1 d" | "1 h";
    key: string;
    limit: number;
    name: string;
  }) => Promise<{ success: boolean }>;
  nodeEnv?: string;
  redisConfigured?: boolean;
}

export const enforcePublicSupportRateLimit = async (
  input: { readonly ipKey: string; readonly senderKey: string },
  dependencies: PublicSupportRateLimitDependencies = {}
) => {
  try {
    await enforcePublicFormRateLimit(
      [
        {
          duration: "1 h",
          key: input.ipKey,
          limit: 4,
          name: "support_ip_hour",
        },
        {
          duration: "1 d",
          key: input.ipKey,
          limit: 8,
          name: "support_ip_day",
        },
        {
          duration: "1 d",
          key: input.senderKey,
          limit: 3,
          name: "support_sender_day",
        },
      ],
      dependencies
    );
  } catch (error) {
    if (error instanceof TooManyPublicFormRequestsError) {
      throw new TooManyPublicSupportRequestsError();
    }
    if (error instanceof PublicFormRateLimitUnavailableError) {
      throw new PublicSupportRateLimitUnavailableError();
    }
    throw new PublicSupportRateLimitUnavailableError();
  }
};
