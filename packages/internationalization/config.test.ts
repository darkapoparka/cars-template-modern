import { describe, expect, it } from "vitest";
import {
  defaultLocale,
  getIntlLocale,
  isLocale,
  marketplaceLocales,
  normalizeLocale,
} from "./config";
import { formatCurrency, formatDate, formatNumber } from "./format";

describe("locale configuration", () => {
  it("supports Bulgarian and English marketplace routes", () => {
    expect(marketplaceLocales).toEqual(["en", "bg"]);
    expect(isLocale("bg")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(normalizeLocale("bg-BG")).toBe("bg");
    expect(normalizeLocale("BG_bg")).toBe("bg");
    expect(normalizeLocale("de-DE")).toBe("en");
  });

  it("falls back safely for empty and unsupported locales", () => {
    expect(normalizeLocale(undefined)).toBe(defaultLocale);
    expect(normalizeLocale("not-a-locale")).toBe(defaultLocale);
    expect(getIntlLocale("not-a-locale")).toBe("en-GB");
  });
});

describe("locale-aware formatting", () => {
  it("uses Bulgarian grouping and currency conventions", () => {
    expect(formatNumber(12_345, "bg")).toBe(
      new Intl.NumberFormat("bg-BG").format(12_345)
    );
    expect(formatCurrency(12_345, "BGN", "bg")).toBe(
      new Intl.NumberFormat("bg-BG", {
        currency: "BGN",
        maximumFractionDigits: 0,
        style: "currency",
      }).format(12_345)
    );
  });

  it("formats English independently and handles invalid dates", () => {
    expect(formatCurrency(12_345, "EUR", "en")).toBe(
      new Intl.NumberFormat("en-GB", {
        currency: "EUR",
        maximumFractionDigits: 0,
        style: "currency",
      }).format(12_345)
    );
    expect(formatDate("not-a-date", "bg")).toBe("");
  });
});
