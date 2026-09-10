import { describe, expect, it } from "vitest";
import {
  getKeyedListingGalleryImages,
  getNextGalleryIndex,
  getPreviousGalleryIndex,
} from "./listing-gallery-policy";

describe("listing gallery policy", () => {
  it("creates stable keys for duplicate URLs", () => {
    const keyed = getKeyedListingGalleryImages([
      { alt: "first", url: "/a.jpg" },
      { alt: "second", url: "/a.jpg" },
    ]);
    expect(keyed.map((item) => item.key)).toEqual([
      "/a.jpg::0",
      "/a.jpg::1",
    ]);
  });

  it("wraps navigation safely", () => {
    expect(getPreviousGalleryIndex(0, 3)).toBe(2);
    expect(getNextGalleryIndex(2, 3)).toBe(0);
    expect(getNextGalleryIndex(0, 0)).toBe(0);
  });
});
