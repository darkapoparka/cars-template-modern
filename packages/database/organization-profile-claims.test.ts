import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  readAdmin: vi.fn(),
}));

vi.mock("./trusted-directory-admin", () => ({
  readTrustedDirectoryAdminAuthorization: mocks.readAdmin,
}));

import {
  OrganizationProfileClaimAuthorizationError,
  OrganizationProfileClaimConflictError,
  OrganizationProfileClaimInputError,
  reviewOrganizationProfileClaim,
  submitOrganizationProfileClaim,
} from "./organization-profile-claims";

const actor = {
  accountId: "account_owner",
  dealerOrgId: "dealer_org_1",
  role: "owner",
} as const;

const submitInput = {
  actor,
  authorityRole: "Управител",
  businessEmail: "OWNER@DEALER.BG",
  directorySlug: "dealer-profile",
  evidenceKind: "business_email" as const,
  evidenceSummary:
    "Управител съм на дружеството и служебният домейн е публикуван на сайта.",
  evidenceUrl: "https://dealer.bg/contact",
  requestKey: "claim-request-1",
};

const createSubmitClient = () => {
  const tx = {
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    dealerMember: { findFirst: vi.fn().mockResolvedValue({ id: "member_1" }) },
    organizationDirectoryClaimRequest: {
      create: vi.fn().mockResolvedValue({
        applicantAccountId: actor.accountId,
        claimantDealerOrgId: actor.dealerOrgId,
        id: "claim_1",
        status: "pending",
      }),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    organizationDirectoryEntry: {
      findFirst: vi.fn().mockResolvedValue({
        claimStatus: "unclaimed",
        dealerOrgId: null,
        id: "directory_1",
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const client = {
    $transaction: vi.fn((operation: (transaction: typeof tx) => unknown) =>
      operation(tx)
    ),
  };
  return { client, tx };
};

describe("organization profile claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readAdmin.mockReturnValue({ accountId: "admin_1" });
  });

  it("records private ownership evidence and only projects a pending claim", async () => {
    const { client, tx } = createSubmitClient();

    await submitOrganizationProfileClaim(submitInput, client as never);

    expect(tx.organizationDirectoryEntry.findFirst).toHaveBeenCalledWith({
      select: { claimStatus: true, dealerOrgId: true, id: true },
      where: {
        orgType: { in: ["dealer", "importer"] },
        slug: "dealer-profile",
        status: "published",
      },
    });
    expect(tx.dealerMember.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: expect.objectContaining({
        account: { deletedAt: null, status: "active" },
        dealerOrg: {
          deletedAt: null,
          orgType: { in: ["dealer", "importer"] },
        },
      }),
    });

    expect(tx.organizationDirectoryClaimRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicantAccountId: actor.accountId,
        authorityRole: "Управител",
        businessEmail: "owner@dealer.bg",
        claimantDealerOrgId: actor.dealerOrgId,
        directoryEntryId: "directory_1",
        evidenceKind: "business_email",
      }),
    });
    expect(tx.organizationDirectoryEntry.updateMany).toHaveBeenCalledWith({
      data: { claimStatus: "pending" },
      where: {
        claimStatus: "unclaimed",
        dealerOrgId: null,
        id: "directory_1",
      },
    });
    expect(tx.organizationDirectoryEntry.updateMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          verificationStatus: expect.anything(),
        }),
      })
    );
  });

  it("rejects sales members before creating a claim", async () => {
    const { client, tx } = createSubmitClient();

    await expect(
      submitOrganizationProfileClaim(
        { ...submitInput, actor: { ...actor, role: "sales" } },
        client as never
      )
    ).rejects.toBeInstanceOf(OrganizationProfileClaimAuthorizationError);
    expect(tx.organizationDirectoryClaimRequest.create).not.toHaveBeenCalled();
  });

  it("rejects non-HTTP ownership evidence before opening a transaction", async () => {
    const { client } = createSubmitClient();

    await expect(
      submitOrganizationProfileClaim(
        { ...submitInput, evidenceUrl: "ftp://dealer.bg/private-record" },
        client as never
      )
    ).rejects.toBeInstanceOf(OrganizationProfileClaimInputError);
    expect(client.$transaction).not.toHaveBeenCalled();
  });

  it("approves ownership atomically without changing KYB or verification", async () => {
    const claim = {
      claimantDealerOrg: { deletedAt: null },
      claimantDealerOrgId: "dealer_org_1",
      directoryEntryId: "directory_1",
      id: "claim_1",
      status: "in_review",
      version: 2,
    };
    const tx = {
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      dealerMember: {
        findFirst: vi.fn().mockResolvedValue({ id: "member_1" }),
      },
      organizationDirectoryClaimRequest: {
        findFirst: vi.fn().mockResolvedValue(claim),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          ...claim,
          status: "approved",
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      organizationDirectoryEntry: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const client = {
      $transaction: vi.fn((operation: (transaction: typeof tx) => unknown) =>
        operation(tx)
      ),
    };

    await reviewOrganizationProfileClaim(
      {
        action: "approve",
        authorization: {} as never,
        claimId: "claim_1",
        expectedVersion: 2,
        requestId: "review-request-1",
        reviewReasonCode: "ownership_evidence_confirmed",
      },
      client as never
    );

    expect(tx.organizationDirectoryEntry.updateMany).toHaveBeenCalledWith({
      data: {
        claimStatus: "claimed",
        dealerOrgId: "dealer_org_1",
      },
      where: {
        claimStatus: "pending",
        dealerOrgId: null,
        id: "directory_1",
      },
    });
    const projection =
      tx.organizationDirectoryEntry.updateMany.mock.calls[0]?.[0];
    expect(projection.data).not.toHaveProperty("verificationStatus");
    expect(projection.data).not.toHaveProperty("kybStatus");
  });

  it("fails closed when a review version is stale", async () => {
    const tx = {
      organizationDirectoryClaimRequest: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const client = {
      $transaction: vi.fn((operation: (transaction: typeof tx) => unknown) =>
        operation(tx)
      ),
    };

    await expect(
      reviewOrganizationProfileClaim(
        {
          action: "reject",
          authorization: {} as never,
          claimId: "claim_1",
          expectedVersion: 1,
          requestId: "review-request-2",
          reviewReasonCode: "insufficient_evidence",
        },
        client as never
      )
    ).rejects.toBeInstanceOf(OrganizationProfileClaimConflictError);
  });
});
