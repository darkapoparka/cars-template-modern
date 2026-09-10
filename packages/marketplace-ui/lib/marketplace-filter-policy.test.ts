import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  formatMarketplaceRangeLabel,
  getMarketplaceMobileDiscoverySummary,
  getMarketplaceQuickFilterLabel,
  isMarketplaceQuickFilterActive,
} from "./marketplace-filter-policy";

describe("marketplace filter policy", () => {
  it("formats zero-valued range bounds without treating them as missing", () => {
    expect(formatMarketplaceRangeLabel(0, 40_000, "", "en")).toBe("0–40,000");
  });

  it("keeps quick filter activation and labels derived from the same filter state", () => {
    const filters = parseMarketplaceSearchParams({
      location: "Sofia",
      priceMax: 70_000,
      priceMin: 50_000,
      sort: "newest",
    });

    expect(isMarketplaceQuickFilterActive("location", filters)).toBe(true);
    expect(isMarketplaceQuickFilterActive("price", filters)).toBe(true);
    expect(isMarketplaceQuickFilterActive("fuel", filters)).toBe(false);
    expect(getMarketplaceQuickFilterLabel("location", filters, "bg")).toBe(
      "София"
    );
    expect(getMarketplaceQuickFilterLabel("sort", filters, "bg")).toBe(
      "Най-нови"
    );
  });

  it("builds the compact discovery summary from the selected vehicle", () => {
    const filters = parseMarketplaceSearchParams({
      make: "BMW",
      model: "X5",
      location: "Sofia",
    });

    expect(
      getMarketplaceMobileDiscoverySummary(filters, "bg", "Автомобили")
    ).toBe("BMW X5");
  });
});
