import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import { canUseDesktopFilterModelCounts } from "./desktop-full-filter-policy";

describe("desktop draft inventory counts", () => {
  const applied = parseMarketplaceSearchParams({
    fuel: "diesel",
    priceMax: "150000",
  });

  it("retains facets when only vehicle selection or presentation changes", () => {
    const draft = {
      ...applied,
      make: "BMW",
      model: "X5",
      derivative: "X5",
      trim: "Sport",
      page: 2,
      sort: "price_asc" as const,
    };
    expect(canUseDesktopFilterModelCounts(applied, draft)).toBe(true);
  });

  it.each([
    { category: "motorbike" as const },
    { fuel: "gasoline" as const },
    { priceMax: 100_000 },
    { q: "X5" },
    { deliverTo: "DE" },
  ])("hides stale facets while result criteria are being edited: %j", (update) => {
    expect(
      canUseDesktopFilterModelCounts(applied, { ...applied, ...update })
    ).toBe(false);
  });
});
