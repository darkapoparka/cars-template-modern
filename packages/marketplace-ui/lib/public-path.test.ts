import { describe, expect, it } from "vitest";
import {
  getCanonicalPublicPath,
  getLocaleSwitchTarget,
  getLocalizedPublicPath,
} from "./public-path";

describe("getLocalizedPublicPath", () => {
  it("keeps both languages explicit", () => {
    expect(getLocalizedPublicPath("bg", "/cars")).toBe("/bg/cars");
    expect(getLocalizedPublicPath("bg-BG", "listing/example")).toBe(
      "/bg/listing/example"
    );
  });

  it("prefixes non-default locales without adding a trailing root slash", () => {
    expect(getLocalizedPublicPath("en", "/cars")).toBe("/en/cars");
    expect(getLocalizedPublicPath("en-US", "/")).toBe("/en");
  });

  it("normalizes paths when no locale is supplied", () => {
    expect(getLocalizedPublicPath(undefined, "dealers")).toBe("/bg/dealers");
  });
});

describe("getCanonicalPublicPath", () => {
  it("retains the explicit default-locale route prefix", () => {
    expect(getCanonicalPublicPath("bg", "/bg")).toBe("/bg");
    expect(getCanonicalPublicPath("bg", "/bg/cars")).toBe("/bg/cars");
  });

  it("keeps the public English locale prefix exactly once", () => {
    expect(getCanonicalPublicPath("en", "/en")).toBe("/en");
    expect(getCanonicalPublicPath("en", "/en/cars")).toBe("/en/cars");
  });
});

describe("getLocaleSwitchTarget", () => {
  it("preserves a deep route while switching to Bulgarian", () => {
    expect(getLocaleSwitchTarget("en", "/listing/example")).toEqual({
      locale: "bg",
      path: "/bg/listing/example",
    });
  });

  it("uses an explicit English path without inferring persistence", () => {
    expect(getLocaleSwitchTarget("bg", "/bg/cars")).toEqual({
      locale: "en",
      path: "/en/cars",
    });
  });
});
