import { describe, expect, it, vi } from "vitest";
import {
  enforcePublicSupportRateLimit,
  PublicSupportRateLimitUnavailableError,
  TooManyPublicSupportRequestsError,
} from "./public-support-rate-limit";

const input = { ipKey: "ip-hash", senderKey: "sender-hash" };

describe("public support rate limiting", () => {
  it("checks IP and sender scopes", async () => {
    const check = vi.fn().mockResolvedValue({ success: true });
    await expect(
      enforcePublicSupportRateLimit(input, { check })
    ).resolves.toBeUndefined();
    expect(check.mock.calls.map(([rule]) => rule.name)).toEqual([
      "support_ip_hour",
      "support_ip_day",
      "support_sender_day",
    ]);
  });

  it("fails closed without distributed protection in production", async () => {
    await expect(
      enforcePublicSupportRateLimit(input, {
        nodeEnv: "production",
        redisConfigured: false,
      })
    ).rejects.toBeInstanceOf(PublicSupportRateLimitUnavailableError);
  });

  it("rejects an exhausted rule", async () => {
    await expect(
      enforcePublicSupportRateLimit(input, {
        check: vi.fn().mockResolvedValue({ success: false }),
      })
    ).rejects.toBeInstanceOf(TooManyPublicSupportRequestsError);
  });
});
