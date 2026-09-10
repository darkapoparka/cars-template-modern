import { describe, expect, it, vi } from "vitest";
import { OrganizationAuthorizationError } from "./organization-access";
import {
  authorizeDealerStudioProfileMediaUpload,
  publishDealerStudioPublicProfile,
  saveDealerStudioPublicProfileDraft,
} from "./organization-profile";

const actor = {
  accountId: "account_1",
  dealerOrgId: "dealer_1",
  role: "owner",
} as const;

const profile = {
  brandNames: ["BMW", "Volvo"],
  contact: {
    email: "sales@example.bg",
    phone: "+359 2 123 4567",
    websiteUrl: "https://example.bg",
  },
  description:
    "Подбрани автомобили и съдействие по целия процес на покупка и внос.",
  displayName: "Example Auto",
  headline: "Автомобили с ясна история",
  headquarters: { city: "София", countryCode: "BG", region: "София-град" },
  logoUrl: "https://example.bg/logo.png",
  profileImageUrl: "https://example.bg/profile.jpg",
  services: ["inspection", "transport"] as const,
  tradeLanes: [
    {
      destinationCountryCode: "BG",
      originCountryCode: "DE",
      serviceKinds: ["inspection", "transport"] as const,
      vehicleCategories: ["car"] as const,
    },
  ],
};

describe("Dealer Studio public profile projection", () => {
  it("authorizes profile media only for a manager of the claimed profile", async () => {
    const client = {
      organizationDirectoryEntry: {
        findFirst: vi.fn().mockResolvedValue({
          id: "directory_1",
          orgType: "dealer",
          slug: "example-auto",
          status: "published",
        }),
      },
    };

    await expect(
      authorizeDealerStudioProfileMediaUpload(actor, client as never)
    ).resolves.toEqual({
      directoryEntryId: "directory_1",
      slug: "example-auto",
    });
    expect(client.organizationDirectoryEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          claimStatus: "claimed",
          dealerOrg: expect.objectContaining({
            members: {
              some: expect.objectContaining({
                accountId: actor.accountId,
                role: { in: ["owner", "manager"] },
                status: "active",
              }),
            },
          }),
          dealerOrgId: actor.dealerOrgId,
        }),
      })
    );

    await expect(
      authorizeDealerStudioProfileMediaUpload(
        { ...actor, role: "sales" },
        client as never
      )
    ).rejects.toBeInstanceOf(OrganizationAuthorizationError);
  });

  it("saves a versioned private draft for an owner", async () => {
    const tx = {
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      organizationDirectoryEntry: {
        findFirst: vi.fn().mockResolvedValue({
          id: "directory_1",
          orgType: "dealer",
          slug: "example-auto",
          status: "published",
        }),
      },
      organizationDirectoryProfileDraft: {
        create: vi.fn().mockResolvedValue({}),
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: "draft_1", version: 1 }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "draft_1",
          version: 1,
        }),
      },
    };
    const client = {
      $transaction: vi.fn((operation: (transaction: typeof tx) => unknown) =>
        operation(tx)
      ),
    };

    await saveDealerStudioPublicProfileDraft(
      { actor, profile: profile as never, requestId: "draft-request-1" },
      client as never
    );

    expect(tx.organizationDirectoryProfileDraft.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        directoryEntryId: "directory_1",
        updatedByAccountId: actor.accountId,
      }),
    });
    expect(tx.organizationDirectoryEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          claimStatus: "claimed",
          dealerOrg: expect.objectContaining({
            members: {
              some: expect.objectContaining({
                accountId: actor.accountId,
                role: { in: ["owner", "manager"] },
                status: "active",
              }),
            },
          }),
          dealerOrgId: actor.dealerOrgId,
        }),
      })
    );
  });

  it("publishes the draft while preserving evidence-backed brand records", async () => {
    const tx = {
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      organizationBrandRelationship: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      organizationDirectoryEntry: {
        findFirst: vi.fn().mockResolvedValue({
          id: "directory_1",
          orgType: "dealer",
          slug: "example-auto",
          status: "published",
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      organizationDirectoryProfileDraft: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        findFirst: vi.fn().mockResolvedValue({
          id: "draft_1",
          payload: profile,
          version: 3,
        }),
      },
      organizationTradeLane: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const client = {
      $transaction: vi.fn((operation: (transaction: typeof tx) => unknown) =>
        operation(tx)
      ),
    };

    await publishDealerStudioPublicProfile(
      {
        actor,
        expectedDraftVersion: 3,
        requestId: "publish-request-1",
      },
      client as never
    );

    expect(tx.organizationBrandRelationship.deleteMany).toHaveBeenCalledWith({
      where: {
        directoryEntryId: "directory_1",
        evidenceStatus: "self_reported",
      },
    });
    expect(tx.organizationBrandRelationship.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            evidenceStatus: "self_reported",
            relationshipType: "sells",
          }),
        ]),
      })
    );
    const publicUpdate =
      tx.organizationDirectoryEntry.update.mock.calls[0]?.[0].data;
    expect(publicUpdate).not.toHaveProperty("verificationStatus");
    expect(publicUpdate).not.toHaveProperty("kybStatus");
    expect(publicUpdate).not.toHaveProperty("claimStatus");
  });

  it("clears optional public fields when they are removed from the draft", async () => {
    const clearedProfile = {
      ...profile,
      contact: {},
      description: undefined,
      headline: undefined,
      headquarters: { countryCode: "BG" },
      logoUrl: undefined,
      profileImageUrl: undefined,
    };
    const tx = {
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      organizationBrandRelationship: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      organizationDirectoryEntry: {
        findFirst: vi.fn().mockResolvedValue({
          id: "directory_1",
          orgType: "dealer",
          slug: "example-auto",
          status: "published",
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      organizationDirectoryProfileDraft: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        findFirst: vi.fn().mockResolvedValue({
          id: "draft_1",
          payload: clearedProfile,
          version: 4,
        }),
      },
      organizationTradeLane: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const client = {
      $transaction: vi.fn((operation: (transaction: typeof tx) => unknown) =>
        operation(tx)
      ),
    };

    await publishDealerStudioPublicProfile(
      {
        actor,
        expectedDraftVersion: 4,
        requestId: "publish-request-cleared-fields",
      },
      client as never
    );

    expect(tx.organizationDirectoryEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          city: null,
          description: null,
          email: null,
          headline: null,
          logoUrl: null,
          phone: null,
          profileImageUrl: null,
          region: null,
          websiteUrl: null,
        }),
      })
    );
  });
});
