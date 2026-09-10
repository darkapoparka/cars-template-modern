import { describe, expect, test, vi } from "vitest";
import {
  disableMarketplaceAccountFromClerk,
  hashExternalIdentityPayload,
} from "./auth-sync";

const SHA_256_HEX_PATTERN = /^[a-f0-9]{64}$/;

describe("durable external identity sync", () => {
  test("stores a deterministic hash instead of raw provider payload", () => {
    expect(hashExternalIdentityPayload("synthetic-payload")).toMatch(
      SHA_256_HEX_PATTERN
    );
    expect(hashExternalIdentityPayload("synthetic-payload")).toBe(
      hashExternalIdentityPayload("synthetic-payload")
    );
    expect(hashExternalIdentityPayload("synthetic-payload")).not.toContain(
      "synthetic"
    );
  });

  test("tombstones seller access and pauses public listings when Clerk deletes a user", async () => {
    const updatedAt = new Date("2026-07-22T10:00:00.000Z");
    const tx = {
      conversationParticipant: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      dealerMember: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      listingStatusEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      marketplaceAccount: {
        findUnique: vi.fn().mockResolvedValue({ id: "account_1" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      marketplaceListing: {
        findMany: vi.fn().mockResolvedValue([{ id: "listing_1" }]),
        updateManyAndReturn: vi.fn().mockResolvedValue([{ id: "listing_1" }]),
      },
      sellerProfile: {
        findFirst: vi.fn().mockResolvedValue({ id: "seller_1" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const client = {
      $transaction: vi.fn(async (operation) => operation(tx)),
    };

    await expect(
      disableMarketplaceAccountFromClerk(
        { clerkUserId: "user_1", providerUpdatedAt: updatedAt },
        client as never
      )
    ).resolves.toEqual({ count: 1 });

    expect(tx.conversationParticipant.updateMany).toHaveBeenCalledWith({
      data: { leftAt: updatedAt },
      where: { accountId: "account_1", leftAt: null },
    });
    expect(tx.sellerProfile.updateMany).toHaveBeenCalledWith({
      data: { deletedAt: updatedAt, status: "deleted" },
      where: { deletedAt: null, id: "seller_1" },
    });
    expect(tx.marketplaceListing.updateManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["listing_1"] }, status: "active" },
      })
    );
    expect(tx.listingStatusEvent.createMany).toHaveBeenCalledWith({
      data: [
        {
          actorAccountId: "account_1",
          fromStatus: "active",
          listingId: "listing_1",
          reasonCode: "account_inactive",
          toStatus: "paused",
        },
      ],
    });
  });
});
