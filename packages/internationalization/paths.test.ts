import { describe, expect, it } from "vitest";
import {
  localizedPath,
  safePreferenceDestination,
  withBasePath,
  withoutBasePath,
} from "./paths";

describe("native mounted link boundaries", () => {
  it.each(["en", "bg"])("keeps %s explicit and idempotent", (locale) => {
    expect(localizedPath(locale, "/cars?make=BMW#results")).toBe(
      `/${locale}/cars?make=BMW#results`
    );
    expect(localizedPath(locale, "/bg/cars")).toBe(`/${locale}/cars`);
    expect(
      localizedPath(locale, "/variant-2/en/contact?topic=trade-in#form")
    ).toBe(`/variant-2/${locale}/contact?topic=trade-in#form`);
  });
  it.each([
    "/en/cars",
    "/api/preferences",
    "/lead-logo.png",
  ])("adds mount once for raw destination %s", (href) => {
    expect(withBasePath(href, "/variant-2")).toBe(`/variant-2${href}`);
    expect(withBasePath(`/variant-2${href}`, "/variant-2")).toBe(
      `/variant-2${href}`
    );
    expect(withoutBasePath(`/variant-2${href}`, "/variant-2")).toBe(href);
  });
  it.each([
    "https://other.example/cars",
    "//other.example/cars",
    "tel:+359123",
    "mailto:dealer@example.com",
    "#details",
    "?q=BMW",
  ])("does not rewrite non-route destination %s", (href) => {
    expect(localizedPath("bg", href)).toBe(href);
    expect(withBasePath(href, "/variant-2")).toBe(href);
  });
  it("preserves other design bases", () =>
    expect(withBasePath("/variant-3/bg/cars", "/variant-2")).toBe(
      "/variant-3/bg/cars"
    ));
  it("rejects hostile or unlocalized preference destinations", () => {
    for (const value of [
      "//evil.example",
      "/api/preferences",
      "/cars",
      "https://evil.example",
      "/ar/cars",
    ]) {
      expect(
        safePreferenceDestination(value, "https://dealer.example")
      ).toBeNull();
    }
    expect(
      safePreferenceDestination(
        "/variant-2/bg/contact?topic=trade-in#form",
        "https://dealer.example"
      )
    ).toBe("/variant-2/bg/contact?topic=trade-in#form");
  });
});
