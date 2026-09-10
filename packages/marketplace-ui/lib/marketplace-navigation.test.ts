import { describe, expect, it } from "vitest";
import { isBuyMarketplaceCategory } from "./marketplace-navigation";

describe("marketplace bottom navigation", () => {
  it.each([
    "car",
    "truck",
    "van",
    "motorbike",
  ] as const)("treats %s as a buy category", (category) => {
    expect(isBuyMarketplaceCategory(category)).toBe(true);
  });

  it("keeps lease separate from buy", () => {
    expect(isBuyMarketplaceCategory("lease")).toBe(false);
  });
});
