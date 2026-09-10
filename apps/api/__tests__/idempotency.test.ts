import {
  type IdempotencyBackend,
  IdempotencyStore,
} from "@repo/rate-limit/idempotency";
import { verifyBearerSecret } from "@repo/security/request-auth";
import { describe, expect, test, vi } from "vitest";
import { processIdempotentWebhook } from "../lib/idempotent-webhook";

const createMemoryBackend = (): IdempotencyBackend => {
  const values = new Map<string, string>();

  return {
    compareAndComplete: (key, processingValue, completedValue) => {
      if (values.get(key) !== processingValue) {
        return Promise.resolve(false);
      }

      values.set(key, completedValue);
      return Promise.resolve(true);
    },
    compareAndDelete: (key, processingValue) => {
      if (values.get(key) === processingValue) {
        values.delete(key);
      }

      return Promise.resolve();
    },
    get: (key) => Promise.resolve(values.get(key) ?? null),
    setIfAbsent: (key, value) => {
      if (values.has(key)) {
        return Promise.resolve(false);
      }

      values.set(key, value);
      return Promise.resolve(true);
    },
  };
};

describe("request security", () => {
  test("verifies bearer credentials without direct string comparison", () => {
    expect(verifyBearerSecret("Bearer correct", "correct")).toBe("authorized");
    expect(verifyBearerSecret("Bearer wrong", "correct")).toBe("invalid");
    expect(verifyBearerSecret(null, "correct")).toBe("invalid");
    expect(verifyBearerSecret("Bearer value", undefined)).toBe(
      "not_configured"
    );
  });

  test("processes a replayed webhook once", async () => {
    const store = new IdempotencyStore(createMemoryBackend());
    const mutation = vi.fn(async () => undefined);
    const options = {
      eventId: "evt_1",
      payloadHash: "a".repeat(64),
      process: mutation,
      scope: "stripe",
      store,
    };

    await expect(processIdempotentWebhook(options)).resolves.toBe("processed");
    await expect(processIdempotentWebhook(options)).resolves.toBe("duplicate");
    expect(mutation).toHaveBeenCalledTimes(1);
  });

  test("releases a failed claim so the provider can retry", async () => {
    const store = new IdempotencyStore(createMemoryBackend());
    const failedMutation = vi.fn(() =>
      Promise.reject(new Error("temporary failure"))
    );

    await expect(
      processIdempotentWebhook({
        eventId: "evt_retry",
        payloadHash: "b".repeat(64),
        process: failedMutation,
        scope: "clerk",
        store,
      })
    ).rejects.toThrow("temporary failure");

    await expect(
      processIdempotentWebhook({
        eventId: "evt_retry",
        payloadHash: "b".repeat(64),
        process: async () => undefined,
        scope: "clerk",
        store,
      })
    ).resolves.toBe("processed");
  });

  test("rejects a conflicting replay payload for the same event id", async () => {
    const store = new IdempotencyStore(createMemoryBackend());
    await expect(
      processIdempotentWebhook({
        eventId: "evt_conflict",
        payloadHash: "c".repeat(64),
        process: async () => undefined,
        scope: "kyb",
        store,
      })
    ).resolves.toBe("processed");

    await expect(
      processIdempotentWebhook({
        eventId: "evt_conflict",
        payloadHash: "d".repeat(64),
        process: async () => undefined,
        scope: "kyb",
        store,
      })
    ).resolves.toBe("conflict");
  });

  test("rejects a conflicting payload while the original event is in progress", async () => {
    const store = new IdempotencyStore(createMemoryBackend());
    let releaseOriginal!: () => void;
    const originalGate = new Promise<void>((resolve) => {
      releaseOriginal = resolve;
    });
    const original = processIdempotentWebhook({
      eventId: "evt_in_progress_conflict",
      payloadHash: "e".repeat(64),
      process: () => originalGate,
      scope: "kyb",
      store,
    });
    await Promise.resolve();

    await expect(
      processIdempotentWebhook({
        eventId: "evt_in_progress_conflict",
        payloadHash: "f".repeat(64),
        process: async () => undefined,
        scope: "kyb",
        store,
      })
    ).resolves.toBe("conflict");

    releaseOriginal();
    await expect(original).resolves.toBe("processed");
  });
});
