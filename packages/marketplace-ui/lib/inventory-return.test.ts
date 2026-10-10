import { afterEach, expect, it, vi } from "vitest";
import {
  getInventoryReturnHref,
  prepareInventoryReturn,
  readInventoryReturn,
  rememberInventoryReturn,
  takeInventoryReturnScrollY,
} from "./inventory-return";

afterEach(() => {
  takeInventoryReturnScrollY();
  vi.unstubAllGlobals();
});

const localePrefix = /^\/(?:bg|en)(?=\/|$)/;

const stubSavedReturn = (scrollY = 1000) => {
  vi.stubGlobal("sessionStorage", {
    getItem: () =>
      JSON.stringify({
        href: "/bg/cars?make=BMW",
        listingPath: "/listing/x",
        scrollY,
      }),
  });
};

it("does not restore an old listing position on a fresh inventory visit", () => {
  stubSavedReturn();
  vi.stubGlobal("location", {
    pathname: "/bg/cars",
    search: "?make=BMW",
  });
  expect(readInventoryReturn()?.scrollY).toBe(1000);
  expect(takeInventoryReturnScrollY()).toBeNull();
});

it("restores a requested listing return once, retaining filters and locale", () => {
  stubSavedReturn();
  vi.stubGlobal("location", { pathname: "/en/listing/x" });
  prepareInventoryReturn("/en/cars?make=BMW");
  vi.stubGlobal("location", {
    pathname: "/en/cars",
    search: "?make=BMW",
  });
  expect(takeInventoryReturnScrollY()).toBe(1000);
  expect(takeInventoryReturnScrollY()).toBeNull();
});

it("restores a saved position at the top rather than treating zero as missing", () => {
  stubSavedReturn(0);
  vi.stubGlobal("location", { pathname: "/bg/listing/x" });
  prepareInventoryReturn("/bg/cars?make=BMW");
  vi.stubGlobal("location", {
    pathname: "/bg/cars",
    search: "?make=BMW",
  });
  expect(takeInventoryReturnScrollY()).toBe(0);
});

it.each([
  ["/bg/listing/another-car", "/bg/cars?make=BMW"],
  ["/bg/listing/x", "/bg/cars"],
  ["/bg/listing/x", "/bg/trucks?make=BMW"],
])("does not restore an unrelated listing or search: %s -> %s", (pathname, href) => {
  stubSavedReturn();
  vi.stubGlobal("location", { pathname });
  prepareInventoryReturn(href);
  const target = new URL(href, "http://localhost");
  vi.stubGlobal("location", {
    pathname: target.pathname,
    search: target.search,
  });
  expect(takeInventoryReturnScrollY()).toBeNull();
});

it("discards a pending return if a different inventory page is mounted", () => {
  stubSavedReturn();
  vi.stubGlobal("location", { pathname: "/bg/listing/x" });
  prepareInventoryReturn("/bg/cars?make=BMW");
  vi.stubGlobal("location", { pathname: "/bg/cars", search: "" });
  expect(takeInventoryReturnScrollY()).toBeNull();
  vi.stubGlobal("location", {
    pathname: "/bg/cars",
    search: "?make=BMW",
  });
  expect(takeInventoryReturnScrollY()).toBeNull();
});

it("retains filters and scroll across localized listing navigation", () => {
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  vi.stubGlobal("location", {
    origin: "http://localhost:6462",
    pathname: "/cars",
    search: "?make=BMW&priceMax=100000",
  });
  vi.stubGlobal("window", { scrollY: 420 });
  rememberInventoryReturn("/bg/listing/bmw-x5");
  vi.stubGlobal("location", { pathname: "/listing/bmw-x5" });
  expect(getInventoryReturnHref("/cars")).toBe(
    "/bg/cars?make=BMW&priceMax=100000"
  );
  expect(readInventoryReturn()?.scrollY).toBe(420);
  vi.stubGlobal("location", { pathname: "/listing/another-car" });
  expect(getInventoryReturnHref("/cars")).toBe("/cars");
});

it.each([
  "not json",
  JSON.stringify({
    href: "https://example.com",
    listingPath: "/listing/x",
    scrollY: 0,
  }),
  JSON.stringify({ href: "/cars", listingPath: "/listing/x", scrollY: -1 }),
])("ignores invalid saved navigation: %s", (value) => {
  vi.stubGlobal("sessionStorage", { getItem: () => value });
  expect(readInventoryReturn()).toBeNull();
});

it("falls back when browser storage is unavailable", () => {
  vi.stubGlobal("sessionStorage", {
    getItem: () => {
      throw new Error("Storage blocked");
    },
  });
  vi.stubGlobal("location", { pathname: "/listing/x" });
  expect(getInventoryReturnHref("/cars")).toBe("/cars");
  expect(() => prepareInventoryReturn("/cars")).not.toThrow();
  expect(takeInventoryReturnScrollY()).toBeNull();
});

it("retains the current explicit locale when returning across languages", () => {
  vi.stubGlobal("sessionStorage", {
    getItem: () =>
      JSON.stringify({
        href: "/bg/cars?make=BMW",
        listingPath: "/listing/x",
        scrollY: 10,
      }),
  });
  vi.stubGlobal("location", { pathname: "/en/listing/x" });
  expect(getInventoryReturnHref("/en/cars")).toBe("/en/cars?make=BMW");
});

// Listing Back must retain the browsing route, query and position.
it.each([
  "/",
  "/bg",
  "/en",
  "/bg/",
  "/en/",
  "/bg/cars/bmw",
  "/en/cars/bmw/x5",
  "/cars/mercedes-benz/c-class",
  "/bg/collections/chinese-ev-hybrids",
  "/en/collections/chinese-ev-hybrids",
  "/collections/chinese-ev-hybrids",
])("retains the inventory browsing route and position: %s", (pathname) => {
  const values = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
  const search = pathname.includes("/collections/")
    ? "?page=1"
    : "?sort=price_asc&priceMax=150000";
  vi.stubGlobal("location", {
    origin: "http://localhost:3187",
    pathname,
    search,
  });
  vi.stubGlobal("window", { scrollY: 480 });
  rememberInventoryReturn("/en/listing/selected-car");
  expect(readInventoryReturn()?.href).toBe(`${pathname}${search}`);
  vi.stubGlobal("location", { pathname: "/en/listing/selected-car" });
  const expectedPath = pathname.replace(localePrefix, "") || "/";
  const localized = expectedPath === "/" ? "/en" : `/en${expectedPath}`;
  const href = `${localized}${search}`;
  expect(getInventoryReturnHref("/en/cars")).toBe(href);
  prepareInventoryReturn(href);
  vi.stubGlobal("location", {
    pathname: localized,
    search,
  });
  expect(takeInventoryReturnScrollY()).toBe(480);
  expect(takeInventoryReturnScrollY()).toBeNull();
});

it.each([
  "",
  "/bg#javascript:alert(1)",
  "/en/contact",
  "/cars/bmw/x5/edit",
  "/cars/../contact",
  "/cars/%2e%2e/contact",
  "/cars/bmw\\contact",
  "//example.com/cars",
  "/cars#javascript:alert(1)",
  "/collections/chinese-ev-hybrids/edit",
  "/collections/../contact",
  "/collections/%2e%2e/contact",
  "/collections/unknown",
])("rejects non-inventory saved destinations: %s", (href) => {
  vi.stubGlobal("sessionStorage", {
    getItem: () =>
      JSON.stringify({ href, listingPath: "/listing/x", scrollY: 0 }),
  });
  expect(readInventoryReturn()).toBeNull();
});
