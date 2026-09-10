import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPublicLocalizedMetadata,
  getPublicInventoryRobots,
  getPublicSearchRobots,
} from "./public-metadata";

describe("public metadata contracts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the Day & Night hero for shared social metadata", () => {
    const metadata = createPublicLocalizedMetadata({
      baseUrl: "https://day-night.example",
      description: "Vehicle guides",
      locale: "en",
      path: "/guides",
      title: "Vehicle guides",
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        alt: "Vehicle guides",
        height: 630,
        url: "/lead-hero.jpg",
        width: 1200,
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      { alt: "Vehicle guides", url: "/lead-hero.jpg" },
    ]);
  });

  it("uses a truthful route image for both social metadata families", () => {
    const metadata = createPublicLocalizedMetadata({
      baseUrl: "https://day-night.example",
      description: "Listing description",
      image: "https://cdn.example/vehicle.webp",
      locale: "bg",
      path: "/listing/example",
      title: "Example vehicle",
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        alt: "Example vehicle",
        height: 630,
        url: "https://cdn.example/vehicle.webp",
        width: 1200,
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      {
        alt: "Example vehicle",
        url: "https://cdn.example/vehicle.webp",
      },
    ]);
  });

  it("keeps canonical landing pages indexable and noindexes query variants", () => {
    expect(getPublicSearchRobots()).toBeUndefined();
    expect(getPublicSearchRobots({ make: "BMW" })).toEqual({
      follow: true,
      index: false,
    });
    expect(
      getPublicSearchRobots({ make: "", page: undefined })
    ).toBeUndefined();
  });

  it("keeps static showroom inventory indexable without a production database", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");

    expect(getPublicInventoryRobots()).toBeUndefined();
  });

  it("keeps database-backed landing pages indexable but noindexes filters", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://configured");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    expect(getPublicInventoryRobots()).toBeUndefined();
    expect(getPublicInventoryRobots({ fuel: "diesel" })).toEqual({
      follow: true,
      index: false,
    });
  });
});
