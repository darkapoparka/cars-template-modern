import { describe, expect, it } from "vitest";
import { getQuickFilterClearUpdates } from "./quick-filter-state";

describe("getQuickFilterClearUpdates", () => {
  it("clears the complete make and model dependency chain", () => {
    expect(getQuickFilterClearUpdates("make-model")).toEqual({
      derivative: undefined,
      make: undefined,
      model: undefined,
      trim: undefined,
    });
  });

  it("clears range metadata with the range values", () => {
    expect(getQuickFilterClearUpdates("price")).toEqual({
      currency: undefined,
      priceMax: undefined,
      priceMin: undefined,
    });
    expect(getQuickFilterClearUpdates("location")).toEqual({
      location: undefined,
      radius: undefined,
    });
  });

  it("restores the default sort", () => {
    expect(getQuickFilterClearUpdates("sort")).toEqual({
      sort: "recommended",
    });
  });
});
