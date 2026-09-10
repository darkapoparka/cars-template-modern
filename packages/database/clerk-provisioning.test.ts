import { describe, expect, it, vi } from "vitest";

import { projectClerkOrganizationProvisioning } from "./clerk-provisioning";

describe("Clerk organization provisioning projection", () => {
  it("uses durable deterministic IDs when projecting the Clerk organization", async () => {
    const tx = {
      clerkOrgProvisioning: {
        findFirst: vi.fn().mockResolvedValue({
          applicantAccount: { clerkUserId: "user_1" },
          applicantAccountId: "account_1",
          id: "provisioning_1",
          requestedCountryCode: "BG",
          requestedDisplayName: "Auto Import Sofia",
          requestedOrgType: "importer",
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      dealerMember: {
        upsert: vi.fn().mockResolvedValue({ id: "member_orgmem_1" }),
      },
      dealerOrg: {
        upsert: vi.fn().mockResolvedValue({
          clerkOrgId: "org_1",
          id: "dealer_provisioning_1",
        }),
      },
    };
    const client = {
      $transaction: vi.fn(
        async (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx)
      ),
    };

    await projectClerkOrganizationProvisioning(
      {
        clerkMembershipId: "orgmem_1",
        clerkOrgId: "org_1",
        clerkSourceRole: "org:admin",
        clerkUserId: "user_1",
        provisioningId: "provisioning_1",
        recognizedRole: true,
        role: "owner",
      },
      client as never
    );

    expect(tx.dealerOrg.upsert).toHaveBeenCalledWith({
      create: expect.objectContaining({
        id: "dealer_provisioning_1",
        verificationStatus: "unverified",
      }),
      update: expect.any(Object),
      where: { clerkOrgId: "org_1" },
    });
    expect(tx.dealerMember.upsert).toHaveBeenCalledWith({
      create: expect.objectContaining({ id: "member_orgmem_1" }),
      update: expect.any(Object),
      where: {
        dealerOrgId_accountId: {
          accountId: "account_1",
          dealerOrgId: "dealer_provisioning_1",
        },
      },
    });
  });
});
