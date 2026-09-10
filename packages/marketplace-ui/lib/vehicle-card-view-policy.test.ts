import { mockListings } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  getLocalizedVehicleCardLocationPart,
  getVehicleCardImageSizes,
  getVehicleCardSaveListingLabel,
  getVehicleCardViewListingLabel,
} from "./vehicle-card-view-policy";

describe("vehicle card view policy", () => {
  it("localizes common locations without changing unknown values", () => {
    expect(getLocalizedVehicleCardLocationPart("Sofia", "bg")).toBe("София");
    expect(getLocalizedVehicleCardLocationPart("Tokyo", "bg")).toBe("Tokyo");
  });

  it("keeps accessible action labels locale-aware", () => {
    const title = mockListings[0]?.title ?? "Vehicle";
    expect(getVehicleCardViewListingLabel(title, "bg")).toContain("Виж");
    expect(getVehicleCardSaveListingLabel(title, "en")).toContain("save");
  });

  it("keeps image sizing deterministic by layout", () => {
    expect(getVehicleCardImageSizes(true, false, false)).toContain("13rem");
    expect(getVehicleCardImageSizes(true, true, true)).toContain("33vw");
  });
});
