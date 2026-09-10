import { describe, expect, it } from "vitest";
import {
  hasRoutablePublicListingLeadDestination,
  isPublicListingLeadSubmissionAvailable,
} from "./public-listing-contact";

describe("public listing contact readiness", () => {
  it("advertises seller contact only for a durable dealer-owned inbox", () => {
    expect(
      hasRoutablePublicListingLeadDestination({ dealerOrgId: "dealer-org-1" })
    ).toBe(true);
    expect(hasRoutablePublicListingLeadDestination({ dealerOrgId: null })).toBe(
      false
    );
    expect(hasRoutablePublicListingLeadDestination({})).toBe(false);
  });

  it("does not advertise a form backed only by demo inventory", () => {
    expect(
      isPublicListingLeadSubmissionAvailable({ nodeEnv: "development" })
    ).toBe(false);
  });

  it("allows database-backed local submissions without distributed limiting", () => {
    expect(
      isPublicListingLeadSubmissionAvailable({
        databaseUrl: "postgres://configured",
        nodeEnv: "development",
        publicDataMode: "database",
      })
    ).toBe(true);
  });

  it("requires both persistence and fail-closed rate limiting in production", () => {
    expect(
      isPublicListingLeadSubmissionAvailable({
        databaseUrl: "postgres://configured",
        nodeEnv: "production",
      })
    ).toBe(false);
    expect(
      isPublicListingLeadSubmissionAvailable({
        databaseUrl: "postgres://configured",
        nodeEnv: "production",
        redisToken: "token",
        redisUrl: "https://redis.example.test",
      })
    ).toBe(true);
  });

  it("does not accept skip-validation demo mode as persistence-ready", () => {
    expect(
      isPublicListingLeadSubmissionAvailable({
        databaseUrl: "postgres://configured",
        nodeEnv: "development",
        skipEnvValidation: "true",
      })
    ).toBe(false);
  });
});
