import { leadSite, type VehicleCategory } from "@repo/marketplace";
import { describe, expect, it } from "vitest";
import { createCategoryMetadata } from "./public-route-metadata";

const modelCanonicalPath = /\/en\/cars\/bmw\/x5$/;

describe("inventory metadata", () => {
  it.each(
    (
      ["car", "lease", "motorbike", "truck", "van"] as VehicleCategory[]
    ).flatMap((category) =>
      ["bg", "en"].map((locale) => ({ category, locale }))
    )
  )("includes the configured dealer once for $locale $category", (input) => {
    const metadata = createCategoryMetadata(input);
    expect(String(metadata.title).split(leadSite.name)).toHaveLength(2);
    expect(String(metadata.openGraph?.title).split(leadSite.name)).toHaveLength(
      2
    );
  });

  it("retains make/model context and query indexing policy", () => {
    const metadata = createCategoryMetadata({
      category: "car",
      locale: "en",
      make: "BMW",
      model: "X5",
      path: "/cars/bmw/x5",
      searchParams: { priceMax: "150000" },
    });
    expect(metadata.title).toBe(`BMW X5 | ${leadSite.name}`);
    expect(String(metadata.alternates?.canonical)).toMatch(modelCanonicalPath);
    expect(metadata.robots).toMatchObject({ follow: true, index: false });
  });
});
