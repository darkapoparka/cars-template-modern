import { describe, expect, it } from "vitest";
import {
  getMarketplaceModelInventoryKey,
  getMarketplaceModelPickerGroups,
} from "./model-picker-options";

const model = (name: string, slug: string) => ({
  derivatives: [],
  name,
  slug,
});

describe("marketplace model picker options", () => {
  const bmwModels = [
    model("1 Series", "1-series"),
    model("3 Series", "3-series"),
    model("2 Series", "2-series"),
    model("iX", "ix"),
    model("X5", "x5"),
    model("5 Series", "5-series"),
    model("4 Series", "4-series"),
  ];

  it("pins the curated BMW Series sequence without changing canonical models", () => {
    const groups = getMarketplaceModelPickerGroups({
      make: "BMW",
      models: bmwModels,
      prioritizePopular: true,
    });

    expect(groups.popular.map((item) => item.name)).toEqual([
      "1 Series",
      "2 Series",
      "3 Series",
      "4 Series",
      "5 Series",
    ]);
    expect(groups.remaining.map((item) => item.name)).toEqual(["iX", "X5"]);
    expect(groups.popular[0]).toBe(bmwModels[0]);
  });

  it("preserves incoming order for search results and other makes", () => {
    expect(
      getMarketplaceModelPickerGroups({
        make: "BMW",
        models: bmwModels,
        prioritizePopular: false,
      })
    ).toEqual({ popular: [], remaining: bmwModels });

    const audiModels = [model("A3", "a3"), model("Q5", "q5")];
    expect(
      getMarketplaceModelPickerGroups({
        make: "Audi",
        models: audiModels,
        prioritizePopular: true,
      })
    ).toEqual({ popular: [], remaining: audiModels });
  });

  it("normalizes count lookup keys without changing visible labels", () => {
    expect(getMarketplaceModelInventoryKey(" BMW ", "5 SERIES")).toBe(
      getMarketplaceModelInventoryKey("bmw", "5 Series")
    );
  });
});
