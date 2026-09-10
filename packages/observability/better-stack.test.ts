import { describe, expect, it } from "vitest";
import { isBetterStackLoggingConfigured } from "./better-stack";

describe("Better Stack logging configuration", () => {
  it("stays disabled for absent, blank, or partial configuration", () => {
    expect(isBetterStackLoggingConfigured({})).toBe(false);
    expect(
      isBetterStackLoggingConfigured({
        BETTER_STACK_INGESTING_URL: "   ",
        BETTER_STACK_SOURCE_TOKEN: "   ",
      })
    ).toBe(false);
    expect(
      isBetterStackLoggingConfigured({
        BETTER_STACK_SOURCE_TOKEN: "source-token",
      })
    ).toBe(false);
    expect(
      isBetterStackLoggingConfigured({
        BETTER_STACK_INGESTING_URL: "not-a-url",
        BETTER_STACK_SOURCE_TOKEN: "source-token",
      })
    ).toBe(false);
  });

  it("enables logging for a complete transport configuration", () => {
    expect(
      isBetterStackLoggingConfigured({
        BETTER_STACK_INGESTING_URL: "https://in.logs.betterstack.com",
        BETTER_STACK_SOURCE_TOKEN: "source-token",
      })
    ).toBe(true);
  });

  it("does not treat a browser custom endpoint as a server ingest transport", () => {
    expect(
      isBetterStackLoggingConfigured({
        NEXT_PUBLIC_BETTER_STACK_CUSTOM_ENDPOINT: "/api/telemetry",
      })
    ).toBe(false);
    expect(
      isBetterStackLoggingConfigured({
        NEXT_PUBLIC_BETTER_STACK_CUSTOM_ENDPOINT:
          "https://telemetry.example.com",
      })
    ).toBe(false);
  });

  it("rejects deprecated and browser-exposed transport credentials", () => {
    expect(
      isBetterStackLoggingConfigured({
        LOGTAIL_SOURCE_TOKEN: "legacy-token",
        LOGTAIL_URL: "https://in.logs.example",
      })
    ).toBe(false);
    expect(
      isBetterStackLoggingConfigured({
        NEXT_PUBLIC_BETTER_STACK_INGESTING_URL: "https://in.logs.example",
        NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: "public-token",
      })
    ).toBe(false);
  });

  it("does not confuse uptime status credentials with log ingest credentials", () => {
    expect(
      isBetterStackLoggingConfigured({
        BETTERSTACK_API_KEY: "status-api-key",
        BETTERSTACK_URL: "https://status.example.com",
      })
    ).toBe(false);
  });
});
