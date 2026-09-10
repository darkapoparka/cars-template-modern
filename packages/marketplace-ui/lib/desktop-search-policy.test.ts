import { describe, expect, it } from "vitest";
import {
  getDesktopSearchSuggestionGroups,
  rememberMarketplaceSearchQuery,
} from "./desktop-search-policy";

describe("desktop search policy", () => {
  it("builds a direct search action for a typed query", () => {
    const groups = getDesktopSearchSuggestionGroups({
      isBg: false,
      query: "BMW X5",
      recentSearches: [],
      scope: "vehicles",
    });

    expect(groups.at(-1)?.items.at(-1)).toMatchObject({
      kind: "search",
      value: "BMW X5",
    });
  });

  it("keeps idle suggestions grouped by scope", () => {
    const groups = getDesktopSearchSuggestionGroups({
      isBg: true,
      query: "",
      recentSearches: ["Audi"],
      scope: "organizations",
    });

    expect(groups[0]?.items[0]).toMatchObject({
      kind: "recent",
      value: "Audi",
    });
    expect(groups.at(-1)?.items.length).toBeGreaterThan(0);
  });

  it("does not require a browser to remember a query", () => {
    expect(rememberMarketplaceSearchQuery("BMW", "vehicles")).toEqual([]);
  });
});
