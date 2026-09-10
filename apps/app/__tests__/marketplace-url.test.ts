import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicMarketplaceSearchHref } from "../app/(authenticated)/marketplace-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public marketplace URLs", () => {
  it("creates localized production search URLs with structured filters", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_WEB_URL", "https://automarket.example/");

    expect(
      getPublicMarketplaceSearchHref({
        category: "truck",
        location: "Sofia",
        q: "MAN TGS",
      })
    ).toBe(
      "https://automarket.example/bg?category=truck&q=MAN+TGS&location=Sofia"
    );
  });
});
