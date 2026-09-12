import { describe, expect, it } from "vitest";
import { publicBlogPosts } from "./public-blog-posts";
import {
  contentFilters,
  filterPublicContent,
  parseContentSearch,
  serializeContentSearch,
} from "./public-content";
import { getPublicContentCards } from "./public-content-data";
import { vehicleGuides } from "./vehicle-guides";

const absoluteAssetPathPattern = /^\//;

describe("public editorial content", () => {
  it("has unique slugs and self-contained image/category metadata", () => {
    const entries = [...publicBlogPosts, ...vehicleGuides];
    expect(new Set(entries.map(({ slug }) => slug)).size).toBe(entries.length);
    for (const entry of entries) {
      expect(entry.image).toMatch(absoluteAssetPathPattern);
      expect(contentFilters.some(({ id }) => id === entry.categoryId)).toBe(
        true
      );
    }
  });
  it("sends only localized summaries to the client", () => {
    const cards = getPublicContentCards("bg");
    expect(cards).toHaveLength(publicBlogPosts.length + vehicleGuides.length);
    expect(cards.every((card) => !("sections" in card))).toBe(true);
    expect(
      filterPublicContent(cards, { query: "", filter: "buying" }, "bg")
    ).toHaveLength(2);
    expect(
      filterPublicContent(
        cards,
        { query: "no-such-article", filter: "all" },
        "bg"
      )
    ).toEqual([]);
  });
  it("preserves the search/category when returning from an article", () => {
    const search = { query: "внос + EV", filter: "import" as const };
    expect(
      parseContentSearch(
        Object.fromEntries(new URLSearchParams(serializeContentSearch(search)))
      )
    ).toEqual(search);
    expect(parseContentSearch({ topic: "unknown", q: ["invalid"] })).toEqual({
      query: "",
      filter: "all",
    });
  });
});
