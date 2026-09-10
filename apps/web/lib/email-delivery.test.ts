import { createResendEmailProvider } from "@repo/email";
import {
  EmailDeliveryFailure,
  type EmailDeliveryProvider,
  EmailProviderError,
  ReliableEmailDelivery,
} from "@repo/email/delivery";
import { describe, expect, it, vi } from "vitest";

const request = {
  correlationId: "request_12345678",
  idempotencyKey: `support:${"a".repeat(64)}`,
  payload: {
    from: "preview@example.test",
    subject: "Preview",
    text: "Preview proof",
    to: "receipt@example.test",
  },
};

const createProvider = () => ({
  name: "fake",
  send: vi.fn().mockResolvedValue({ providerMessageId: "provider-1" }),
});

describe("reliable email delivery", () => {
  it("reports provider acceptance as sent, never delivered", async () => {
    const provider = createProvider();
    const delivery = new ReliableEmailDelivery({
      now: () => Date.parse("2026-07-22T12:00:00.000Z"),
      provider,
    });

    await expect(delivery.deliver(request)).resolves.toEqual({
      attempts: 1,
      correlationId: request.correlationId,
      provider: "fake",
      providerMessageId: "provider-1",
      sentAt: new Date("2026-07-22T12:00:00.000Z"),
      state: "sent",
    });
    expect(provider.send).toHaveBeenCalledWith(request.payload, {
      idempotencyKey: request.idempotencyKey,
    });
  });

  it("retries a timeout with the same idempotency key", async () => {
    const provider: EmailDeliveryProvider = {
      name: "fake",
      send: vi
        .fn()
        .mockImplementationOnce(async () => await new Promise(() => undefined))
        .mockResolvedValueOnce({ providerMessageId: "provider-after-timeout" }),
    };
    const delivery = new ReliableEmailDelivery({
      maxAttempts: 2,
      provider,
      sleep: vi.fn().mockResolvedValue(undefined),
      timeoutMs: 5,
    });

    await expect(delivery.deliver(request)).resolves.toMatchObject({
      attempts: 2,
      providerMessageId: "provider-after-timeout",
      state: "sent",
    });
    expect(provider.send).toHaveBeenCalledTimes(2);
    expect(provider.send).toHaveBeenNthCalledWith(2, request.payload, {
      idempotencyKey: request.idempotencyKey,
    });
  });

  it("classifies a Resend throttle as transient and preserves one idempotency key", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: {
          message: "provider detail must not escape",
          name: "rate_limit_exceeded",
          statusCode: 429,
        },
      })
      .mockResolvedValueOnce({
        data: { id: "provider-after-throttle" },
        error: null,
      });
    const provider = createResendEmailProvider(
      () => ({ emails: { send } }) as never
    );
    const delivery = new ReliableEmailDelivery({
      maxAttempts: 2,
      provider,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    await expect(delivery.deliver(request)).resolves.toMatchObject({
      attempts: 2,
      providerMessageId: "provider-after-throttle",
      state: "sent",
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenNthCalledWith(1, request.payload, {
      idempotencyKey: request.idempotencyKey,
    });
    expect(send).toHaveBeenNthCalledWith(2, request.payload, {
      idempotencyKey: request.idempotencyKey,
    });
  });

  it("bounds unknown provider unavailability and exposes no provider detail", async () => {
    const provider = createProvider();
    provider.send.mockRejectedValue(
      new Error("socket failed for buyer@example.test with secret payload")
    );
    const delivery = new ReliableEmailDelivery({
      maxAttempts: 2,
      provider,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    let failure: unknown;
    try {
      await delivery.deliver(request);
    } catch (error) {
      failure = error;
    }

    expect(failure).toMatchObject({
      attempts: 2,
      code: "provider_unavailable",
      retryable: true,
      state: "failed",
    });
    expect(String(failure)).not.toContain("buyer@example.test");
    expect(String(failure)).not.toContain("secret payload");
    expect(provider.send).toHaveBeenCalledTimes(2);
  });

  it("does not retry a permanent provider rejection", async () => {
    const provider = createProvider();
    provider.send.mockRejectedValue(
      new EmailProviderError({
        code: "invalid_from_address",
        retryable: false,
        statusCode: 422,
      })
    );
    const delivery = new ReliableEmailDelivery({ provider });

    await expect(delivery.deliver(request)).rejects.toMatchObject({
      attempts: 1,
      code: "provider_permanent",
      retryable: false,
      state: "failed",
    });
    expect(provider.send).toHaveBeenCalledOnce();
  });

  it("opens the circuit after bounded transient failures", async () => {
    const provider = createProvider();
    provider.send.mockRejectedValue(
      new EmailProviderError({
        code: "internal_server_error",
        retryable: true,
        statusCode: 503,
      })
    );
    const delivery = new ReliableEmailDelivery({
      circuitFailureThreshold: 2,
      circuitOpenMs: 30_000,
      maxAttempts: 1,
      now: () => 1000,
      provider,
    });

    await expect(delivery.deliver(request)).rejects.toBeInstanceOf(
      EmailDeliveryFailure
    );
    await expect(delivery.deliver(request)).rejects.toMatchObject({
      code: "provider_unavailable",
    });
    await expect(delivery.deliver(request)).rejects.toMatchObject({
      attempts: 0,
      code: "circuit_open",
    });
    expect(provider.send).toHaveBeenCalledTimes(2);
  });
});
