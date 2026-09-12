import { describe, expect, it } from "vitest";
import {
  getPublicLocales,
  normalizePublicLocale,
} from "./public-locale-policy";

describe("public locale policy", () => {
  it("exposes only the canonical language in static showroom mode", () => {
    expect(getPublicLocales(true)).toEqual(["bg"]);
    expect(normalizePublicLocale("en", getPublicLocales(true))).toBe("bg");
    expect(normalizePublicLocale("bg-BG", getPublicLocales(true))).toBe("bg");
  });

  it("retains English support for multilingual deployments", () => {
    expect(getPublicLocales(false)).toEqual(["en", "bg"]);
    expect(normalizePublicLocale("en-GB", getPublicLocales(false))).toBe("en");
    expect(normalizePublicLocale("unsupported", getPublicLocales(false))).toBe(
      "bg"
    );
  });
});
