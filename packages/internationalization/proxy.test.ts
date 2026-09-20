import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import type { Locale } from "./config";
import { createLocalePolicy, type LocaleConfiguration } from "./policy";
import { createLocaleRequestHandler } from "./request";

const configuration: LocaleConfiguration<Locale> = {
  schemaVersion: 1,
  dealerId: "test-dealer",
  dealerName: "Test Dealer",
  defaultLocale: "bg",
  enabledLocales: ["en", "bg"],
  dealerCountry: "BG",
  inventoryCurrency: "EUR",
  formatLocales: { en: "en-GB", bg: "bg-BG" },
  preferenceMaxAge: 15_552_000,
  promptVersion: "v1",
  suggestedLanguages: { BG: "bg", GB: "en" },
};
const handler = createLocaleRequestHandler(configuration);
const policy = createLocalePolicy(configuration);
const origin = "https://dealer.example";
const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(origin + path, { headers });
describe("native URL locale contract", () => {
  it.each([
    "en",
    "bg",
  ])("explicit %s beats every conflicting hint", (locale) => {
    const other = locale === "en" ? "bg" : "en";
    const response = handler(
      request(`/${locale}/contact?topic=trade-in&lang=${other}`, {
        cookie: `cars_locale=${other}`,
        "accept-language": other,
        "x-vercel-ip-country": other === "bg" ? "BG" : "GB",
        "x-automarket-internal-locale-rewrite": "1",
        "x-cars-locale": other,
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-language")).toBe(locale);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });
  it.each([
    [
      "/cars?lang=en&q=BMW",
      { cookie: "cars_locale=bg", "accept-language": "bg" },
      "/en/cars?lang=en&q=BMW",
    ],
    [
      "/cars",
      { cookie: "cars_locale=en", "accept-language": "bg" },
      "/en/cars",
    ],
    ["/cars", { "accept-language": "bg;q=0.5,en-GB;q=0.9" }, "/en/cars"],
    ["/cars", { "accept-language": "en;q=0,bg;q=0" }, "/bg/cars"],
  ] as const)("negotiates %s without persisting inferred preferences", (path, headers, destination) => {
    const response = handler(request(path, headers));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(origin + destination);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vercel-cdn-cache-control")).toBe("no-store");
  });
  it.each([
    "/api/preferences",
    "/api/ai/search",
    "/_next/static/a.js",
    "/images/car.webp",
    "/lead-logo.png",
  ])("preserves resource %s", (path) => {
    expect(handler(request(path)).headers.get("location")).toBeNull();
  });
  it.each([
    "ar",
    "de",
    "uk",
    "tr",
    "ro",
    "el",
    "fr",
  ])("does not enable %s", (locale) =>
    expect(handler(request(`/${locale}/cars`)).status).toBe(404));
  it("adds native basePath exactly once", () => {
    const req = new NextRequest(`${origin}/variant-2/cars?lang=en`, {
      nextConfig: { basePath: "/variant-2" },
    });
    expect(req.nextUrl.pathname).toBe("/cars");
    expect(handler(req).headers.get("location")).toBe(
      `${origin}/variant-2/en/cars?lang=en`
    );
  });
  it("cannot redirect to a hostile Host header", () =>
    expect(
      handler(request("/cars", { host: "evil.example" })).headers.get(
        "location"
      )
    ).toBe(`${origin}/bg/cars`));
  it("returns independent visitor state", () => {
    const a = policy.resolveLocale({
      url: new URL(`${origin}/en/cars`),
      cookie: "cars_country=GB; cars_locale=bg",
    });
    const b = policy.resolveLocale({
      url: new URL(`${origin}/bg/cars`),
      cookie: "cars_country=BG; cars_locale=en",
    });
    expect(a).toMatchObject({ locale: "en", country: "GB" });
    expect(b).toMatchObject({ locale: "bg", country: "BG" });
    a.country = "US";
    expect(b.country).toBe("BG");
  });
});

it("overwrites a forged public return path with the real request URL", () => {
  const response = createLocaleRequestHandler(configuration)(
    new NextRequest("https://dealer.example/en/contact?topic=trade-in", {
      headers: { "x-modern-public-path": "/bg/foreign" },
    })
  );
  expect(
    response.headers.get("x-middleware-request-x-modern-public-path")
  ).toBe("/en/contact?topic=trade-in");
});
