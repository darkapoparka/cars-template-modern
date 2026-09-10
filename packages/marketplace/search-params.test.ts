import { describe, expect, it } from "vitest";
import {
  createMarketplaceSearchParams,
  parseMarketplaceSearchParams,
  withSearchParamUpdates,
} from "./search-params";

describe("marketplace search currency safety", () => {
  it("defaults price ranges to BGN", () => {
    const filters = parseMarketplaceSearchParams({ priceMax: "50000" });

    expect(filters.currency).toBe("BGN");
    expect(createMarketplaceSearchParams(filters).get("currency")).toBe("BGN");
  });

  it("defaults price ordering to BGN", () => {
    expect(parseMarketplaceSearchParams({ sort: "price_asc" }).currency).toBe(
      "BGN"
    );
  });

  it("preserves an explicit supported currency", () => {
    expect(
      parseMarketplaceSearchParams({
        currency: "EUR",
        priceMin: "10000",
      }).currency
    ).toBe("EUR");
  });

  it("does not constrain non-price discovery by currency", () => {
    expect(parseMarketplaceSearchParams({ sort: "newest" }).currency).toBe(
      undefined
    );
  });

  it("normalizes an inverted range supplied by a URL", () => {
    expect(
      parseMarketplaceSearchParams({ priceMax: "20000", priceMin: "50000" })
    ).toMatchObject({ priceMax: 50_000, priceMin: 20_000 });
  });

  it("clears an incompatible minimum when a lower maximum preset is chosen", () => {
    const current = parseMarketplaceSearchParams({
      priceMax: "70000",
      priceMin: "50000",
    });

    expect(withSearchParamUpdates(current, { priceMax: 20_000 })).toMatchObject(
      {
        priceMax: 20_000,
        priceMin: undefined,
      }
    );
  });

  it("clears an incompatible maximum when a higher minimum is chosen", () => {
    const current = parseMarketplaceSearchParams({
      priceMax: "70000",
      priceMin: "50000",
    });

    expect(withSearchParamUpdates(current, { priceMin: 90_000 })).toMatchObject(
      {
        priceMax: undefined,
        priceMin: 90_000,
      }
    );
  });
});
