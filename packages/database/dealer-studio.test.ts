import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseBoundary = vi.hoisted(() => ({
  dealerOrg: { findFirst: vi.fn() },
  marketplaceListing: { findMany: vi.fn() },
}));

vi.mock("./index", () => ({ database: databaseBoundary }));

import {
  listDealerInventoryRows,
  resolveDealerOrgByClerkOrgId,
} from "./dealer-studio";

const createInventoryRow = (id: string) => ({
  _count: { leads: 0 },
  bodyType: "suv",
  category: "car",
  colorExterior: null,
  createdAt: new Date("2026-07-01T00:00:00.000Z"),
  enginePowerHp: null,
  fuelType: "diesel",
  id,
  images: [],
  inventoryOfferId: null,
  locationCity: "Sofia",
  locationCountry: "Bulgaria",
  locationRegion: null,
  make: "BMW",
  marketPublicationId: null,
  mileageValue: 80_000,
  model: "X3",
  monthlyAmountMinor: null,
  monthlyCurrency: null,
  priceAmountMinor: 4_200_000,
  priceCurrency: "BGN",
  priceType: "gross",
  publishedAt: null,
  sellerCity: "Sofia",
  sellerDisplayName: "Dealer",
  sellerId: "seller_1",
  sellerType: "dealer",
  sellerVerificationStatus: "verified",
  slug: id,
  status: "active",
  title: `BMW X3 ${id}`,
  transmission: "automatic",
  trim: null,
  updatedAt: new Date("2026-07-20T00:00:00.000Z"),
  year: 2023,
});

describe("dealer workspace organization resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    databaseBoundary.dealerOrg.findFirst.mockResolvedValue(null);
    databaseBoundary.marketplaceListing.findMany.mockResolvedValue([]);
  });

  it("excludes soft-deleted Clerk organizations from navigation", async () => {
    await expect(resolveDealerOrgByClerkOrgId("org_1")).resolves.toBeNull();
    expect(databaseBoundary.dealerOrg.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clerkOrgId: "org_1", deletedAt: null },
      })
    );
  });

  it("does not count deleted or unfinished photos as Studio inventory media", async () => {
    await expect(listDealerInventoryRows("dealer_1")).resolves.toEqual({
      items: [],
    });
    expect(databaseBoundary.marketplaceListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          images: expect.objectContaining({
            where: { deletedAt: null, uploadStatus: "uploaded" },
          }),
        }),
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 51,
      })
    );
  });

  it("uses a bounded cursor for large dealer inventories", async () => {
    await listDealerInventoryRows("dealer_1", {
      cursor: "listing_50",
      limit: 25,
    });

    expect(databaseBoundary.marketplaceListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "listing_50" },
        skip: 1,
        take: 26,
        where: { dealerOrgId: "dealer_1", deletedAt: null },
      })
    );
  });

  it("returns only the requested page and a cursor for the next page", async () => {
    databaseBoundary.marketplaceListing.findMany.mockResolvedValue([
      createInventoryRow("listing_3"),
      createInventoryRow("listing_2"),
      createInventoryRow("listing_1"),
    ]);

    const page = await listDealerInventoryRows("dealer_1", { limit: 2 });

    expect(page.items.map(({ id }) => id)).toEqual(["listing_3", "listing_2"]);
    expect(page.nextCursor).toBe("listing_2");
  });
});
