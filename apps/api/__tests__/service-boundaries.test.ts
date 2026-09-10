import { createHmac } from "node:crypto";
import { describe, expect, test } from "vitest";
import {
  authorizeServiceRequest,
  boundedLimit,
  serviceJson,
} from "../lib/service-auth";
import { readSignedCallback } from "../lib/signed-callback";

const SECRET = "callback-secret-with-at-least-thirty-two-bytes";

const signedRequest = (
  body: string,
  overrides: Record<string, string> = {}
) => {
  const eventId = "evt_123";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", SECRET)
    .update(`${timestamp}.${eventId}.${body}`)
    .digest("hex");
  return new Request("https://api.example/callback", {
    body,
    headers: {
      "x-automarket-event-id": eventId,
      "x-automarket-signature": `sha256=${signature}`,
      "x-automarket-timestamp": timestamp,
      ...overrides,
    },
    method: "POST",
  });
};

describe("service and callback boundaries", () => {
  test("authorizes service bearer tokens without caching", () => {
    const request = new Request("https://api.example/cron", {
      headers: { authorization: "Bearer cron-secret-0123456789" },
    });
    expect(
      authorizeServiceRequest(request, "cron-secret-0123456789")
    ).toBeNull();
  });

  test("fails closed when service auth is unconfigured", () => {
    const response = authorizeServiceRequest(
      new Request("https://api.example/cron"),
      undefined
    );
    expect(response?.status).toBe(503);
    expect(response?.headers.get("cache-control")).toBe("no-store");
  });

  test("bounds caller-selected work", () => {
    expect(boundedLimit("999", 25, 100)).toBe(100);
    expect(boundedLimit("invalid", 25, 100)).toBe(25);
  });

  test("does not let a caller override the no-store service policy", () => {
    const response = serviceJson({ ok: true }, 200, {
      "Cache-Control": "public, max-age=3600",
    });

    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("accepts a valid signed bounded callback", async () => {
    const result = await readSignedCallback(
      signedRequest('{"ok":true}'),
      SECRET
    );
    expect(result).toMatchObject({ ok: true, eventId: "evt_123" });
  });

  test("rejects a bad signature without reflecting the body", async () => {
    const result = await readSignedCallback(
      signedRequest('{"secret":"do-not-leak"}', {
        "x-automarket-signature": `sha256=${"0".repeat(64)}`,
      }),
      SECRET
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      expect(await result.response.text()).not.toContain("do-not-leak");
    }
  });

  test("rejects stale signed callbacks", async () => {
    const result = await readSignedCallback(
      signedRequest("{}", { "x-automarket-timestamp": "1" }),
      SECRET
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });
});
