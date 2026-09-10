import { describe, expect, it } from "vitest";
import {
  getCanonicalPublicPath,
  getLocaleSwitchTarget,
  getLocalizedPublicPath,
} from "./public-path";

describe("getLocalizedPublicPath", () => {
  it("keeps canonical English paths unprefixed", () => {
    expect(getLocalizedPublicPath("en", "/cars")).toBe("/cars");
    expect(getLocalizedPublicPath("en-US", "listing/example")).toBe(
      "/listing/example"
    );
  });

  it("prefixes non-default locales without adding a trailing root slash", () => {
    expect(getLocalizedPublicPath("bg", "/cars")).toBe("/bg/cars");
    expect(getLocalizedPublicPath("bg-BG", "/")).toBe("/bg");
  });

  it("normalizes paths when no locale is supplied", () => {
    expect(getLocalizedPublicPath(undefined, "dealers")).toBe("/dealers");
  });
});

describe("getCanonicalPublicPath", () => {
  it("removes the internal default-locale route prefix", () => {
    expect(getCanonicalPublicPath("en", "/en")).toBe("/");
    expect(getCanonicalPublicPath("en", "/en/cars")).toBe("/cars");
  });

  it("keeps the public Bulgarian locale prefix exactly once", () => {
    expect(getCanonicalPublicPath("bg", "/bg")).toBe("/bg");
    expect(getCanonicalPublicPath("bg", "/bg/cars")).toBe("/bg/cars");
  });
});

describe("getLocaleSwitchTarget", () => {
  it("preserves a deep route while switching to Bulgarian", () => {
    expect(getLocaleSwitchTarget("en", "/listing/example")).toEqual({
      locale: "bg",
      path: "/bg/listing/example",
    });
  });

  it("uses an explicit English path so the locale cookie can be updated", () => {
    expect(getLocaleSwitchTarget("bg", "/bg/cars")).toEqual({
      locale: "en",
      path: "/en/cars",
    });
  });
});
