import type { VehicleListing } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  getDesktopDiscoveryCollections,
  getPopularMakes,
} from "./desktop-discovery-policy";

const listing = (index: number, promoted = false) =>
  ({
    id: String(index).padStart(2, "0"),
    promoted,
    publishedAt: new Date(2026, 0, index + 1).toISOString(),
    spec: { make: index % 2 ? "BMW" : "Audi" },
  }) as VehicleListing;

describe("desktop discovery collections", () => {
  it("keeps selection bounded, unique and independent of viewport width", () => {
    const listings = Array.from({ length: 18 }, (_, index) => listing(index));
    const copy = [...listings];
    const result = getDesktopDiscoveryCollections(listings);
    expect(result.featured).toHaveLength(5);
    expect(result.newest).toHaveLength(5);
    expect(result.available).toHaveLength(5);
    expect(result.newest[0].id).toBe("17");
    const ids = Object.values(result)
      .flat()
      .map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(listings).toEqual(copy);
  });
  it("prioritizes promoted stock and does not repeat duplicate inventory records", () => {
    const first = listing(0);
    const promoted = listing(1, true);
    const result = getDesktopDiscoveryCollections([first, first, promoted]);
    expect(result.featured.map((item) => item.id)).toEqual(["01", "00"]);
    expect(result.newest).toEqual([]);
    expect(result.available).toEqual([]);
  });
  it("handles empty inventory and counts makes only from the supplied selection", () => {
    expect(getDesktopDiscoveryCollections([])).toEqual({
      featured: [],
      newest: [],
      available: [],
    });
    expect(getPopularMakes([listing(0), listing(1), listing(2)])).toEqual([
      { make: "Audi", count: 2 },
      { make: "BMW", count: 1 },
    ]);
  });
});
