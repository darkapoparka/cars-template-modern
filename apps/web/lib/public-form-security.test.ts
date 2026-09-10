import { describe, expect, it } from "vitest";
import {
  getPublicRequestContext,
  inspectPublicFormData,
} from "./public-form-security";

const sha256Pattern = /^[a-f0-9]{64}$/;

describe("public form security", () => {
  it("accepts a same-origin request and fingerprints its normalized client IP", () => {
    const first = getPublicRequestContext(
      new Headers({
        host: "market.example.test",
        origin: "https://market.example.test",
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      })
    );
    const second = getPublicRequestContext(
      new Headers({
        host: "market.example.test",
        origin: "https://market.example.test",
        "x-forwarded-for": "203.0.113.10",
      })
    );

    expect(first.sameOrigin).toBe(true);
    expect(first.ipKey).toMatch(sha256Pattern);
    expect(first.ipKey).toBe(second.ipKey);
  });

  it("rejects unknown origins, duplicate fields, files, and aggregate overflow", () => {
    expect(
      getPublicRequestContext(
        new Headers({
          host: "market.example.test",
          origin: "https://attacker.example.test",
        })
      ).sameOrigin
    ).toBe(false);

    const duplicate = new FormData();
    duplicate.append("message", "first");
    duplicate.append("message", "second");
    expect(
      inspectPublicFormData(duplicate, {
        allowedFields: new Set(["message"]),
        maxBytes: 1024,
      })
    ).toBe(false);

    const file = new FormData();
    file.set("message", new File(["body"], "message.txt"));
    expect(
      inspectPublicFormData(file, {
        allowedFields: new Set(["message"]),
        maxBytes: 1024,
      })
    ).toBe(false);

    const oversizedActionMetadata = new FormData();
    oversizedActionMetadata.set("$ACTION_ID_test", "x".repeat(1024));
    oversizedActionMetadata.set("message", "body");
    expect(
      inspectPublicFormData(oversizedActionMetadata, {
        allowedFields: new Set(["message"]),
        maxBytes: 128,
      })
    ).toBe(false);
  });

  it("allows bounded framework action metadata without weakening the field allowlist", () => {
    const valid = new FormData();
    valid.set("$ACTION_ID_test", "");
    valid.set("message", "body");
    expect(
      inspectPublicFormData(valid, {
        allowedFields: new Set(["message"]),
        maxBytes: 128,
      })
    ).toBe(true);

    valid.set("recipient", "attacker@example.test");
    expect(
      inspectPublicFormData(valid, {
        allowedFields: new Set(["message"]),
        maxBytes: 128,
      })
    ).toBe(false);
  });
});
