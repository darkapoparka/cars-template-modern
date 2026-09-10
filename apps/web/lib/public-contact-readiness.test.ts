import { describe, expect, it } from "vitest";
import { isPublicContactSubmissionAvailable } from "./public-contact-readiness";

const deliveryProvider = {
  resendFrom: "hello@daynightautogroup.bg",
  resendToken: "re_test_token",
};

describe("public contact readiness", () => {
  it("does not advertise a form without a complete delivery provider", () => {
    expect(isPublicContactSubmissionAvailable({ nodeEnv: "development" })).toBe(
      false
    );
    expect(
      isPublicContactSubmissionAvailable({
        nodeEnv: "development",
        resendToken: deliveryProvider.resendToken,
      })
    ).toBe(false);
  });

  it("keeps provider-backed development and test forms usable locally", () => {
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        nodeEnv: "development",
      })
    ).toBe(true);
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        nodeEnv: "test",
      })
    ).toBe(true);
  });

  it("requires distributed abuse protection in production", () => {
    expect(isPublicContactSubmissionAvailable(deliveryProvider)).toBe(false);
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        nodeEnv: "production",
      })
    ).toBe(false);
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        nodeEnv: "production",
        redisToken: "redis-token-value",
        redisUrl: "https://redis.daynightautogroup.bg",
      })
    ).toBe(true);
  });

  it("rejects optimistic provider and Redis shapes", () => {
    expect(
      isPublicContactSubmissionAvailable({
        nodeEnv: "production",
        redisToken: "redis-token-value",
        redisUrl: "https://redis.daynightautogroup.bg/path",
        resendFrom: "Day & Night<hello@daynightautogroup.bg>",
        resendToken: "wrong-token-value",
      })
    ).toBe(false);
  });

  it.each([
    "preview@example.com",
    "preview@mail.example.com",
    "preview@example.net",
    "preview@example.org",
    "preview@day-night.example",
    "preview@day-night.invalid",
    "preview@day-night.localhost",
    "preview@day-night.test",
  ])("rejects a reserved or example sender domain: %s", (resendFrom) => {
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        nodeEnv: "development",
        resendFrom,
      })
    ).toBe(false);
  });

  it("keeps display-name syntax isolated from runtime readiness", () => {
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        nodeEnv: "development",
        resendFrom: "Day & Night Preview <hello@daynightautogroup.bg>",
      })
    ).toBe(false);
  });

  it.each([
    "https://redis.example.test",
    "https://127.0.0.2",
    "https://redis.daynightautogroup.bg.",
  ])("rejects a non-deployable Redis origin: %s", (redisUrl) => {
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        nodeEnv: "production",
        redisToken: "redis-token-value",
        redisUrl,
      })
    ).toBe(false);
  });

  it.each([
    { resendFrom: " hello@daynightautogroup.bg" },
    { resendFrom: "hello@daynightautogroup.bg " },
    { resendToken: " re_test_token" },
    { resendToken: "re_test_token " },
  ])("rejects surrounding provider whitespace without normalization: $resendFrom$resendToken", (override) => {
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        ...override,
        nodeEnv: "development",
      })
    ).toBe(false);
  });

  it("rejects surrounding Redis secret whitespace", () => {
    expect(
      isPublicContactSubmissionAvailable({
        ...deliveryProvider,
        nodeEnv: "production",
        redisToken: " redis-token-value ",
        redisUrl: "https://redis.daynightautogroup.bg",
      })
    ).toBe(false);
  });
});
