import { describe, expect, it } from "vitest";
import { buildPublicInventoryTaxonomy } from "./public-inventory-taxonomy";

describe("inventory taxonomy fallback", () => {
  it("preserves inventory labels, deduplicates pairs and leaves variants unknown", () => {
    const pairs = [
      { make: "Mercedes-Benz", model: "V-Class" },
      { make: "Mercedes-Benz", model: "V-Class" },
    ];
    expect(buildPublicInventoryTaxonomy(pairs)).toEqual([
      {
        name: "Mercedes-Benz",
        slug: "mercedes-benz",
        models: [{ name: "V-Class", slug: "v-class", derivatives: [] }],
      },
    ]);
    expect(pairs).toHaveLength(2);
  });
  it("does not invent options for categories without inventory", () => {
    expect(buildPublicInventoryTaxonomy([])).toEqual([]);
  });
});
