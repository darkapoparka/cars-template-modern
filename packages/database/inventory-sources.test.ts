import { describe, expect, test } from "vitest";
import {
  assertCredentialReference,
  assertSafeInventorySourceConfig,
} from "./inventory-sources";

describe("inventory source boundary", () => {
  test("accepts typed non-secret configuration", () => {
    expect(() =>
      assertSafeInventorySourceConfig({
        delimiter: ";",
        expectedTimeZone: "Europe/Sofia",
        mode: "full_snapshot",
      })
    ).not.toThrow();
  });

  test.each([
    { apiKey: "plaintext" },
    { nested: { bearerToken: "plaintext" } },
    { password: "plaintext" },
    { private_key: "plaintext" },
  ])("rejects secret-shaped config keys", (config) => {
    expect(() => assertSafeInventorySourceConfig(config)).toThrow(
      "Secret material"
    );
  });

  test("allows only opaque credential references", () => {
    expect(() =>
      assertCredentialReference("inventory:token:source_123:v2")
    ).not.toThrow();
    expect(() =>
      assertCredentialReference("env:AUTOMARKET_INVENTORY_SOURCE_123")
    ).not.toThrow();
    expect(() => assertCredentialReference("my-secret-value")).toThrow(
      "allowed namespaces"
    );
  });
});
