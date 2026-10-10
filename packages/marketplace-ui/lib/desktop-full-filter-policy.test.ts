import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  canUseDesktopFilterModelCounts,
  resetMarketplaceFullFilters,
} from "./desktop-full-filter-policy";

it("resets every criterion and page, including criteria absent from the dialog", () => {
  const applied = parseMarketplaceSearchParams({
    category: "motorbike",
    q: "touring",
    make: "BMW",
    model: "R 1250 GS",
    derivative: "Adventure",
    trim: "Sport",
    location: "Sofia",
    origin: "DE",
    deliverTo: "BG",
    radius: 100,
    priceMin: 10_000,
    priceMax: 30_000,
    currency: "EUR",
    yearMin: 2010,
    yearMax: 2025,
    mileageMax: 50_000,
    powerMin: 100,
    extra: "heated-seats",
    fuel: "gasoline",
    transmission: "manual",
    body: "suv",
    seller: "dealer",
    sort: "newest",
    page: 3,
  });
  const reset = resetMarketplaceFullFilters(applied);
  expect(reset.category).toBe("car");
  expect(reset.page).toBe(1);
  expect(reset.sort).toBe("newest");
  for (const key of Object.keys(applied) as (keyof typeof applied)[]) {
    if (key !== "category" && key !== "page" && key !== "sort") {
      expect(reset[key], key).toBeUndefined();
    }
  }
  expect(applied.powerMin).toBe(100);
  expect(applied.currency).toBe("EUR");
});

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
