import "server-only";
import { Ratelimit, type RatelimitConfig } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { keys } from "./keys";

export class RateLimitConfigurationError extends Error {
  constructor() {
    super("Upstash Redis is not configured");
    this.name = "RateLimitConfigurationError";
  }
}

let redis: Redis | undefined;

export const getRedis = (): Redis => {
  if (redis) {
    return redis;
  }

  const { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } = keys();

  if (!(UPSTASH_REDIS_REST_TOKEN && UPSTASH_REDIS_REST_URL)) {
    throw new RateLimitConfigurationError();
  }

  redis = new Redis({
    token: UPSTASH_REDIS_REST_TOKEN,
    url: UPSTASH_REDIS_REST_URL,
  });

  return redis;
};

export const createRateLimiter = (props: Omit<RatelimitConfig, "redis">) =>
  new Ratelimit({
    redis: getRedis(),
    limiter: props.limiter ?? Ratelimit.slidingWindow(10, "10 s"),
    prefix: props.prefix ?? "automarket",
  });

export const { slidingWindow } = Ratelimit;
