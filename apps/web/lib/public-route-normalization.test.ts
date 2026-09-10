import { describe, expect, it } from "vitest";
import { getCanonicalTaxonomyPathname } from "./public-route-normalization";

describe("public taxonomy route normalization", () => {
  it.each([
    ["/cars/BMW", "/cars/bmw"],
    ["/bg/cars/BMW/X5-XDRIVE40D", "/bg/cars/bmw/x5-xdrive40d"],
    ["/en/cars/Mercedes-Benz", "/en/cars/mercedes-benz"],
  ])("normalizes %s to %s", (pathname, expected) => {
    expect(getCanonicalTaxonomyPathname(pathname)).toBe(expected);
  });

  it.each([
    "/cars",
    "/cars/bmw",
    "/bg/cars/bmw/x5-xdrive40d",
    "/dealers/BMW",
    "/cars/bmw/x5/extra",
    "/cars/BM%20W",
  ])("does not redirect canonical or unrelated path %s", (pathname) => {
    expect(getCanonicalTaxonomyPathname(pathname)).toBeUndefined();
  });
});
