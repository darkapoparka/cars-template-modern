import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import {
  getAccountListingSaveFlowHref,
  getAccountSavedSearchFlowHref,
} from "./account-save-flow";

describe("account listing save flow", () => {
  it("targets the authenticated search route with the exact listing title", () => {
    expect(
      getAccountListingSaveFlowHref("https://app.automarket.bg/", {
        category: "truck",
        title: "MAN TGS 18.500 & trailer",
      })
    ).toBe(
      "https://app.automarket.bg/search?category=truck&q=MAN+TGS+18.500+%26+trailer"
    );
  });

  it("does not invent a public fallback when the account app is unavailable", () => {
    expect(
      getAccountListingSaveFlowHref(undefined, {
        category: "car",
        title: "BMW 320d",
      })
    ).toBeUndefined();
  });

  it("preserves public filters in the authenticated saved-search flow", () => {
    const filters = parseMarketplaceSearchParams({
      category: "van",
      fuel: "diesel",
      location: "Sofia",
      priceMax: 40_000,
    });

    expect(
      getAccountSavedSearchFlowHref("https://app.automarket.bg", filters)
    ).toBe(
      "https://app.automarket.bg/search?category=van&location=Sofia&priceMax=40000&currency=BGN&fuel=diesel"
    );
  });
});
