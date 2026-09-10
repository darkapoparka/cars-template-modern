import { mockListings } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import { getMobileInventorySearchGroups } from "./inventory-search-suggestions";

const carListings = mockListings.filter(
  (listing) => listing.category === "car"
);

describe("mobile inventory search suggestions", () => {
  it("shows only in-stock makes before any query", () => {
    const groups = getMobileInventorySearchGroups({
      isBg: true,
      listings: carListings,
      locale: "bg",
      query: "",
    });

    expect(groups.map((group) => group.heading)).toEqual(["Марки в наличност"]);
    expect(
      groups[0]?.items.some(
        (item) => item.kind === "make" && item.label === "BMW"
      )
    ).toBe(true);
    expect(
      groups.some((group) => group.items.some((item) => item.kind !== "make"))
    ).toBe(false);
  });

  it("combines matching makes and models in one rail after a query", () => {
    const groups = getMobileInventorySearchGroups({
      isBg: true,
      listings: carListings,
      locale: "bg",
      query: "BMW",
    });

    const kinds = groups.flatMap((group) =>
      group.items.map((item) => item.kind)
    );
    expect(groups.map((group) => group.heading)).toEqual([
      "Предложения",
      "Обяви",
      "Търсене",
    ]);
    expect(
      groups.filter((group) => group.presentation === "chips")
    ).toHaveLength(1);
    expect(kinds).toContain("make");
    expect(kinds).toContain("model");
    expect(kinds).toContain("listing");
    expect(
      groups
        .flatMap((group) => group.items)
        .some(
          (item) =>
            item.kind === "model" && item.make === "BMW" && item.model === "X5"
        )
    ).toBe(true);
    expect(
      groups
        .flatMap((group) => group.items)
        .some((item) => item.kind === "query" && item.label === "Търси „BMW“")
    ).toBe(true);
  });

  it("treats commas as separators so BMW, M5 matches in-stock cars", () => {
    const groups = getMobileInventorySearchGroups({
      isBg: true,
      listings: carListings,
      locale: "bg",
      query: "BMW, M5",
    });

    const listingLabels = groups
      .flatMap((group) => group.items)
      .filter((item) => item.kind === "listing")
      .map((item) => item.label);

    expect(listingLabels.some((label) => label.includes("BMW"))).toBe(true);
    expect(listingLabels.some((label) => label.includes("M5"))).toBe(true);
  });
});
