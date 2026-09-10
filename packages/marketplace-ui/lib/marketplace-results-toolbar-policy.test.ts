import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  formatVehicleCount,
  getActiveFilterChips,
  getMarketplaceResultTitle,
} from "./marketplace-results-toolbar-policy";

describe("marketplace result toolbar policy", () => {
  it("builds localized result titles", () => {
    const filters = parseMarketplaceSearchParams({
      category: "car",
      deliverTo: "BG",
    });
    expect(getMarketplaceResultTitle(filters, "bg")).toContain("България");
    expect(getMarketplaceResultTitle(filters, "en")).toContain("Bulgaria");
  });

  it("uses singular count copy for one result", () => {
    expect(formatVehicleCount(1, "car", "bg")).toContain("автомобил");
    expect(formatVehicleCount(1, "car", "en")).toContain("vehicle");
  });

  it("returns independent clear updates for active filters", () => {
    const filters = parseMarketplaceSearchParams({
      make: "BMW",
      model: "X5",
      priceMax: 100000,
    });
    const chips = getActiveFilterChips(filters, "en");
    expect(chips.map((chip) => chip.id)).toEqual(["make-model", "price"]);
    expect(chips[0]?.updates).toMatchObject({ make: undefined, model: undefined });
  });
});
