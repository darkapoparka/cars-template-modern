import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import { getMarketplacePageRedirect } from "./public-marketplace-pagination";

describe("public marketplace pagination", () => {
  it("redirects an out-of-range page to the final available page", () => {
    expect(
      getMarketplacePageRedirect({
        basePath: "/bg",
        filters: parseMarketplaceSearchParams({ page: "9", q: "BMW" }),
        pageSize: 24,
        totalListings: 50,
      })
    ).toBe("/bg?q=BMW&page=3");
  });

  it("removes the page query when only the first page exists", () => {
    expect(
      getMarketplacePageRedirect({
        basePath: "/bg",
        filters: parseMarketplaceSearchParams({ page: "2" }),
        pageSize: 24,
        totalListings: 5,
      })
    ).toBe("/bg");
  });

  it("clamps empty result sets to their canonical first page", () => {
    expect(
      getMarketplacePageRedirect({
        basePath: "/bg",
        filters: parseMarketplaceSearchParams({ page: "2", q: "missing" }),
        pageSize: 24,
        totalListings: 0,
      })
    ).toBe("/bg?q=missing");
  });

  it("does not redirect a valid page", () => {
    expect(
      getMarketplacePageRedirect({
        basePath: "/bg",
        filters: parseMarketplaceSearchParams({ page: "2" }),
        pageSize: 24,
        totalListings: 50,
      })
    ).toBeNull();
  });
});
