import { afterEach, expect, it, vi } from "vitest";
import {
  getInventoryReturnHref,
  readInventoryReturn,
  rememberInventoryReturn,
} from "./inventory-return";

afterEach(() => vi.unstubAllGlobals());

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
    "/cars?make=BMW&priceMax=100000"
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
});
