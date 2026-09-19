import { publicSiteSchema } from "@repo/marketplace-domain/site-config";
import { describe, expect, it } from "vitest";
import { leadSite } from "./lead-site";
import { createPublicSiteConfig, isPublicSitePathEnabled } from "./site-config";

const dealer = (overrides: Partial<typeof leadSite> = {}) =>
  createPublicSiteConfig({ ...leadSite, ...overrides });

describe("public dealership configuration", () => {
  it.each([
    true,
    false,
  ])("keeps an explicit dealership when staticDemoMode=%s", (staticDemoMode) => {
    expect(dealer({ staticDemoMode }).kind).toBe("dealership");
  });
  it("retains an explicitly selected legacy marketplace", () => {
    expect(
      dealer({ websiteKind: "marketplace", staticDemoMode: true }).kind
    ).toBe("marketplace");
  });
  it("adapts older Cars snapshots at one compatibility boundary", () => {
    expect(dealer({ websiteKind: undefined, staticDemoMode: true }).kind).toBe(
      "dealership"
    );
    expect(dealer({ websiteKind: undefined, staticDemoMode: false }).kind).toBe(
      "marketplace"
    );
  });
  it.each([
    "red; background:url(https://example.com)",
    "#fff",
    "var(--other)",
    "url(javascript:alert(1))",
  ])("rejects arbitrary theme input: %s", (accent) => {
    expect(() => dealer({ accent })).toThrow();
  });
  it.each([
    "//example.com/logo.png",
    "/../secret.png",
    "javascript:alert(1)",
    "",
  ])("rejects unsafe artwork: %s", (logoPath) => {
    expect(() => dealer({ logoPath })).toThrow();
  });
  it("validates identity, phone, locale and duplicate categories", () => {
    expect(() => dealer({ name: " " })).toThrow();
    expect(() => dealer({ phoneHref: "javascript:alert(1)" })).toThrow();
    expect(() =>
      dealer({ publicLocales: ["en"], publicDefaultLocale: "bg" })
    ).toThrow();
    expect(() => dealer({ inventoryCategories: ["car", "car"] })).toThrow();
  });
  it("builds two independent fictional identities without changing UI modules", () => {
    const atlas = dealer({
      name: "Atlas Demo Motors",
      shortName: "Atlas",
      slug: "atlas-demo",
      accent: "#164e63",
      services: { imports: false },
    });
    const north = dealer({
      name: "North Demo Vehicle Company",
      shortName: "North",
      slug: "north-demo",
      accent: "#facc15",
      locale: "en-GB",
      publicLocales: ["en"],
      publicDefaultLocale: "en",
      currency: "EUR",
      services: { lease: false },
    });
    expect(atlas.identity.name).not.toBe(north.identity.name);
    expect(atlas.services.lease).toBe(true);
    expect(north.market.defaultLocale).toBe("en");
    expect(isPublicSitePathEnabled("/bg/imports/china", atlas)).toBe(false);
    expect(isPublicSitePathEnabled("/en/lease", north)).toBe(false);
    expect(isPublicSitePathEnabled("/contact", north)).toBe(true);
  });
  it("applies one service/category policy to localized and query-bearing paths", () => {
    const site = dealer({
      inventoryCategories: ["car"],
      services: { editorial: false, sell: false },
    });
    for (const pathname of [
      "/blog",
      "/guides/buying",
      "/en/blog/article",
      "/trucks",
      "/vans",
      "/sell?draft=1",
    ]) {
      expect(isPublicSitePathEnabled(pathname, site)).toBe(false);
    }
    expect(isPublicSitePathEnabled("/cars/bmw/x5?sort=newest", site)).toBe(
      true
    );
    expect(isPublicSitePathEnabled("/legal/privacy", site)).toBe(true);
  });
  it("does not expose unexpected credential fields in the public DTO", () => {
    const site = dealer();
    expect(
      publicSiteSchema.parse({ ...site, DATABASE_URL: "secret" })
    ).not.toHaveProperty("DATABASE_URL");
  });
});
