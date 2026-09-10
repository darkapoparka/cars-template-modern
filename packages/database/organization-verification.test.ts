import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  expireOrganizationVerificationGrant,
  getKybAdminReviewCase,
  KYB_APPROVAL_MAX_VALIDITY_DAYS,
  listKybAdminReviewQueue,
  recordKybReviewDecision,
  transitionOrganizationKybCase,
  transitionOrganizationVerificationGrant,
} from "./organization-verification";
import {
  issueTrustedKybAdminAuthorization,
  type TrustedKybAdminAuthorization,
} from "./trusted-admin";

describe("organization verification admin policy", () => {
  const now = new Date("2026-07-13T10:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const issueAuthorization = () =>
    issueTrustedKybAdminAuthorization(
      {
        adminRoleVerified: true,
        clerkUserId: "user_admin",
      },
      {
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
      } as never
    );

  test("rejects a caller-forged review capability before opening a transaction", async () => {
    const transaction = vi.fn();

    await expect(
      recordKybReviewDecision(
        {
          authorization: {
            accountId: "account_admin",
          } as TrustedKybAdminAuthorization,
          expectedCaseVersion: 1,
          kybCaseId: "case_123",
          outcome: "rejected",
          reasonCodes: ["document_invalid"],
          requestId: "request_123",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("authority is not trusted");
    expect(transaction).not.toHaveBeenCalled();
  });

  test("rechecks the durable admin account inside the review transaction", async () => {
    const authorization = await issueAuthorization();
    const transaction = vi.fn(async (callback) =>
      callback({
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      })
    );

    await expect(
      recordKybReviewDecision(
        {
          authorization,
          expectedCaseVersion: 1,
          kybCaseId: "case_123",
          outcome: "rejected",
          reasonCodes: ["document_invalid"],
          requestId: "request_123",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("admin account is no longer active");
  });

  test("requires outcome-compatible review reasons", async () => {
    const authorization = await issueAuthorization();
    const transaction = vi.fn();

    await expect(
      recordKybReviewDecision(
        {
          authorization,
          expectedCaseVersion: 1,
          kybCaseId: "case_123",
          outcome: "approved",
          reasonCodes: ["document_invalid"],
          requestId: "request_123",
          validityDays: 30,
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("does not satisfy policy");
    expect(transaction).not.toHaveBeenCalled();
  });

  test("bounds approval validity and forbids expiry on non-approvals", async () => {
    const authorization = await issueAuthorization();
    const transaction = vi.fn();
    const base = {
      authorization,
      expectedCaseVersion: 1,
      kybCaseId: "case_123",
      outcome: "approved" as const,
      reasonCodes: ["documents_accepted" as const],
      requestId: "request_123",
    };

    await expect(
      recordKybReviewDecision(base, { $transaction: transaction } as never)
    ).rejects.toThrow("does not satisfy policy");
    await expect(
      recordKybReviewDecision(
        {
          ...base,
          validityDays: (KYB_APPROVAL_MAX_VALIDITY_DAYS + 1) as never,
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("does not satisfy policy");
    await expect(
      recordKybReviewDecision(
        {
          ...base,
          outcome: "rejected",
          reasonCodes: ["document_invalid"],
          validityDays: 30,
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("does not satisfy policy");
    expect(transaction).not.toHaveBeenCalled();
  });

  test("requires a status-compatible admin grant reason", async () => {
    const authorization = await issueAuthorization();
    const transaction = vi.fn();

    await expect(
      transitionOrganizationVerificationGrant(
        {
          authorization,
          expectedKybCaseId: "case_123",
          expectedVersion: 1,
          grantId: "grant_123",
          nextStatus: "active",
          reasonCode: "fraud_confirmed",
          requestId: "request_123",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("reason violates policy");
    expect(transaction).not.toHaveBeenCalled();
  });

  test("rejects a runtime attempt by an organization member to record a review outcome", async () => {
    const transaction = vi.fn();

    await expect(
      transitionOrganizationKybCase(
        {
          actor: {
            accountId: "account_member",
            dealerOrgId: "dealer_123",
            role: "owner",
          },
          expectedVersion: 1,
          kybCaseId: "case_123",
          nextStatus: "approved",
          requestId: "request_123",
        } as never,
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("cannot record a review outcome");
    expect(transaction).not.toHaveBeenCalled();
  });

  test("prevents an admin from mutating their own organization grant", async () => {
    const authorization = await issueAuthorization();
    const transaction = vi.fn(async (callback) =>
      callback({
        dealerMember: {
          findFirst: vi.fn().mockResolvedValue({ id: "member_123" }),
        },
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
        organizationVerificationGrant: {
          findUnique: vi.fn().mockResolvedValue({
            dealerOrg: {
              currentVerificationGrantId: "grant_123",
              deletedAt: null,
              kybStatus: "verified",
            },
            dealerOrgId: "dealer_123",
            id: "grant_123",
            kybCaseId: "case_123",
            status: "active",
            validUntil: new Date("2026-08-13T10:00:00.000Z"),
            version: 1,
          }),
        },
        organizationVerificationEvent: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      })
    );

    await expect(
      transitionOrganizationVerificationGrant(
        {
          authorization,
          expectedKybCaseId: "case_123",
          expectedVersion: 1,
          grantId: "grant_123",
          nextStatus: "suspended",
          reasonCode: "compliance_review",
          requestId: "request_123",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("organization conflict");
  });

  test("does not reactivate a grant after its validity elapsed", async () => {
    const authorization = await issueAuthorization();
    const transaction = vi.fn(async (callback) =>
      callback({
        dealerMember: { findFirst: vi.fn().mockResolvedValue(null) },
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
        organizationVerificationGrant: {
          findUnique: vi.fn().mockResolvedValue({
            dealerOrg: {
              currentVerificationGrantId: "grant_123",
              deletedAt: null,
              kybStatus: "suspended",
            },
            dealerOrgId: "dealer_123",
            id: "grant_123",
            kybCaseId: "case_123",
            status: "suspended",
            validUntil: new Date("2026-07-13T09:59:59.999Z"),
            version: 1,
          }),
        },
        organizationVerificationEvent: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      })
    );

    await expect(
      transitionOrganizationVerificationGrant(
        {
          authorization,
          expectedKybCaseId: "case_123",
          expectedVersion: 1,
          grantId: "grant_123",
          nextStatus: "active",
          reasonCode: "review_cleared",
          requestId: "request_123",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("cannot be reactivated");
  });

  test("does not record a stale review decision for a deleted organization", async () => {
    const authorization = await issueAuthorization();
    const createDecision = vi.fn();
    const transaction = vi.fn(async (callback) =>
      callback({
        dealerMember: { findFirst: vi.fn().mockResolvedValue(null) },
        kybReviewDecision: {
          create: createDecision,
          findUnique: vi.fn().mockResolvedValue(null),
        },
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
        organizationKybCase: {
          findUnique: vi.fn().mockResolvedValue({
            dealerOrg: {
              currentKybCaseId: "case_123",
              deletedAt: new Date("2026-07-13T09:00:00.000Z"),
              kybStatus: "in_review",
            },
            id: "case_123",
            status: "manual_review",
            version: 1,
          }),
        },
      })
    );

    await expect(
      recordKybReviewDecision(
        {
          authorization,
          expectedCaseVersion: 1,
          kybCaseId: "case_123",
          outcome: "rejected",
          reasonCodes: ["document_invalid"],
          requestId: "request_123",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("not reviewable");
    expect(createDecision).not.toHaveBeenCalled();
  });

  test("reconciles an exact committed review replay", async () => {
    const authorization = await issueAuthorization();
    const findCase = vi.fn();
    const replay = {
      dealerOrg: {
        currentKybCaseId: "case_123",
        deletedAt: null,
        id: "dealer_123",
      },
      dealerOrgId: "dealer_123",
      id: "decision_123",
      kybCaseId: "case_123",
      outcome: "rejected",
      policyVersion: "m2-v1",
      reasonCodes: ["document_invalid"],
      reviewerAccountId: "account_admin",
      reviewerNote: null,
      verificationGrant: null,
    };
    const transaction = vi.fn(async (callback) =>
      callback({
        dealerMember: { findFirst: vi.fn().mockResolvedValue(null) },
        kybReviewDecision: {
          findUnique: vi.fn().mockResolvedValue(replay),
        },
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
        organizationKybCase: { findUnique: findCase },
      })
    );

    await expect(
      recordKybReviewDecision(
        {
          authorization,
          expectedCaseVersion: 1,
          kybCaseId: "case_123",
          outcome: "rejected",
          reasonCodes: ["document_invalid"],
          requestId: "stable_request_123",
        },
        { $transaction: transaction } as never
      )
    ).resolves.toMatchObject({ duplicate: true, verificationGrantId: null });
    expect(findCase).not.toHaveBeenCalled();
  });

  test.each([
    ["a different case", "case_other", null, "grant_123"],
    [
      "a deleted organization",
      "case_123",
      new Date("2026-07-13T09:00:00.000Z"),
      "grant_123",
    ],
    ["a non-current grant", "case_123", null, "grant_other"],
  ])("does not mutate a grant bound to %s", async (_label, actualCaseId, deletedAt, currentGrantId) => {
    const authorization = await issueAuthorization();
    const updateGrant = vi.fn();
    const transaction = vi.fn(async (callback) =>
      callback({
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
        organizationVerificationGrant: {
          findUnique: vi.fn().mockResolvedValue({
            dealerOrg: {
              currentVerificationGrantId: currentGrantId,
              deletedAt,
              kybStatus: "verified",
            },
            dealerOrgId: "dealer_123",
            id: "grant_123",
            kybCaseId: actualCaseId,
            status: "active",
            validUntil: new Date("2026-08-13T10:00:00.000Z"),
            version: 1,
          }),
          update: updateGrant,
        },
      })
    );

    await expect(
      transitionOrganizationVerificationGrant(
        {
          authorization,
          expectedKybCaseId: "case_123",
          expectedVersion: 1,
          grantId: "grant_123",
          nextStatus: "suspended",
          reasonCode: "compliance_review",
          requestId: "request_123",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("changed or was not found");
    expect(updateGrant).not.toHaveBeenCalled();
  });

  test("reconciles an exact committed grant transition replay", async () => {
    const authorization = await issueAuthorization();
    const grant = {
      dealerOrg: {
        currentVerificationGrantId: "grant_123",
        deletedAt: null,
        kybStatus: "suspended",
      },
      dealerOrgId: "dealer_123",
      id: "grant_123",
      kybCaseId: "case_123",
      status: "suspended",
      terminalReasonCode: "compliance_review",
      validUntil: new Date("2026-08-13T10:00:00.000Z"),
      version: 2,
    };
    const transaction = vi.fn(async (callback) =>
      callback({
        dealerMember: { findFirst: vi.fn().mockResolvedValue(null) },
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
        organizationVerificationEvent: {
          findUnique: vi.fn().mockResolvedValue({
            actorAccountId: "account_admin",
            actorType: "admin",
            eventType: "grant_suspended",
            kybCaseId: "case_123",
            reasonCodes: ["compliance_review"],
            verificationGrantId: "grant_123",
          }),
        },
        organizationVerificationGrant: {
          findUnique: vi.fn().mockResolvedValue(grant),
        },
      })
    );

    await expect(
      transitionOrganizationVerificationGrant(
        {
          authorization,
          expectedKybCaseId: "case_123",
          expectedVersion: 1,
          grantId: "grant_123",
          nextStatus: "suspended",
          reasonCode: "compliance_review",
          requestId: "stable_request_123",
        },
        { $transaction: transaction } as never
      )
    ).resolves.toBe(grant);
  });

  test("system expiry fails closed until the grant validity has elapsed", async () => {
    const transaction = vi.fn(async (callback) =>
      callback({
        organizationVerificationGrant: {
          findUnique: vi.fn().mockResolvedValue({
            dealerOrg: { kybStatus: "verified" },
            id: "grant_123",
            status: "active",
            validUntil: new Date("2026-07-13T10:00:00.001Z"),
            version: 1,
          }),
        },
      })
    );

    await expect(
      expireOrganizationVerificationGrant(
        {
          expectedVersion: 1,
          grantId: "grant_123",
          requestId: "request_123",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("not due for system expiry");
  });

  test("rechecks active admin authority and excludes own organizations from the queue", async () => {
    const authorization = await issueAuthorization();
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const transaction = vi.fn(async (callback) =>
      callback({
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
        organizationKybCase: { count, findMany },
      })
    );

    await expect(
      listKybAdminReviewQueue({ authorization, limit: 500 }, {
        $transaction: transaction,
      } as never)
    ).resolves.toEqual({ cases: [], total: 0 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
        where: {
          dealerOrg: {
            deletedAt: null,
            members: {
              none: { accountId: "account_admin", status: "active" },
            },
          },
          status: "manual_review",
        },
      })
    );
    expect(count).toHaveBeenCalledWith({
      where: {
        dealerOrg: {
          deletedAt: null,
          members: {
            none: { accountId: "account_admin", status: "active" },
          },
        },
        status: "manual_review",
      },
    });
  });

  test("returns only metadata-safe document fields to the admin detail read", async () => {
    const authorization = await issueAuthorization();
    const findFirst = vi.fn().mockResolvedValue(null);
    const transaction = vi.fn(async (callback) =>
      callback({
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_admin" }),
        },
        organizationKybCase: { findFirst },
      })
    );

    await expect(
      getKybAdminReviewCase({ authorization, kybCaseId: "case_123" }, {
        $transaction: transaction,
      } as never)
    ).resolves.toBeNull();
    const query = findFirst.mock.calls[0]?.[0];
    expect(query.where).toMatchObject({
      dealerOrg: {
        members: {
          none: { accountId: "account_admin", status: "active" },
        },
      },
      id: "case_123",
      status: {
        in: ["approved", "manual_review", "needs_information", "rejected"],
      },
      submittedAt: { not: null },
    });
    expect(query.select.documents.select).toMatchObject({
      id: true,
      kind: true,
      mimeType: true,
      status: true,
      verifiedByteSize: true,
    });
    expect(query.select.documents.select).not.toHaveProperty("storageKey");
    expect(query.select.documents.select).not.toHaveProperty("sha256");
    expect(query.select.documents.select).not.toHaveProperty(
      "encryptionKeyVersion"
    );
  });
});
