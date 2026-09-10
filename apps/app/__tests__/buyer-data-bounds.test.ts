import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureMarketplaceAccount: vi.fn(),
  findLeads: vi.fn(),
  findSavedListings: vi.fn(),
  findSavedSearches: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    lead: { findMany: mocks.findLeads },
    savedListing: { findMany: mocks.findSavedListings },
    savedSearch: { findMany: mocks.findSavedSearches },
  },
}));
vi.mock("@repo/database/accounts", () => ({
  ensureMarketplaceAccount: mocks.ensureMarketplaceAccount,
}));
vi.mock("server-only", () => ({}));

import {
  listBuyerInquiries,
  listBuyerSavedListings,
  listBuyerSavedSearches,
} from "../app/(authenticated)/buyer-data";

describe("buyer workspace query bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureMarketplaceAccount.mockResolvedValue({ id: "account_1" });
    mocks.findLeads.mockResolvedValue([]);
    mocks.findSavedListings.mockResolvedValue([]);
    mocks.findSavedSearches.mockResolvedValue([]);
  });

  it("uses a deterministic hard bound for saved listings", async () => {
    await listBuyerSavedListings("user_1");

    expect(mocks.findSavedListings).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
        where: { accountId: "account_1" },
      })
    );
  });

  it("uses a deterministic hard bound for saved searches", async () => {
    await listBuyerSavedSearches("user_1");

    expect(mocks.findSavedSearches).toHaveBeenCalledWith({
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 100,
      where: { accountId: "account_1" },
    });
  });

  it("uses a deterministic hard bound and narrow select for inquiries", async () => {
    await listBuyerInquiries("user_1");

    expect(mocks.findLeads).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
        where: { buyerAccountId: "account_1", deletedAt: null },
      })
    );
  });
});
