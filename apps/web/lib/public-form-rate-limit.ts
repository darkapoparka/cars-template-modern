import { createRateLimiter, slidingWindow } from "@repo/rate-limit";

export class PublicFormRateLimitUnavailableError extends Error {
  constructor() {
    super("Public form rate limiting is unavailable");
    this.name = "PublicFormRateLimitUnavailableError";
  }
}

export class TooManyPublicFormRequestsError extends Error {
  constructor() {
    super("Too many public form requests");
    this.name = "TooManyPublicFormRequestsError";
  }
}

interface PublicFormRateLimitRule {
  readonly duration: "1 d" | "1 h";
  readonly key: string;
  readonly limit: number;
  readonly name: string;
}

interface PublicFormRateLimitDependencies {
  readonly check?: (
    rule: PublicFormRateLimitRule
  ) => Promise<{ readonly success: boolean }>;
  readonly nodeEnv?: string;
  readonly redisConfigured?: boolean;
}

interface LocalWindow {
  count: number;
  expiresAt: number;
}

const localWindows = new Map<string, LocalWindow>();
const maxLocalWindows = 5000;

const getDurationMs = (duration: PublicFormRateLimitRule["duration"]) =>
  duration === "1 h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

const checkLocalRule = (rule: PublicFormRateLimitRule) => {
  const now = Date.now();
  const mapKey = `${rule.name}:${rule.key}`;
  const current = localWindows.get(mapKey);

  if (!current || current.expiresAt <= now) {
    if (localWindows.size >= maxLocalWindows) {
      for (const [key, window] of localWindows) {
        if (window.expiresAt <= now) {
          localWindows.delete(key);
        }
      }
    }
    if (localWindows.size >= maxLocalWindows) {
      throw new PublicFormRateLimitUnavailableError();
    }
    localWindows.set(mapKey, {
      count: 1,
      expiresAt: now + getDurationMs(rule.duration),
    });
    return { success: true };
  }

  current.count += 1;
  return { success: current.count <= rule.limit };
};

const checkDistributedRule = async (rule: PublicFormRateLimitRule) => {
  const limiter = createRateLimiter({
    limiter: slidingWindow(rule.limit, rule.duration),
    prefix: `automarket_public_form_${rule.name}`,
  });
  return await limiter.limit(rule.key);
};

export const enforcePublicFormRateLimit = async (
  rules: readonly PublicFormRateLimitRule[],
  dependencies: PublicFormRateLimitDependencies = {}
) => {
  const nodeEnv = dependencies.nodeEnv ?? process.env.NODE_ENV;
  const redisConfigured =
    dependencies.redisConfigured ??
    Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    );

  if (nodeEnv === "production" && !redisConfigured && !dependencies.check) {
    throw new PublicFormRateLimitUnavailableError();
  }

  try {
    for (const rule of rules) {
      let result: { readonly success: boolean };
      if (dependencies.check) {
        result = await dependencies.check(rule);
      } else if (redisConfigured) {
        result = await checkDistributedRule(rule);
      } else {
        result = checkLocalRule(rule);
      }

      if (!result.success) {
        throw new TooManyPublicFormRequestsError();
      }
    }
  } catch (error) {
    if (
      error instanceof TooManyPublicFormRequestsError ||
      error instanceof PublicFormRateLimitUnavailableError
    ) {
      throw error;
    }
    throw new PublicFormRateLimitUnavailableError();
  }
};
