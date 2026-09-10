export const AI_LIMITS = {
  listingCopy: {
    maxImages: 6,
    maxInputCharacters: 4000,
    maxOutputTokens: 1000,
    maxSteps: 1,
    timeoutMs: 8000,
    trialUsesPerListing: 3,
  },
  naturalLanguageSearch: {
    maxInputCharacters: 500,
    maxOutputTokens: 400,
    maxSteps: 1,
    timeoutMs: 5000,
    trialUsesPerMonth: 10,
  },
} as const;

export type AiFeature = "listing-copy" | "natural-language-search";
export type AiExecutionMode = "demo" | "deterministic-fallback" | "provider";
export type AiErrorCode =
  | "entitlement_denied"
  | "invalid_output"
  | "provider_error"
  | "provider_unavailable"
  | "rate_limited"
  | "timeout";

export interface AiEntitlementRequest {
  readonly feature: AiFeature;
  readonly idempotencyKey: string;
  readonly listingId?: string;
  readonly organizationId?: string;
  readonly subjectId: string;
  readonly units: 1;
}

export interface AiEntitlementDecision {
  readonly allowed: boolean;
  readonly limit: number | null;
  readonly remaining: number | null;
  readonly source: "commerce" | "listing-generation" | "safe-default" | "test";
}

/**
 * Commerce owns the durable implementation. AI callers reserve one bounded
 * unit before provider execution. Deterministic fallbacks never require a unit.
 */
export interface AiEntitlementPort {
  authorizeAndConsume(
    request: AiEntitlementRequest
  ): Promise<AiEntitlementDecision>;
}

export interface AiUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}

export interface AiUsageEvent {
  readonly errorCode?: AiErrorCode;
  readonly feature: AiFeature;
  readonly latencyMs: number;
  readonly mode: AiExecutionMode;
  readonly model?: string;
  readonly outcome: "fallback" | "success";
  readonly promptVersion: string;
  readonly provider: string;
  readonly requestId: string;
  readonly usage?: AiUsage;
}

export type AiUsageHook = (event: AiUsageEvent) => Promise<void> | void;

export const safeDefaultAiEntitlementPort: AiEntitlementPort = {
  authorizeAndConsume() {
    return Promise.resolve({
      allowed: false,
      limit: null,
      remaining: null,
      source: "safe-default",
    });
  },
};

export const allowTestAiEntitlementPort: AiEntitlementPort = {
  authorizeAndConsume() {
    return Promise.resolve({
      allowed: true,
      limit: null,
      remaining: null,
      source: "test",
    });
  },
};
