import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertActiveListingQuota: vi.fn(),
  ensureDealerActor: vi.fn(),
  ensureSellerProfile: vi.fn(),
  findFirst: vi.fn(),
  recordEntitlementUsage: vi.fn(),
  transaction: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("./index", () => ({
  database: {
    $transaction: mocks.transaction,
  },
}));

vi.mock("./accounts", () => ({
  ensureDealerActor: mocks.ensureDealerActor,
  ensureSellerProfile: mocks.ensureSellerProfile,
}));

vi.mock("./commerce", () => ({
  assertActiveListingQuota: mocks.assertActiveListingQuota,
  recordEntitlementUsage: mocks.recordEntitlementUsage,
}));

import {
  assertOwnedListingIsManuallyEditable,
  assertOwnedListingTransitionAllowed,
  assertOwnerModerationTransitionAllowed,
  createListingDraft,
  getOwnedListing,
  INVALID_LISTING_ACTOR_CONTEXT_ERROR,
  OWNER_REVIEW_ACTIVATION_ERROR,
  SOURCE_MANAGED_ACTIVATION_ERROR,
  SOURCE_MANAGED_EDIT_ERROR,
  transitionOwnedListing,
  updateOwnedListing,
} from "./listings";

const actor = {
  city: "Sofia",
  clerkUserId: "user_1",
  displayName: "Seller",
};

const listingInput = {
  bodyType: "suv" as const,
  category: "car" as const,
  colorExterior: undefined,
  derivative: undefined,
  description: "Well maintained vehicle with service history.",
  enginePowerHp: undefined,
  fuelType: "diesel" as const,
  locationCity: "Sofia",
  locationCountry: "Bulgaria",
  locationRegion: undefined,
  make: "BMW",
  mileageValue: 80_000,
  model: "X3",
  monthlyAmount: undefined,
  priceAmount: 42_000,
  priceCurrency: "BGN" as const,
  priceType: "fixed" as const,
  title: "BMW X3",
  transmission: "automatic" as const,
  trim: undefined,
  vin: undefined,
  year: 2021,
};

describe("owner mutation guards for source-managed projections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertActiveListingQuota.mockResolvedValue({
      decision: { allowed: true },
    });
    mocks.recordEntitlementUsage.mockResolvedValue("created");
    mocks.ensureSellerProfile.mockResolvedValue({
      account: { id: "account_1" },
      sellerProfile: {
        city: "Sofia",
        displayName: "Seller",
        id: "seller_1",
        verificationStatus: "verified",
      },
    });
    mocks.transaction.mockImplementation(async (operation) =>
      operation({
        marketplaceListing: {
          findFirst: mocks.findFirst,
          updateMany: mocks.updateMany,
        },
      })
    );
  });

  test.each([
    { inventoryOfferId: "offer_1", marketPublicationId: null },
    { inventoryOfferId: null, marketPublicationId: "publication_1" },
  ])("rejects manual edits when imported lineage exists", (listing) => {
    expect(() => assertOwnedListingIsManuallyEditable(listing)).toThrow(
      SOURCE_MANAGED_EDIT_ERROR
    );
  });

  test.each([
    { inventoryOfferId: "offer_1", marketPublicationId: null },
    { inventoryOfferId: null, marketPublicationId: "publication_1" },
  ])("rejects owner activation when imported lineage exists", (listing) => {
    expect(() =>
      assertOwnedListingTransitionAllowed(listing, "active")
    ).toThrow(SOURCE_MANAGED_ACTIVATION_ERROR);
  });

  test("keeps manual listing edits and lifecycle transitions available", () => {
    const manualListing = {
      inventoryOfferId: null,
      marketPublicationId: null,
    };

    expect(() =>
      assertOwnedListingIsManuallyEditable(manualListing)
    ).not.toThrow();
    expect(() =>
      assertOwnedListingTransitionAllowed(manualListing, "active")
    ).not.toThrow();
  });

  test("requires trusted approval for pending-review publication", () => {
    expect(() =>
      assertOwnerModerationTransitionAllowed("pending_review", "active")
    ).toThrow(OWNER_REVIEW_ACTIVATION_ERROR);
    expect(() =>
      assertOwnerModerationTransitionAllowed("paused", "active")
    ).not.toThrow();
  });

  test("does not prevent a source-managed projection from being paused", () => {
    expect(() =>
      assertOwnedListingTransitionAllowed(
        { inventoryOfferId: "offer_1", marketPublicationId: null },
        "paused"
      )
    ).not.toThrow();
  });

  test("transitionOwnedListing rejects imported activation before a write", async () => {
    mocks.findFirst.mockResolvedValueOnce({
      inventoryOfferId: "offer_1",
      marketPublicationId: "publication_1",
      status: "paused",
      version: 4,
    });

    await expect(
      transitionOwnedListing("listing_1", "active", actor)
    ).rejects.toThrow(SOURCE_MANAGED_ACTIVATION_ERROR);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  test("rejects a manual activation at the quota boundary before a write", async () => {
    const quotaError = new Error("Active listing quota reached");
    mocks.findFirst.mockResolvedValueOnce({
      inventoryOfferId: null,
      marketPublicationId: null,
      status: "paused",
      version: 4,
    });
    mocks.assertActiveListingQuota.mockRejectedValueOnce(quotaError);

    await expect(
      transitionOwnedListing("listing_1", "active", actor)
    ).rejects.toBe(quotaError);

    expect(mocks.assertActiveListingQuota).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: { id: "seller_1", kind: "private_seller" },
      })
    );
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.recordEntitlementUsage).not.toHaveBeenCalled();
  });

  test("updateOwnedListing rejects imported edits before a write", async () => {
    mocks.findFirst.mockResolvedValueOnce({
      inventoryOfferId: "offer_1",
      marketPublicationId: "publication_1",
      status: "active",
      version: 4,
    });

    await expect(
      updateOwnedListing("listing_1", listingInput, actor)
    ).rejects.toThrow(SOURCE_MANAGED_EDIT_ERROR);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  test("owned listing reads exclude deleted and unfinished photos", async () => {
    mocks.findFirst.mockResolvedValueOnce({ id: "listing_1", images: [] });

    await getOwnedListing("listing_1", actor);

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          images: {
            orderBy: { position: "asc" },
            where: { deletedAt: null, uploadStatus: "uploaded" },
          },
        },
      })
    );
  });

  test.each([
    {
      claim: "organization ID without a role",
      mismatchedActor: { ...actor, clerkOrgId: "org_1" },
    },
    {
      claim: "organization role without an ID",
      mismatchedActor: { ...actor, orgRole: "org:admin" },
    },
  ])("rejects listing reads with $claim", async ({ mismatchedActor }) => {
    await expect(getOwnedListing("listing_1", mismatchedActor)).rejects.toThrow(
      INVALID_LISTING_ACTOR_CONTEXT_ERROR
    );

    expect(mocks.ensureDealerActor).not.toHaveBeenCalled();
    expect(mocks.ensureSellerProfile).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  test("rejects listing writes when an organization ID has no role", async () => {
    await expect(
      updateOwnedListing("listing_1", listingInput, {
        ...actor,
        clerkOrgId: "org_1",
      })
    ).rejects.toThrow(INVALID_LISTING_ACTOR_CONTEXT_ERROR);

    expect(mocks.ensureDealerActor).not.toHaveBeenCalled();
    expect(mocks.ensureSellerProfile).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  test("rechecks a dealer writer role inside the listing transaction", async () => {
    const auditCreate = vi.fn().mockResolvedValue({ id: "audit_1" });
    const listingCreate = vi.fn().mockResolvedValue({ id: "listing_1" });
    mocks.ensureDealerActor.mockResolvedValueOnce({
      account: { id: "account_1" },
      dealerOrg: {
        city: "София",
        displayName: "Dealer",
        id: "dealer_1",
        verificationStatus: "verified",
      },
    });
    mocks.transaction.mockImplementationOnce(async (operation) =>
      operation({
        auditLog: { create: auditCreate },
        marketplaceListing: { create: listingCreate },
      })
    );

    await createListingDraft(listingInput, {
      ...actor,
      clerkOrgId: "org_1",
      orgRole: "org:member",
    });

    expect(mocks.ensureDealerActor).toHaveBeenCalledWith(
      {
        allowedRoles: ["owner", "manager", "sales"],
        clerkOrgId: "org_1",
        clerkUserId: "user_1",
        orgRole: "org:member",
      },
      expect.any(Object)
    );
  });
});
