import { describe, expect, it } from "vitest";
import { formatListingMonthlyEstimate } from "./listing-financing";

const expectedEuroEstimate = /956\s*€/u;
const expectedLevEstimate = /1\s*870\s*лв\./u;
const expectedEnglishLevEstimate = /BGN\s*1,360/u;

describe("PDP monthly estimate", () => {
  it("keeps a BGN estimate in its supplied currency", () => {
    expect(
      formatListingMonthlyEstimate({ amount: 1870, currency: "BGN" }, "bg")
    ).toMatch(expectedLevEstimate);
  });

  it("preserves an estimate already expressed in euros", () => {
    expect(
      formatListingMonthlyEstimate({ amount: 956, currency: "EUR" }, "bg")
    ).toMatch(expectedEuroEstimate);
  });

  it("does not invent an estimate when none is supplied", () => {
    expect(formatListingMonthlyEstimate(undefined, "bg")).toBeUndefined();
  });

  it("preserves other currencies and the requested locale", () => {
    expect(
      formatListingMonthlyEstimate({ amount: 1360, currency: "BGN" }, "en")
    ).toMatch(expectedEnglishLevEstimate);
    expect(
      formatListingMonthlyEstimate({ amount: 800, currency: "USD" }, "en")
    ).toContain("800");
  });
});
