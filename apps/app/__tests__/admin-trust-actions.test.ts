import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const grantRequestIdPattern = /^kyb-admin-grant:[a-f0-9]{64}$/;
const reviewRequestIdPattern = /^kyb-admin-review:[a-f0-9]{64}$/;

const mocks = vi.hoisted(() => ({
  Conflict: class extends Error {},
  recordDecision: vi.fn(),
  redirect: vi.fn(),
  requireAuthorization: vi.fn(),
  revalidatePath: vi.fn(),
  transitionGrant: vi.fn(),
}));

vi.mock("@repo/database/organization-verification", () => ({
  KYB_GRANT_ADMIN_REASON_CODES: [
    "compliance_review",
    "legal_hold",
    "risk_change",
    "review_cleared",
    "authorization_revoked",
    "fraud_confirmed",
    "organization_closed",
  ],
  KYB_REVIEW_REASON_CODES: [
    "documents_accepted",
    "identity_confirmed",
    "registry_match",
    "low_risk",
    "additional_documents_required",
    "document_unreadable",
    "evidence_inconsistent",
    "identity_mismatch",
    "registry_mismatch",
    "document_invalid",
    "organization_unverifiable",
    "policy_violation",
  ],
  OrganizationVerificationConflictError: mocks.Conflict,
  recordKybReviewDecision: mocks.recordDecision,
  transitionOrganizationVerificationGrant: mocks.transitionGrant,
}));
vi.mock("../app/(authenticated)/admin/trust/authorization", () => ({
  requireKybAdminAuthorization: mocks.requireAuthorization,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  recordKybReviewDecisionAction,
  transitionKybVerificationGrantAction,
} from "../app/(authenticated)/admin/trust/actions";

const authorization = { accountId: "account_admin" };

describe("admin trust actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T10:00:00.000Z"));
    vi.clearAllMocks();
    mocks.requireAuthorization.mockResolvedValue(authorization);
    mocks.recordDecision.mockResolvedValue({});
    mocks.transitionGrant.mockResolvedValue({});
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const validReviewForm = () => {
    const form = new FormData();
    form.set("confirmDecision", "on");
    form.set("expectedCaseVersion", "3");
    form.set("kybCaseId", "case_123456");
    form.set("outcome", "approved");
    form.set("reasonCode", "documents_accepted");
    form.set("reviewerNote", "Evidence and registry data are consistent.");
    form.set("validityDays", "365");
    return form;
  };

  test("records a bounded decision with only branded server authority", async () => {
    const form = validReviewForm();
    form.set("reviewerAccountId", "account_forged");
    form.set("actorType", "system");
    form.set("validUntil", "2099-01-01T00:00:00.000Z");

    await expect(recordKybReviewDecisionAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/trust/case_123456?state=decision_approved"
    );
    expect(mocks.requireAuthorization).toHaveBeenCalledTimes(1);
    expect(mocks.recordDecision).toHaveBeenCalledWith({
      authorization,
      expectedCaseVersion: 3,
      kybCaseId: "case_123456",
      outcome: "approved",
      reasonCodes: ["documents_accepted"],
      requestId: expect.stringMatching(reviewRequestIdPattern),
      reviewerNote: "Evidence and registry data are consistent.",
      validityDays: 365,
    });
    expect(mocks.recordDecision.mock.calls[0]?.[0]).not.toHaveProperty(
      "reviewerAccountId"
    );
    expect(mocks.recordDecision.mock.calls[0]?.[0]).not.toHaveProperty(
      "actorType"
    );
  });

  test.each([
    ["missing confirmation", { confirmDecision: null }],
    ["incompatible reason", { reasonCode: "document_invalid" }],
    ["caller validity", { validityDays: "90", outcome: "rejected" }],
    ["unbounded validity", { validityDays: "9999" }],
  ])("rejects %s before the decision helper", async (_label, changes) => {
    const form = validReviewForm();
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) {
        form.delete(key);
      } else {
        form.set(key, value);
      }
    }

    await expect(recordKybReviewDecisionAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/trust?state=invalid_request"
    );
    expect(mocks.requireAuthorization).toHaveBeenCalledTimes(1);
    expect(mocks.recordDecision).not.toHaveBeenCalled();
  });

  test("reports a durable decision conflict without claiming success", async () => {
    mocks.recordDecision.mockRejectedValueOnce(new mocks.Conflict("changed"));
    await expect(
      recordKybReviewDecisionAction(validReviewForm())
    ).rejects.toThrow(
      "NEXT_REDIRECT:/admin/trust/case_123456?state=decision_conflict"
    );
    expect(mocks.redirect).not.toHaveBeenCalledWith(
      "/admin/trust/case_123456?state=decision_approved"
    );
  });

  test("uses the same server-derived request identity for an exact form replay", async () => {
    const form = validReviewForm();

    await expect(recordKybReviewDecisionAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    await expect(recordKybReviewDecisionAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mocks.recordDecision).toHaveBeenCalledTimes(2);
    expect(mocks.recordDecision.mock.calls[0]?.[0]?.requestId).toBe(
      mocks.recordDecision.mock.calls[1]?.[0]?.requestId
    );
  });

  test("rejects an incompatible grant reason before mutation", async () => {
    const form = new FormData();
    form.set("confirmDecision", "on");
    form.set("expectedVersion", "2");
    form.set("grantId", "grant_123456");
    form.set("kybCaseId", "case_123456");
    form.set("nextStatus", "active");
    form.set("reasonCode", "fraud_confirmed");

    await expect(transitionKybVerificationGrantAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/trust?state=invalid_request"
    );
    expect(mocks.transitionGrant).not.toHaveBeenCalled();
  });

  test("passes a valid grant transition through branded authority", async () => {
    const form = new FormData();
    form.set("confirmDecision", "on");
    form.set("expectedVersion", "2");
    form.set("grantId", "grant_123456");
    form.set("kybCaseId", "case_123456");
    form.set("nextStatus", "suspended");
    form.set("reasonCode", "compliance_review");

    await expect(transitionKybVerificationGrantAction(form)).rejects.toThrow(
      "NEXT_REDIRECT:/admin/trust/case_123456?state=grant_updated"
    );
    expect(mocks.transitionGrant).toHaveBeenCalledWith({
      authorization,
      expectedKybCaseId: "case_123456",
      expectedVersion: 2,
      grantId: "grant_123456",
      nextStatus: "suspended",
      reasonCode: "compliance_review",
      requestId: expect.stringMatching(grantRequestIdPattern),
    });
  });
});
