import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { mockListings as fixtures } from "@repo/marketplace/mock-data";
import type { VehicleListing } from "@repo/marketplace/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicMarketplaceListings } from "./public-marketplace-data";

const mocks = vi.hoisted(() => ({
  listings: [] as VehicleListing[],
  getMockListings: vi.fn(),
}));
vi.mock("@repo/marketplace", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@repo/marketplace")>()),
  mockListings: mocks.listings,
  getMockListings: mocks.getMockListings,
}));
vi.mock("@repo/database", () => ({ database: {} }));
vi.mock("@repo/database/marketplace", () => ({}));
vi.mock("@repo/database/vehicle-taxonomy", () => ({}));
vi.mock("./public-data-policy", () => ({
  getCurrentPublicDataMode: () => "demo",
}));
vi.mock("./public-site-binding", () => ({
  requirePublicInventoryScope: vi.fn(),
}));

beforeEach(() => {
  mocks.listings.splice(0);
  for (let index = 0; index < 72; index++) {
    mocks.listings.push({
      ...fixtures[0],
      id: `vehicle-${index}`,
      slug: `vehicle-${index}`,
    });
  }
  mocks.getMockListings.mockReturnValue(mocks.listings);
});

describe("public demo pagination", () => {
  it("adapts only the current page while keeping complete counts and order", async () => {
    const reads = mocks.listings.map((listing) => {
      const badges = listing.badges;
      const read = vi.fn(() => badges);
      Object.defineProperty(listing, "badges", { get: read, enumerable: true });
      return read;
    });
    const result = await getPublicMarketplaceListings(
      parseMarketplaceSearchParams({ page: 2 })
    );
    expect(result.totalListings).toBe(72);
    expect(result.listings.map((listing) => listing.id)).toEqual(
      Array.from({ length: 24 }, (_, index) => `vehicle-${index + 24}`)
    );
    expect(
      result.facets.modelCounts.reduce((sum, item) => sum + item.count, 0)
    ).toBe(72);
    for (let index = 0; index < reads.length; index++) {
      if (index >= 24 && index < 48) {
        expect(reads[index]).toHaveBeenCalled();
      } else {
        expect(reads[index]).not.toHaveBeenCalled();
      }
    }
    expect(result.listings[0]).not.toBe(mocks.listings[24]);
  });

  it("keeps counts on an empty page without adapting off-page records", async () => {
    const result = await getPublicMarketplaceListings(
      parseMarketplaceSearchParams({ page: 4 })
    );
    expect(result.totalListings).toBe(72);
    expect(result.listings).toEqual([]);
    expect(result.facets).toMatchObject({
      categoryCounts: [{ category: fixtures[0].category, count: 72 }],
    });
  });
});
