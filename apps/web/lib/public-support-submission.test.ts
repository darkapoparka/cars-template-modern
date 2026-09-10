import type { EmailDeliveryReceipt } from "@repo/email/delivery";
import { describe, expect, it, vi } from "vitest";
import { TooManyPublicSupportRequestsError } from "./public-support-rate-limit";
import { submitPublicSupportRequest } from "./public-support-submission";

const sha256Pattern = /^[a-f0-9]{64}$/;
const supportIdempotencyPattern = /^support:[a-f0-9]{64}$/;

const createFormData = (overrides: Record<string, string> = {}) => {
  const formData = new FormData();
  const values = {
    company: "Auto Dealer",
    email: "buyer@example.test",
    locale: "en",
    message: "Please help with this marketplace request.",
    name: "Buyer Name",
    topic: "buyer",
    website: "",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }
  return formData;
};

const requestContext = {
  correlationId: "request_12345678",
  ipKey: "ip-hash",
  sameOrigin: true,
};

const receipt: EmailDeliveryReceipt = {
  attempts: 1,
  correlationId: requestContext.correlationId,
  provider: "fake",
  providerMessageId: "provider-1",
  sentAt: new Date("2026-07-22T12:00:00.000Z"),
  state: "sent",
};

const createDependencies = () => ({
  available: true,
  deliver: vi.fn().mockResolvedValue(receipt),
  rateLimit: vi.fn().mockResolvedValue(undefined),
  report: vi.fn(),
});

describe("public support submission", () => {
  it("returns success only after the provider accepts the request", async () => {
    const dependencies = createDependencies();
    const result = await submitPublicSupportRequest(
      createFormData(),
      requestContext,
      dependencies
    );

    expect(result).toMatchObject({ receipt, status: "sent" });
    expect(dependencies.rateLimit).toHaveBeenCalledWith({
      ipKey: requestContext.ipKey,
      senderKey: expect.stringMatching(sha256Pattern),
    });
    expect(dependencies.report).toHaveBeenCalledWith(
      "public_support_sent",
      expect.objectContaining({
        deliveryState: "sent",
        providerReceiptId: "provider-1",
      })
    );
    const serializedLogs = JSON.stringify(dependencies.report.mock.calls);
    expect(serializedLogs).not.toContain("Buyer Name");
    expect(serializedLogs).not.toContain("buyer@example.test");
    expect(serializedLogs).not.toContain(
      "Please help with this marketplace request."
    );
  });

  it("accepts a structured import request with a phone and source listing", async () => {
    const dependencies = createDependencies();
    const result = await submitPublicSupportRequest(
      createFormData({
        budget: "до 50 000 EUR",
        context: "import-request",
        deliverTo: "BG",
        email: "",
        make: "BMW",
        message: "Моля, проверете тази конкретна обява и доставката.",
        mileage: "62000",
        model: "X5 xDrive40d",
        origin: "DE",
        phone: "0877733110",
        sourceUrl: "https://example.com/bmw-x5",
        topic: "importer",
        year: "2022",
      }),
      requestContext,
      dependencies
    );

    expect(result).toMatchObject({ receipt, status: "sent" });
    expect(dependencies.deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        context: "import-request",
        make: "BMW",
        model: "X5 xDrive40d",
        origin: "DE",
        phone: "0877733110",
        sourceUrl: "https://example.com/bmw-x5",
      }),
      expect.anything()
    );
  });

  it("rejects an import request without contact or vehicle context", async () => {
    const dependencies = createDependencies();
    const result = await submitPublicSupportRequest(
      createFormData({
        context: "import-request",
        email: "",
        message: "",
        topic: "importer",
      }),
      requestContext,
      dependencies
    );

    expect(result).toMatchObject({ status: "invalid" });
    expect(dependencies.deliver).not.toHaveBeenCalled();
  });

  it("uses a stable content-derived idempotency key for duplicate submits", async () => {
    const dependencies = createDependencies();
    await submitPublicSupportRequest(
      createFormData(),
      requestContext,
      dependencies
    );
    await submitPublicSupportRequest(
      createFormData(),
      requestContext,
      dependencies
    );

    const firstKey = dependencies.deliver.mock.calls[0]?.[1].idempotencyKey;
    const secondKey = dependencies.deliver.mock.calls[1]?.[1].idempotencyKey;
    expect(firstKey).toMatch(supportIdempotencyPattern);
    expect(secondKey).toBe(firstKey);
  });

  it("reports provider failure without claiming success", async () => {
    const dependencies = createDependencies();
    dependencies.deliver.mockRejectedValue({
      attempts: 3,
      code: "provider_timeout",
      name: "EmailDeliveryFailure",
      retryable: true,
    });

    await expect(
      submitPublicSupportRequest(createFormData(), requestContext, dependencies)
    ).resolves.toMatchObject({ status: "failed" });
    expect(dependencies.report).toHaveBeenCalledWith(
      "public_support_failed",
      expect.objectContaining({
        attempts: 3,
        errorCode: "provider_timeout",
      })
    );
  });

  it("rate limits before provider submission", async () => {
    const dependencies = createDependencies();
    dependencies.rateLimit.mockRejectedValue(
      new TooManyPublicSupportRequestsError()
    );

    await expect(
      submitPublicSupportRequest(createFormData(), requestContext, dependencies)
    ).resolves.toMatchObject({ status: "rate-limited" });
    expect(dependencies.deliver).not.toHaveBeenCalled();
  });

  it("rejects malformed, oversized, duplicate-field, and cross-origin input", async () => {
    await expect(
      submitPublicSupportRequest(
        createFormData({ email: "not-an-email" }),
        requestContext,
        createDependencies()
      )
    ).resolves.toMatchObject({ status: "invalid" });
    await expect(
      submitPublicSupportRequest(
        createFormData({ message: "x".repeat(17_000) }),
        requestContext,
        createDependencies()
      )
    ).resolves.toMatchObject({ status: "invalid" });
    const duplicate = createFormData();
    duplicate.append("topic", "dealer");
    await expect(
      submitPublicSupportRequest(
        duplicate,
        requestContext,
        createDependencies()
      )
    ).resolves.toMatchObject({ status: "invalid" });
    await expect(
      submitPublicSupportRequest(
        createFormData(),
        { ...requestContext, sameOrigin: false },
        createDependencies()
      )
    ).resolves.toMatchObject({ status: "invalid" });

    const redirected = createDependencies();
    await expect(
      submitPublicSupportRequest(
        createFormData({
          provider: "attacker-provider",
          to: "attacker@example.test",
        }),
        requestContext,
        redirected
      )
    ).resolves.toMatchObject({ status: "invalid" });
    expect(redirected.deliver).not.toHaveBeenCalled();
  });

  it("suppresses honeypot abuse without calling the provider", async () => {
    const dependencies = createDependencies();
    const result = await submitPublicSupportRequest(
      createFormData({ website: "https://spam.example" }),
      requestContext,
      dependencies
    );
    expect(result).toMatchObject({ status: "suppressed" });
    expect(result).not.toHaveProperty("reason");
    expect(dependencies.rateLimit).not.toHaveBeenCalled();
    expect(dependencies.deliver).not.toHaveBeenCalled();
  });
});
