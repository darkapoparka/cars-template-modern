import { describe, expect, test } from "vitest";
import {
  assertKybCaseTransition,
  assertKybDocumentTransition,
  assertVerificationGrantTransition,
  isCurrentVerificationGrant,
  projectOrganizationVerification,
  providerResultToCaseStatus,
} from "./organization-verification";

describe("organization verification domain", () => {
  const now = new Date("2026-07-13T10:00:00.000Z");

  test("allows only explicit KYB transitions", () => {
    expect(() =>
      assertKybCaseTransition("draft", "awaiting_documents")
    ).not.toThrow();
    expect(() => assertKybCaseTransition("submitted", "approved")).toThrow(
      "Cannot transition KYB case"
    );
    expect(() =>
      assertKybCaseTransition("approved", "manual_review")
    ).toThrow();
  });

  test("never turns provider evidence into approval", () => {
    expect(providerResultToCaseStatus("passed")).toBe("manual_review");
    expect(providerResultToCaseStatus("failed")).toBe("manual_review");
    expect(providerResultToCaseStatus("unavailable")).toBe("manual_review");
  });

  test("keeps terminal grants immutable", () => {
    expect(() =>
      assertVerificationGrantTransition("active", "suspended")
    ).not.toThrow();
    expect(() =>
      assertVerificationGrantTransition("revoked", "active")
    ).toThrow();
  });

  test("blocks document purge under legal hold", () => {
    expect(() =>
      assertKybDocumentTransition("purge_pending", "purged", {
        legalHold: true,
      })
    ).toThrow("legal hold");
  });

  test("projects a current finite grant as verified", () => {
    expect(
      projectOrganizationVerification({
        currentGrant: {
          status: "active",
          validFrom: new Date("2026-07-01T00:00:00.000Z"),
          validUntil: new Date("2027-07-01T00:00:00.000Z"),
        },
        legalEntityComplete: true,
        now,
      })
    ).toMatchObject({
      kybStatus: "verified",
      onboardingStatus: "approved",
      verificationStatus: "verified",
    });
  });

  test("treats the exact validity boundary as expired", () => {
    const grant = {
      status: "active" as const,
      validFrom: new Date("2026-07-01T00:00:00.000Z"),
      validUntil: now,
    };
    expect(isCurrentVerificationGrant(grant, now)).toBe(false);
    expect(
      projectOrganizationVerification({
        currentGrant: grant,
        legalEntityComplete: true,
        now,
      }).kybStatus
    ).toBe("expired");
  });

  test("prioritizes administrative suspension over a current grant", () => {
    expect(
      projectOrganizationVerification({
        administrativeSuspension: true,
        currentGrant: {
          status: "active",
          validFrom: new Date("2026-07-01T00:00:00.000Z"),
          validUntil: new Date("2027-07-01T00:00:00.000Z"),
        },
        legalEntityComplete: true,
        now,
      })
    ).toMatchObject({
      kybStatus: "suspended",
      verificationStatus: "unverified",
    });
  });

  test("distinguishes incomplete, pending, review, and rejected states", () => {
    expect(
      projectOrganizationVerification({ legalEntityComplete: false, now })
        .onboardingStatus
    ).toBe("profile_incomplete");
    expect(
      projectOrganizationVerification({
        currentCaseStatus: "awaiting_documents",
        legalEntityComplete: true,
        now,
      }).kybStatus
    ).toBe("pending");
    expect(
      projectOrganizationVerification({
        currentCaseStatus: "manual_review",
        legalEntityComplete: true,
        now,
      }).kybStatus
    ).toBe("in_review");
    expect(
      projectOrganizationVerification({
        currentCaseStatus: "rejected",
        legalEntityComplete: true,
        now,
      }).verificationStatus
    ).toBe("rejected");
  });
});
