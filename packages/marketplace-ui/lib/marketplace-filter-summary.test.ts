import { parseMarketplaceSearchParams } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import { getMarketplaceFilterSummary } from "./marketplace-filter-summary";

describe("full filter summaries", () => {
  const filters = parseMarketplaceSearchParams({
    body: "wagon",
    deliverTo: "BG",
    mileageMax: 125_000,
    priceMax: 70_000,
    priceMin: 50_000,
  });

  it("exposes active body and range values in Bulgarian", () => {
    expect(getMarketplaceFilterSummary("body", filters, "bg")).toBe("Комби");
    expect(getMarketplaceFilterSummary("price", filters, "bg")).toBe(
      "50000 лв.–70000 лв."
    );
    expect(getMarketplaceFilterSummary("mileage", filters, "bg")).toBe(
      "До 125\u00a0000 km"
    );
  });

  it("returns no summary for an inactive filter", () => {
    expect(getMarketplaceFilterSummary("fuel", filters, "bg")).toBeUndefined();
  });
});
