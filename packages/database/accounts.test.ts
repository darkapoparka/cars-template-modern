import { describe, expect, it, vi } from "vitest";
import {
  ensureDealerActor,
  ensureMarketplaceAccount,
  ensureSellerProfile,
  getOrCreateActiveMarketplaceAccount,
  getOrCreateMarketplaceAccountIdentity,
} from "./accounts";

const createClient = (member: { id: string; status: string } | null) => ({
  dealerMember: { findFirst: vi.fn().mockResolvedValue(member) },
  dealerOrg: {
    findFirst: vi.fn().mockResolvedValue({ id: "dealer-org-1" }),
  },
  marketplaceAccount: {
    findFirst: vi.fn().mockResolvedValue({ id: "account-1" }),
  },
});

describe("dealer actor provisioning", () => {
  it("returns an already-active durable membership", async () => {
    const client = createClient({ id: "member-1", status: "active" });

    await expect(
      ensureDealerActor(
        {
          clerkOrgId: "org_1",
          clerkUserId: "user_1",
          orgRole: "org:admin",
        },
        client as never
      )
    ).resolves.toMatchObject({ member: { id: "member-1" } });
    expect(client.dealerMember.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: "account-1",
        clerkDeletedAt: null,
        dealerOrgId: "dealer-org-1",
        disabledAt: null,
        status: "active",
      },
    });
  });

  it("does not create or reactivate an account during authorization", async () => {
    const client = createClient({ id: "member-1", status: "active" });
    client.marketplaceAccount.findFirst.mockResolvedValueOnce(null);

    await expect(
      ensureDealerActor(
        { clerkOrgId: "org_1", clerkUserId: "user_1" },
        client as never
      )
    ).rejects.toThrow("account is not actively provisioned");
  });

  it.each([
    null,
    { id: "member-1", status: "disabled" },
  ])("does not create or reactivate an unprovisioned membership", async (member) => {
    const client = createClient(member);

    await expect(
      ensureDealerActor(
        {
          clerkOrgId: "org_1",
          clerkUserId: "user_1",
          orgRole: "org:admin",
        },
        client as never
      )
    ).rejects.toThrow("not actively provisioned");
  });

  it("requires a non-deleted Clerk organization projection", async () => {
    const client = createClient({ id: "member-1", status: "active" });

    await ensureDealerActor(
      {
        clerkOrgId: "org_1",
        clerkUserId: "user_1",
        orgRole: "org:admin",
      },
      client as never
    );

    expect(client.dealerOrg.findFirst).toHaveBeenCalledWith({
      where: {
        clerkDeletedAt: null,
        clerkOrgId: "org_1",
        deletedAt: null,
      },
    });
  });
});

describe("active marketplace account provisioning", () => {
  it("creates a missing account without mutating an existing account", async () => {
    const upsert = vi.fn().mockResolvedValue({
      clerkUserId: "user_1",
      deletedAt: null,
      id: "account-1",
      status: "active",
    });

    await expect(
      getOrCreateActiveMarketplaceAccount("user_1", {
        marketplaceAccount: { upsert },
      } as never)
    ).resolves.toMatchObject({ id: "account-1" });
    expect(upsert).toHaveBeenCalledWith({
      create: { clerkUserId: "user_1" },
      update: {},
      where: { clerkUserId: "user_1" },
    });
  });

  it.each([
    { deletedAt: new Date("2026-07-01T00:00:00.000Z"), status: "active" },
    { deletedAt: null, status: "disabled" },
  ])("does not reactivate a disabled or deleted account", async (state) => {
    const upsert = vi.fn().mockResolvedValue({
      clerkUserId: "user_1",
      id: "account-1",
      ...state,
    });

    await expect(
      getOrCreateActiveMarketplaceAccount("user_1", {
        marketplaceAccount: { upsert },
      } as never)
    ).resolves.toBeNull();
    expect(upsert.mock.calls[0]?.[0].update).toEqual({});
  });

  it("makes the legacy ensure helper fail closed instead of reactivating", async () => {
    const upsert = vi.fn().mockResolvedValue({
      clerkUserId: "user_1",
      deletedAt: null,
      id: "account-1",
      status: "disabled",
    });

    await expect(
      ensureMarketplaceAccount("user_1", {
        marketplaceAccount: { upsert },
      } as never)
    ).rejects.toThrow("not actively provisioned");
    expect(upsert.mock.calls[0]?.[0].update).toEqual({});
  });

  it("lets provider projection find an identity without clearing its tombstone", async () => {
    const deletedAt = new Date("2026-07-01T00:00:00.000Z");
    const upsert = vi.fn().mockResolvedValue({
      clerkUserId: "user_1",
      deletedAt,
      id: "account-1",
      status: "deleted",
    });

    await expect(
      getOrCreateMarketplaceAccountIdentity("user_1", {
        marketplaceAccount: { upsert },
      } as never)
    ).resolves.toMatchObject({ deletedAt, status: "deleted" });
    expect(upsert).toHaveBeenCalledWith({
      create: { clerkUserId: "user_1" },
      update: {},
      where: { clerkUserId: "user_1" },
    });
  });

  it("starts a new seller profile without implying verification is underway", async () => {
    const sellerProfile = {
      accountId: "account-1",
      deletedAt: null,
      id: "seller-1",
      status: "active",
      verificationStatus: "unverified",
    };
    const sellerProfileUpsert = vi.fn().mockResolvedValue(sellerProfile);
    const sellerProfileUpdate = vi.fn().mockResolvedValue(sellerProfile);

    await ensureSellerProfile(
      {
        city: "София",
        clerkUserId: "user_1",
        displayName: "Seller",
      },
      {
        marketplaceAccount: {
          upsert: vi.fn().mockResolvedValue({
            deletedAt: null,
            id: "account-1",
            status: "active",
          }),
        },
        sellerProfile: {
          update: sellerProfileUpdate,
          upsert: sellerProfileUpsert,
        },
      } as never
    );

    expect(sellerProfileUpsert).toHaveBeenCalledWith({
      create: {
        accountId: "account-1",
        city: "София",
        displayName: "Seller",
        status: "active",
        verificationStatus: "unverified",
      },
      update: {},
      where: { accountId: "account-1" },
    });
  });

  it("does not reactivate a disabled seller profile", async () => {
    const sellerProfileUpsert = vi.fn().mockResolvedValue({
      accountId: "account-1",
      deletedAt: null,
      id: "seller-1",
      status: "disabled",
    });
    const sellerProfileUpdate = vi.fn();

    await expect(
      ensureSellerProfile(
        {
          city: "София",
          clerkUserId: "user_1",
          displayName: "Seller",
        },
        {
          marketplaceAccount: {
            upsert: vi.fn().mockResolvedValue({
              deletedAt: null,
              id: "account-1",
              status: "active",
            }),
          },
          sellerProfile: {
            update: sellerProfileUpdate,
            upsert: sellerProfileUpsert,
          },
        } as never
      )
    ).rejects.toThrow("Seller profile is not actively provisioned");
    expect(sellerProfileUpsert.mock.calls[0]?.[0].update).toEqual({});
    expect(sellerProfileUpdate).not.toHaveBeenCalled();
  });
});
