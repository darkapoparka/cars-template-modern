import { describe, expect, it } from "vitest";
import {
  getCanonicalBaseUrl,
  getCanonicalUrl,
  getLanguageAlternates,
  getLocalizedPath,
  normalizeSeoLocale,
} from "./urls";

const HTTP_PROTOCOL_ERROR = /must use HTTP\(S\)/;

describe("Day & Night SEO URLs", () => {
  it("normalizes Bulgarian variants and falls back to the route default", () => {
    expect(normalizeSeoLocale("bg-BG")).toBe("bg");
    expect(normalizeSeoLocale("en_US")).toBe("en");
    expect(normalizeSeoLocale("de")).toBe("bg");
  });

  it("uses explicit paths for both locales independent of default", () => {
    expect(getLocalizedPath("en", "/cars")).toBe("/en/cars");
    expect(getLocalizedPath("bg", "/cars")).toBe("/bg/cars");
    expect(getLocalizedPath("bg", "/")).toBe("/bg");
    expect(getLocalizedPath("en", "/cars", { defaultLocale: "en" })).toBe(
      "/en/cars"
    );
  });

  it("builds clean absolute canonical URLs", () => {
    expect(
      getCanonicalBaseUrl("https://day-night.example/stale?x=1#top").toString()
    ).toBe("https://day-night.example/");
    expect(
      getCanonicalUrl("cars/toyota", { baseUrl: "https://day-night.example" })
    ).toBe("https://day-night.example/cars/toyota");
  });

  it("emits Bulgarian, English, and x-default alternates", () => {
    expect(
      getLanguageAlternates("/cars", {
        baseUrl: "https://day-night.example",
      })
    ).toEqual({
      en: "https://day-night.example/en/cars",
      "bg-BG": "https://day-night.example/bg/cars",
      "x-default": "https://day-night.example/bg/cars",
    });
  });

  it("rejects non-HTTP canonical origins", () => {
    expect(() => getCanonicalBaseUrl("javascript:alert(1)")).toThrow(
      HTTP_PROTOCOL_ERROR
    );
  });
});
