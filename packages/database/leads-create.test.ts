import { describe, expect, test, vi } from "vitest";

vi.mock("./index", () => ({ database: {} }));
vi.mock("./inventory-ingestion", () => ({
  findCurrentPublicMarketplacePublicationForInquiry: vi.fn(),
}));

import { createPublicLead } from "./leads";

describe("public lead conversation integrity", () => {
  test("bounds active recipients, excludes the buyer, and batches participant writes", async () => {
    const createParticipant = vi
      .fn()
      .mockResolvedValue({ id: "buyer_participant" });
    const createParticipants = vi.fn().mockResolvedValue({ count: 1 });
    const findParticipants = vi
      .fn()
      .mockResolvedValue([{ id: "dealer_participant" }]);
    const findDealerMembers = vi
      .fn()
      .mockResolvedValue([
        { accountId: "dealer_account", id: "dealer_member" },
      ]);
    const findListing = vi.fn().mockResolvedValue({
      dealerOrgId: "dealer_org",
      id: "listing_1",
      inventoryOfferId: null,
      sellerProfile: null,
      sellerProfileId: null,
      slug: "listing-one",
      title: "Listing one",
    });
    const tx = {
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      conversation: {
        create: vi.fn().mockResolvedValue({ id: "conversation_1" }),
      },
      conversationMessage: {
        create: vi.fn().mockResolvedValue({
          createdAt: new Date("2026-07-22T10:00:00.000Z"),
          id: "message_1",
        }),
      },
      conversationParticipant: {
        create: createParticipant,
        createMany: createParticipants,
        findMany: findParticipants,
      },
      conversationReadState: {
        create: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      dealerMember: { findMany: findDealerMembers },
      lead: {
        create: vi.fn().mockResolvedValue({ id: "lead_1" }),
      },
      marketplaceAccount: {
        upsert: vi.fn().mockResolvedValue({
          deletedAt: null,
          id: "buyer_account",
          status: "active",
        }),
      },
      marketplaceListing: { findFirst: findListing },
    };
    const client = {
      $transaction: vi.fn(async (operation) => operation(tx)),
    };

    await createPublicLead(
      {
        buyerName: "Buyer Name",
        email: "buyer@example.test",
        intent: "availability",
        listingId: "listing_1",
        message: "Is this vehicle available?",
      },
      { buyerClerkUserId: "user_1", client: client as never }
    );

    expect(findListing).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          status: "active",
        }),
      })
    );
    expect(findDealerMembers).toHaveBeenCalledWith({
      orderBy: { id: "asc" },
      select: { accountId: true, id: true },
      take: 100,
      where: {
        account: { deletedAt: null, status: "active" },
        accountId: { not: "buyer_account" },
        clerkDeletedAt: null,
        dealerOrg: { clerkDeletedAt: null, deletedAt: null },
        dealerOrgId: "dealer_org",
        disabledAt: null,
        status: "active",
      },
    });
    expect(createParticipant).toHaveBeenCalledOnce();
    expect(createParticipants).toHaveBeenCalledWith({
      data: [
        {
          accountId: "dealer_account",
          conversationId: "conversation_1",
          dealerMemberId: "dealer_member",
          role: "dealer_member",
        },
      ],
    });
    expect(findParticipants).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        accountId: { in: ["dealer_account"] },
        conversationId: "conversation_1",
      },
    });
  });

  test("replays only an identical public inquiry payload", async () => {
    const existingLead = {
      buyerCountryCode: null,
      buyerLocale: "en",
      buyerName: "Buyer Name",
      deletedAt: null,
      email: "buyer@example.test",
      id: "lead_existing",
      intent: "availability",
      listingId: "listing_1",
      message: "Is this vehicle available?",
      phone: null,
    };
    const tx = {
      $executeRaw: vi.fn().mockResolvedValue(1),
      lead: { findUnique: vi.fn().mockResolvedValue(existingLead) },
      marketplaceListing: { findFirst: vi.fn() },
    };
    const client = {
      $transaction: vi.fn(async (operation) => operation(tx)),
    };
    const input = {
      buyerLocale: "en",
      buyerName: "Buyer Name",
      email: "buyer@example.test",
      inquiryDedupeKey: "123e4567-e89b-42d3-a456-426614174000",
      intent: "availability" as const,
      listingId: "listing_1",
      message: "Is this vehicle available?",
    };

    await expect(
      createPublicLead(input, { client: client as never })
    ).resolves.toEqual(existingLead);
    expect(tx.marketplaceListing.findFirst).not.toHaveBeenCalled();

    await expect(
      createPublicLead(
        { ...input, message: "This is a changed replay payload." },
        { client: client as never }
      )
    ).rejects.toThrow("Inquiry idempotency key payload does not match");
    expect(tx.marketplaceListing.findFirst).not.toHaveBeenCalled();
  });

  test("rejects anonymous private-seller leads without a routable inbox", async () => {
    const createLead = vi.fn();
    const tx = {
      lead: { create: createLead },
      marketplaceListing: {
        findFirst: vi.fn().mockResolvedValue({
          dealerOrgId: null,
          id: "listing_private",
          inventoryOfferId: null,
          sellerProfile: { accountId: "seller_account", id: "seller_profile" },
          sellerProfileId: "seller_profile",
          slug: "private-listing",
          title: "Private listing",
        }),
      },
    };
    const client = {
      $transaction: vi.fn(async (operation) => operation(tx)),
    };

    await expect(
      createPublicLead(
        {
          buyerName: "Buyer Name",
          email: "buyer@example.test",
          intent: "availability",
          listingId: "listing_private",
          message: "Is this vehicle available?",
        },
        { client: client as never }
      )
    ).rejects.toThrow(
      "Anonymous private-seller lead delivery is not configured"
    );
    expect(createLead).not.toHaveBeenCalled();
  });
});
