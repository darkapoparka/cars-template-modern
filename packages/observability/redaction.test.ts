import { describe, expect, it } from "vitest";
import {
  isSensitiveLogKey,
  redactLogValue,
  redactText,
  sanitizeTelemetryEvent,
} from "./redaction";

describe("observability redaction", () => {
  it("redacts secrets, credentials, and direct contact fields", () => {
    expect(
      redactLogValue({
        authorization: "Bearer abc.def",
        email: "buyer@example.com",
        eventType: "lead.created",
        nested: { phone: "+359 88 123 4567" },
      })
    ).toEqual({
      authorization: "[REDACTED]",
      email: "[REDACTED]",
      eventType: "lead.created",
      nested: { phone: "[REDACTED]" },
    });
  });

  it("sanitizes log-injection characters and inline identifiers", () => {
    expect(redactText("ok\r\nforged buyer@example.com Bearer token123")).toBe(
      "ok forged [REDACTED] Bearer [REDACTED]"
    );
  });

  it("recognizes common sensitive key variants", () => {
    expect(isSensitiveLogKey("database_url")).toBe(true);
    expect(isSensitiveLogKey("sessionToken")).toBe(true);
    expect(isSensitiveLogKey("eventType")).toBe(false);
  });

  it("redacts KYB evidence, legal identity, object keys, and signed URLs", () => {
    expect(
      redactLogValue({
        legalName: "Sensitive Legal Entity",
        providerPayload: { result: "raw" },
        registrationNumber: "123456",
        storageKey: "kyb/org/case/document",
        url: "https://private.example/object?signature=raw-secret",
        vatId: "BG123456",
      })
    ).toEqual({
      legalName: "[REDACTED]",
      providerPayload: "[REDACTED]",
      registrationNumber: "[REDACTED]",
      storageKey: "[REDACTED]",
      url: "https://private.example/object?signature=[REDACTED]",
      vatId: "[REDACTED]",
    });
  });

  it("redacts phone-like text", () => {
    expect(redactText("call +359 88 123 4567 now")).toBe("call [REDACTED] now");
  });

  it("redacts AWS and generic signed query parameters everywhere", () => {
    const signed =
      "https://private.example/object?X-Amz-Credential=raw-credential&X-Amz-Signature=raw-signature&X-Amz-Security-Token=raw-token&password=raw-password&secret=raw-secret";
    const expected =
      "https://private.example/object?X-Amz-Credential=[REDACTED]&X-Amz-Signature=[REDACTED]&X-Amz-Security-Token=[REDACTED]&password=[REDACTED]&secret=[REDACTED]";

    expect(redactText(signed)).toBe(expected);
    expect(redactText(`failed ${signed}`)).toBe(`failed ${expected}`);
    expect(redactLogValue(new Error(`failed ${signed}`))).toEqual({
      message: `failed ${expected}`,
      name: "Error",
    });
    expect(redactLogValue({ nested: { url: signed } })).toEqual({
      nested: { url: expected },
    });
    expect(redactText("password=raw secret=raw api-key=raw safe=value")).toBe(
      "password=[REDACTED] secret=[REDACTED] api-key=[REDACTED] safe=value"
    );
  });

  it("marks self-referential arrays without recursing forever", () => {
    const values: unknown[] = [];
    values.push(values);

    expect(redactLogValue(values)).toEqual([{ circular: "[REDACTED]" }]);
  });

  it("preserves Sentry stack-frame filenames without exposing other filenames", () => {
    const event = {
      contexts: { upload: { filename: "identity-document.jpg" } },
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: "webpack://_N_E/apps/app/app/dealer/leads/page.tsx",
                  lineno: 42,
                },
              ],
            },
          },
        ],
      },
    };

    expect(sanitizeTelemetryEvent(event)).toEqual({
      contexts: { upload: { filename: "[REDACTED]" } },
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: "webpack://_N_E/apps/app/app/dealer/leads/page.tsx",
                  lineno: 42,
                },
              ],
            },
          },
        ],
      },
    });
  });
});
