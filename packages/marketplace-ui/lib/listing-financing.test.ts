import { describe, expect, it } from "vitest";
import { formatListingMonthlyEstimate } from "./listing-financing";

const expectedEuroEstimate = /956\s*€/u;

describe("PDP monthly estimate", () => {
  it("converts the existing BGN estimate to a rounded euro amount", () => {
    expect(
      formatListingMonthlyEstimate({ amount: 1870, currency: "BGN" }, "bg")
    ).toMatch(expectedEuroEstimate);
  });

  it("preserves an estimate already expressed in euros", () => {
    expect(
      formatListingMonthlyEstimate({ amount: 956, currency: "EUR" }, "bg")
    ).toMatch(expectedEuroEstimate);
  });

  it("does not invent an estimate when none is supplied", () => {
    expect(formatListingMonthlyEstimate(undefined, "bg")).toBeUndefined();
  });
});
