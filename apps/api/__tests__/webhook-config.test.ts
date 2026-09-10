import { beforeEach, describe, expect, test, vi } from "vitest";

describe("webhook configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("Clerk webhook fails loudly without its signing secret", {
    timeout: 15_000,
  }, async () => {
    vi.doMock("@/env", () => ({ env: {} }));
    vi.doMock("server-only", () => ({}));
    vi.doMock("@repo/analytics/server", () => ({ analytics: undefined }));
    vi.doMock("@repo/database/auth-sync", () => ({
      applyDealerMembershipSyncEvent: vi.fn(),
      applyDealerOrganizationSyncEvent: vi.fn(),
      disableMarketplaceAccountFromClerk: vi.fn(),
      hashExternalIdentityPayload: vi.fn(() => "a".repeat(64)),
      receiveExternalIdentitySyncEvent: vi.fn(),
    }));
    vi.doMock("@repo/observability/log", () => ({
      log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    }));
    vi.doMock("svix", () => ({ Webhook: vi.fn() }));

    const { POST } = await import("../app/webhooks/auth/route");
    const response = await POST(
      new Request("https://api.example/webhooks/auth", { method: "POST" })
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("Stripe webhook fails closed while its durable projection is unavailable", async () => {
    vi.doMock("@/env", () => ({ env: {} }));
    vi.doMock("@repo/analytics/server", () => ({ analytics: undefined }));
    vi.doMock("@repo/auth/server", () => ({ clerkClient: vi.fn() }));
    vi.doMock("@repo/observability/log", () => ({
      log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    }));
    vi.doMock("@repo/payments", () => ({ getStripe: () => undefined }));

    const { POST } = await import("../app/webhooks/payments/route");
    const response = await POST(
      new Request("https://api.example/webhooks/payments", { method: "POST" })
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "billing_projection_unavailable",
    });
  });

  test("Stripe webhook remains fail-closed while the billing projection is unavailable", async () => {
    const constructEvent = vi.fn();
    vi.doMock("@/env", () => ({
      env: {
        AUTOMARKET_ENABLE_BILLING: "true",
        STRIPE_WEBHOOK_SECRET: "whsec_configured_but_projection_missing",
      },
    }));
    vi.doMock("@repo/analytics/server", () => ({ analytics: undefined }));
    vi.doMock("@repo/auth/server", () => ({ clerkClient: vi.fn() }));
    vi.doMock("@repo/observability/log", () => ({
      log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
    }));
    vi.doMock("@repo/payments", () => ({
      getStripe: () => ({ webhooks: { constructEvent } }),
    }));

    const { POST } = await import("../app/webhooks/payments/route");
    const response = await POST(
      new Request("https://api.example/webhooks/payments", {
        body: "{}",
        headers: { "stripe-signature": "configured" },
        method: "POST",
      })
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "billing_projection_unavailable",
    });
    expect(constructEvent).not.toHaveBeenCalled();
  });
});
