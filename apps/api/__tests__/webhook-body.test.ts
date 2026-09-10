import { describe, expect, it } from "vitest";
import {
  readBoundedWebhookBody,
  WebhookPayloadTooLargeError,
} from "../lib/webhook-body";

describe("bounded webhook bodies", () => {
  it("rejects a declared oversized body before buffering it", async () => {
    const request = new Request("https://api.example/webhooks/auth", {
      body: "small",
      headers: { "content-length": "101" },
      method: "POST",
    });

    await expect(readBoundedWebhookBody(request, 100)).rejects.toBeInstanceOf(
      WebhookPayloadTooLargeError
    );
  });

  it("enforces the streamed-byte limit and decodes valid UTF-8", async () => {
    const valid = new Request("https://api.example/webhooks/auth", {
      body: "signed payload",
      method: "POST",
    });
    await expect(readBoundedWebhookBody(valid, 32)).resolves.toBe(
      "signed payload"
    );

    const oversized = new Request("https://api.example/webhooks/auth", {
      body: "payload exceeds limit",
      method: "POST",
    });
    await expect(readBoundedWebhookBody(oversized, 4)).rejects.toBeInstanceOf(
      WebhookPayloadTooLargeError
    );
  });
});
