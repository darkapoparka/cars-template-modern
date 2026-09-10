import { describe, expect, it } from "vitest";
import { formatMileage, formatMoney } from "./format";

describe("locale-aware marketplace formatting", () => {
  it("formats Bulgarian currency and mileage", () => {
    expect(formatMoney({ amount: 42_500, currency: "BGN" }, "bg")).toContain(
      "42"
    );
    expect(formatMoney({ amount: 42_500, currency: "BGN" }, "bg")).toContain(
      "лв"
    );
    expect(formatMileage(123_456, "bg")).toContain("123");
    expect(formatMileage(123_456, "bg")).toContain("км");
  });

  it("keeps an English Bulgaria-aware formatter as the default", () => {
    expect(formatMoney({ amount: 42_500, currency: "EUR" }, "en")).toContain(
      "€"
    );
    expect(formatMileage(123_456, "en")).toContain("km");
  });
});
