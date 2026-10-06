import { publicSiteSchema } from "@repo/marketplace-domain/site-config";
import { describe, expect, it } from "vitest";
import { leadSite } from "./lead-site";
import { createPublicSiteConfig, isPublicSitePathEnabled } from "./site-config";

const dealer = (overrides: Partial<typeof leadSite> = {}) =>
  createPublicSiteConfig({ ...leadSite, ...overrides });

describe("public dealership configuration", () => {
  it("exposes the services index only when a dealer offers a vehicle service", () => {
    const services = {
      buy: false,
      sell: false,
      imports: false,
      lease: false,
      editorial: true,
    };
    expect(isPublicSitePathEnabled("/services", dealer({ services }))).toBe(
      false
    );
    expect(
      isPublicSitePathEnabled(
        "/bg/services",
        dealer({ services: { ...services, imports: true } })
      )
    ).toBe(true);
    expect(
      isPublicSitePathEnabled(
        "/en/services",
        dealer({ services: { ...services, lease: true } })
      )
    ).toBe(true);
  });
  it("supports a dealer-specific desktop filter layout and rejects unknown layouts", () => {
    expect(dealer().inventory?.desktopFilterLayout).toBe("quick");
    expect(
      dealer({ desktopInventoryFilterLayout: "sidebar" }).inventory
        ?.desktopFilterLayout
    ).toBe("sidebar");
    expect(() =>
      publicSiteSchema.parse({
        ...dealer(),
        inventory: { desktopFilterLayout: "unknown" },
      })
    ).toThrow();
  });
  it("keeps the desktop master wordmark separate from mobile and dealer identities", () => {
    const master = dealer();
    expect(master.identity.name).toBe(leadSite.name);
    expect(master.identity.logo).toBe(leadSite.logoPath);
    expect(master.identity.desktopPreview?.name).toBe("Modern");
    expect(
      dealer({ slug: "client-motors" }).identity.desktopPreview
    ).toBeUndefined();
    expect(
      dealer({ staticDemoMode: false }).identity.desktopPreview
    ).toBeUndefined();
  });

  it("allows desktop context artwork to be adapted without changing mobile artwork", () => {
    const source = dealer();
    const adapted = dealer({
      artwork: {
        desktopPageBanner: {
          left: "/dealer/left.webp",
          right: "/dealer/right.webp",
        },
      },
    });
    expect(adapted.artwork.desktopPageBanner?.left).toBe("/dealer/left.webp");
    expect(adapted.artwork.heroScene).toBe(source.artwork.heroScene);
    expect(() =>
      dealer({
        artwork: {
          desktopPageBanner: {
            left: "//external.test/a.webp",
            right: "/right.webp",
          },
        },
      })
    ).toThrow();
  });
  it("adapts the About illustration set and validates its asset paths", () => {
    const source = dealer();
    const aboutBenefits = {
      choice: "/dealer/choice.webp",
      details: "/dealer/details.webp",
      budget: "/dealer/budget.webp",
      viewing: "/dealer/viewing.webp",
    };
    const adapted = dealer({ artwork: { aboutBenefits } });
    expect(adapted.artwork.aboutBenefits).toEqual(aboutBenefits);
    expect(adapted.artwork.financeHero).toBe(source.artwork.financeHero);
    expect(source.artwork.aboutBenefits?.choice).toBe(
      "/images/about/charcoal-choice-v1.webp"
    );
    expect(() =>
      dealer({
        artwork: {
          aboutBenefits: { ...aboutBenefits, choice: "//external.test/a.webp" },
        },
      })
    ).toThrow();
  });
  it("adapts desktop service cards independently and respects older dealer sets", () => {
    const source = dealer();
    const cards = {
      browse: "/dealer/cards-browse.webp",
      sell: "/dealer/cards-sell.webp",
      finance: "/dealer/cards-finance.webp",
      imports: "/dealer/cards-imports.webp",
    };
    const adapted = dealer({ artwork: { desktopServiceCards: cards } });
    expect(adapted.artwork.desktopServiceCards).toEqual(cards);
    expect(adapted.artwork.desktopServices).toEqual(
      source.artwork.desktopServices
    );
    const legacy = dealer({ artwork: { desktopServices: cards } });
    expect(legacy.artwork.desktopServiceCards).toEqual(cards);
    expect(legacy.artwork.desktopServices).toEqual(cards);
    expect(() =>
      dealer({
        artwork: {
          desktopServiceCards: {
            ...cards,
            imports: "//external.test/cargo.webp",
          },
        },
      })
    ).toThrow();
  });
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
      tagline: "Fictional dealer A",
      address: "1 Test Street",
      city: "Test City A",
      country: "Test country A",
      countryCode: "BG",
      phoneDisplay: "+359 200 000 001",
      phoneHref: "tel:+359200000001",
      contactUrl: "tel:+359200000001",
      email: "team@atlas.example",
      logoPath: "/fixtures/atlas/logo.webp",
      logoInversePath: "/fixtures/atlas/logo-inverse.webp",
      iconPath: "/fixtures/atlas/icon.webp",
      mapsUrl: "https://maps.example/atlas",
      mapsEmbedUrl: "https://maps.example/embed/atlas",
      socialLinks: {},
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
      tagline: "Fictional dealer B",
      address: "2 Test Street",
      city: "Test City B",
      country: "Test country B",
      countryCode: "GB",
      phoneDisplay: "+44 200 000 002",
      phoneHref: "tel:+44200000002",
      contactUrl: "tel:+44200000002",
      email: "team@north.example",
      logoPath: "/fixtures/north/logo.webp",
      logoInversePath: "/fixtures/north/logo-inverse.webp",
      iconPath: "/fixtures/north/icon.webp",
      mapsUrl: "https://maps.example/north",
      mapsEmbedUrl: "https://maps.example/embed/north",
      socialLinks: {},
    });
    expect(atlas.identity.name).not.toBe(north.identity.name);
    for (const site of [atlas, north]) {
      const identity = JSON.stringify({
        identity: site.identity,
        contact: site.contact,
      });
      expect(identity).not.toContain(leadSite.name);
      expect(identity).not.toContain(leadSite.phoneHref);
      expect(identity).not.toContain(leadSite.address);
      expect(site.contact.socialLinks).toEqual({});
    }
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

it("uses the master scene without hiding explicit dealer cutouts", () => {
  expect(dealer().artwork.heroScene).toBe("/lead-car-showroom-scene-v3.webp");
  expect(
    dealer({ artwork: { heroLeft: "/custom-car.webp" } }).artwork.heroScene
  ).toBeUndefined();
  expect(
    dealer({ artwork: { heroScene: "/custom-scene.webp" } }).artwork.heroScene
  ).toBe("/custom-scene.webp");
});
it("rejects unsafe scene URLs", () => {
  expect(() =>
    dealer({ artwork: { heroScene: "https://example.invalid/scene.webp" } })
  ).toThrow();
});

describe("desktop discovery vehicles", () => {
  it("supports a complete dealer pair with independent geometry", () => {
    const master = dealer();
    const pair = {
      left: {
        src: "/dealer/left.webp",
        width: 1200,
        height: 800,
        baseline: 650,
      },
      right: {
        src: "/dealer/right.webp",
        width: 900,
        height: 600,
        baseline: 480,
        mirrored: true,
      },
    };
    const adapted = dealer({ artwork: { desktopDiscoveryVehicles: pair } });
    expect(adapted.artwork.desktopDiscoveryVehicles).toEqual(pair);
    expect(adapted.artwork.heroScene).toBe(master.artwork.heroScene);
    expect(master.artwork.desktopDiscoveryVehicles?.left.mirrored).toBe(true);
  });

  it.each([
    { desktopHeroScene: "/dealer/desktop.webp" },
    { heroScene: "/dealer/scene.webp" },
    { heroLeft: "/dealer/cutout.webp" },
    { heroRight: "/dealer/cutout.webp" },
    { desktopDiscoveryVehicles: undefined },
  ])("preserves explicitly personalized legacy artwork: %j", (artwork) => {
    expect(
      dealer({ artwork }).artwork.desktopDiscoveryVehicles
    ).toBeUndefined();
  });

  it("rejects incomplete pairs, unsafe paths and invalid baseline geometry", () => {
    const source = dealer();
    const pair = source.artwork.desktopDiscoveryVehicles;
    expect(pair).toBeDefined();
    for (const replacement of [
      { left: pair?.left },
      { ...pair, left: { ...pair?.left, src: "//external.test/car.webp" } },
      { ...pair, left: { ...pair?.left, baseline: 668 } },
      { ...pair, right: { ...pair?.right, width: 0 } },
    ]) {
      expect(() =>
        publicSiteSchema.parse({
          ...source,
          artwork: { ...source.artwork, desktopDiscoveryVehicles: replacement },
        })
      ).toThrow();
    }
  });
});
