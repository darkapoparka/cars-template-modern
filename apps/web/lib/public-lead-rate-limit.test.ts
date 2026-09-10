import { describe, expect, it, vi } from "vitest";
import {
  enforcePublicLeadRateLimit,
  PublicLeadRateLimitUnavailableError,
  TooManyPublicLeadRequestsError,
} from "./public-lead-rate-limit";

const input = {
  ipKey: "ip-hash",
  listingId: "listing-1",
  senderKey: "sender-hash",
};

describe("public lead rate limiting", () => {
  it("checks all IP, listing, and sender rules", async () => {
    const check = vi.fn().mockResolvedValue({ success: true });

    await expect(
      enforcePublicLeadRateLimit(input, {
        check,
        nodeEnv: "development",
        redisConfigured: false,
      })
    ).resolves.toBeUndefined();
    expect(check).toHaveBeenCalledTimes(4);
    expect(check.mock.calls.map(([rule]) => rule.name)).toEqual([
      "listing_lead_ip_hour",
      "listing_lead_ip_listing_hour",
      "listing_lead_sender_day",
      "listing_lead_sender_listing_day",
    ]);
  });

  it("fails closed in production when the limiter is unconfigured", async () => {
    await expect(
      enforcePublicLeadRateLimit(input, {
        nodeEnv: "production",
        redisConfigured: false,
      })
    ).rejects.toBeInstanceOf(PublicLeadRateLimitUnavailableError);
  });

  it("fails closed when the distributed limiter is unavailable", async () => {
    await expect(
      enforcePublicLeadRateLimit(input, {
        check: vi.fn().mockRejectedValue(new Error("redis unavailable")),
        nodeEnv: "production",
        redisConfigured: true,
      })
    ).rejects.toBeInstanceOf(PublicLeadRateLimitUnavailableError);
  });

  it("rejects an exhausted production limit", async () => {
    await expect(
      enforcePublicLeadRateLimit(input, {
        check: vi.fn().mockResolvedValue({ success: false }),
        nodeEnv: "production",
        redisConfigured: true,
      })
    ).rejects.toBeInstanceOf(TooManyPublicLeadRequestsError);
  });
});
