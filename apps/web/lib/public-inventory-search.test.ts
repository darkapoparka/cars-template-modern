import { mockListings } from "@repo/marketplace/mock-data";
import { describe, expect, it, vi } from "vitest";
import { getCurrentPublicDataMode } from "./public-data-policy";
import { getPublicInventorySearchListings } from "./public-inventory-search";

vi.mock("./public-data-policy", () => ({ getCurrentPublicDataMode: vi.fn() }));

describe("public inventory search data boundary", () => {
  it("preserves category-wide demo search without sending complete records", () => {
    vi.mocked(getCurrentPublicDataMode).mockReturnValue("demo");
    const summaries = getPublicInventorySearchListings("car", []);
    expect(summaries.length).toBe(
      mockListings.filter((item) => item.category === "car").length
    );
    expect(summaries.length).toBeGreaterThan(0);
    for (const item of summaries) {
      expect(Object.keys(item).sort()).toEqual([
        "category",
        "features",
        "id",
        "images",
        "location",
        "monthlyEstimate",
        "price",
        "slug",
        "spec",
        "title",
      ]);
      expect(item.images.length).toBeLessThanOrEqual(1);
      expect(Object.keys(item.location ?? {})).toEqual(["city"]);
      for (const feature of item.features ?? []) {
        expect(Object.keys(feature).sort()).toEqual(["bg", "en"]);
      }
      expect(Object.keys(item.spec).sort()).toEqual([
        "fuelType",
        "make",
        "mileageValue",
        "model",
        "trim",
        "year",
      ]);
    }
  });

  it("never supplies demo vehicles to live or unavailable inventory", () => {
    for (const mode of ["database", "unavailable"] as const) {
      vi.mocked(getCurrentPublicDataMode).mockReturnValue(mode);
      expect(getPublicInventorySearchListings("car", [])).toEqual([]);
    }
    vi.mocked(getCurrentPublicDataMode).mockReturnValue("database");
    const supplied = { ...mockListings[0], id: "supplied-live-record" };
    const summaries = getPublicInventorySearchListings("car", [supplied]);
    expect(summaries.map((item) => item.id)).toEqual(["supplied-live-record"]);
    expect(summaries[0]).not.toBe(supplied);
    expect(summaries[0].spec).not.toBe(supplied.spec);
  });
});
