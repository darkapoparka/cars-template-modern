import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class PublicMarketplaceUnavailableError extends Error {
    constructor(message = "Public marketplace data is unavailable") {
      super(message);
      this.name = "PublicMarketplaceUnavailableError";
    }
  }

  return {
    getPublicSitemapData: vi.fn(),
    publicLocales: ["en", "bg"] as ("en" | "bg")[],
    PublicMarketplaceUnavailableError,
  };
});

vi.mock("@/lib/public-marketplace-data", () => ({
  getPublicSitemapData: mocks.getPublicSitemapData,
  PublicMarketplaceUnavailableError: mocks.PublicMarketplaceUnavailableError,
}));

vi.mock("@/lib/public-locale-policy", () => ({
  getPublicLocales: () => mocks.publicLocales,
}));

vi.mock("@/lib/public-url", () => ({
  getPublicWebBaseUrl: () => "https://day-night.example",
}));

vi.mock("@/lib/vehicle-guides", () => ({
  vehicleGuides: [{ slug: "buying-guide" }],
}));

vi.mock("@/lib/public-blog-posts", () => ({
  publicBlogPosts: [{ slug: "example-article" }],
}));

import sitemap, { dynamic } from "./sitemap";

describe("public sitemap", () => {
  beforeEach(() => {
    mocks.publicLocales = ["en", "bg"];
    mocks.getPublicSitemapData.mockResolvedValue({
      listings: [
        {
          slug: "vehicle-one",
          updatedAt: new Date("2026-07-11T12:00:00.000Z"),
        },
      ],
      taxonomy: [{ make: "BMW", model: "X5" }],
    });
  });

  it("enumerates inventory at request time without blocking deployments", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("includes only intentional localized Day & Night routes", async () => {
    const entries = await sitemap();
    const urls = entries.map(({ url }) => url);

    expect(urls).toEqual(
      expect.arrayContaining([
        "https://day-night.example/bg/guides",
        "https://day-night.example/en/guides",
        "https://day-night.example/en/contact",
        "https://day-night.example/bg/legal/privacy",
        "https://day-night.example/en/legal/privacy",
        "https://day-night.example/bg/legal/terms",
        "https://day-night.example/en/legal/terms",
        "https://day-night.example/bg/listing/vehicle-one",
        "https://day-night.example/bg/cars/bmw/x5",
        "https://day-night.example/bg/guides/example-article",
        "https://day-night.example/en/guides/example-article",
      ])
    );
    expect(
      entries.filter(({ url }) => url.endsWith("/legal/privacy"))
    ).toHaveLength(2);
    expect(urls).not.toContain("https://day-night.example/bg/blog");
    expect(urls).not.toContain("https://day-night.example/en/blog");
    expect(urls).not.toContain("https://day-night.example/bg/pricing");
    expect(urls).not.toContain("https://day-night.example/bg/registry");
    expect(urls).not.toContain("https://day-night.example/bg/dealers");
    expect(urls).not.toContain(
      "https://day-night.example/en/dealers/trusted-dealer"
    );
    expect(
      entries.find(
        ({ url }) => url === "https://day-night.example/en/legal/privacy"
      )?.alternates?.languages
    ).toEqual({
      en: "https://day-night.example/en/legal/privacy",
      "bg-BG": "https://day-night.example/bg/legal/privacy",
      "x-default": "https://day-night.example/bg/legal/privacy",
    });
  });

  it("omits disabled languages in Bulgarian-only showroom mode", async () => {
    mocks.publicLocales = ["bg"];
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(({ url }) => !url.includes("/en/"))).toBe(true);
    for (const entry of entries) {
      expect(entry.alternates?.languages).not.toHaveProperty("en");
      expect(entry.alternates?.languages).toHaveProperty("bg-BG");
    }
  });

  it("preserves source dates and omits invented timestamps", async () => {
    const entries = await sitemap();
    const byUrl = new Map(entries.map((entry) => [entry.url, entry]));

    expect(
      byUrl.get("https://day-night.example/bg/listing/vehicle-one")
        ?.lastModified
    ).toEqual(new Date("2026-07-11T12:00:00.000Z"));
    expect(byUrl.get("https://day-night.example/bg/guides")).not.toHaveProperty(
      "lastModified"
    );
    expect(
      byUrl.get("https://day-night.example/bg/cars/bmw/x5")
    ).not.toHaveProperty("lastModified");
  });

  it("keeps static routes indexable when marketplace inventory is unavailable", async () => {
    mocks.getPublicSitemapData.mockRejectedValueOnce(
      new mocks.PublicMarketplaceUnavailableError("database unavailable")
    );

    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls).toContain("https://day-night.example/bg/cars");
    expect(urls).toContain("https://day-night.example/en/cars");
    expect(urls).not.toContain(
      "https://day-night.example/bg/listing/vehicle-one"
    );
    expect(urls).not.toContain(
      "https://day-night.example/bg/dealers/trusted-dealer"
    );
    expect(urls).not.toContain("https://day-night.example/bg/cars/bmw/x5");
  });

  it("still propagates unexpected sitemap failures", async () => {
    mocks.getPublicSitemapData.mockRejectedValueOnce(
      new Error("unexpected database response")
    );

    await expect(sitemap()).rejects.toThrow("unexpected database response");
  });
});
