import { describe, expect, test, vi } from "vitest";

import {
  enforceInventorySourceRateLimit,
  INVENTORY_MAX_REQUESTS_PER_MINUTE,
} from "../lib/inventory-http";

describe("inventory ingress rate limit", () => {
  test("skips local provider-free runs without Redis", async () => {
    const createLimiter = vi.fn();

    await expect(
      enforceInventorySourceRateLimit("source-one", {
        createLimiter,
        nodeEnv: "test",
        redisConfigured: false,
      })
    ).resolves.toBeNull();
    expect(createLimiter).not.toHaveBeenCalled();
  });

  test("keys the production budget by source and returns Retry-After", async () => {
    const limit = vi.fn().mockResolvedValue({ success: false });
    const response = await enforceInventorySourceRateLimit("source-one", {
      createLimiter: () => ({ limit }),
      nodeEnv: "production",
      redisConfigured: true,
    });

    expect(INVENTORY_MAX_REQUESTS_PER_MINUTE).toBe(30);
    expect(limit).toHaveBeenCalledWith("source:source-one");
    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBe("60");
    expect(response?.headers.get("cache-control")).toBe("no-store");
    await expect(response?.json()).resolves.toEqual({ error: "rate_limited" });
  });

  test("fails closed when the production limiter is unavailable", async () => {
    const response = await enforceInventorySourceRateLimit("source-one", {
      createLimiter: () => ({
        limit: vi.fn().mockRejectedValue(new Error("redis unavailable")),
      }),
      nodeEnv: "production",
      redisConfigured: true,
    });

    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toEqual({
      error: "inventory_rate_limit_unavailable",
    });
  });
});
