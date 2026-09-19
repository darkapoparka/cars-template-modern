import { leadSite } from "@repo/marketplace/lead-site";
import { createPublicSiteConfig } from "@repo/marketplace/site-config";
import { describe, expect, it } from "vitest";
import {
  getPublicLocales,
  normalizePublicLocale,
} from "./public-locale-policy";

describe("public locale policy", () => {
  it.each([
    true,
    false,
  ])("keeps configured languages with staticDemoMode=%s", (staticDemoMode) => {
    const site = createPublicSiteConfig({
      ...leadSite,
      staticDemoMode,
      publicLocales: ["bg"],
    });
    expect(getPublicLocales(site)).toEqual(["bg"]);
    expect(normalizePublicLocale("en", getPublicLocales(site))).toBe("bg");
  });
  it("supports an explicit multilingual dealership", () => {
    const site = createPublicSiteConfig({
      ...leadSite,
      publicLocales: ["en", "bg"],
      publicDefaultLocale: "en",
    });
    expect(getPublicLocales(site)).toEqual(["en", "bg"]);
    expect(normalizePublicLocale("en-GB", getPublicLocales(site))).toBe("en");
  });
});
