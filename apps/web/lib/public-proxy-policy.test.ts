import { describe, expect, it } from "vitest";
import {
  isPublicDemoRequestAllowed,
  shouldFailClosedOnProtectionError,
} from "./public-proxy-policy";

describe("public proxy protection failure policy", () => {
  it.each([
    "GET",
    "HEAD",
    "OPTIONS",
  ])("keeps read-only %s traffic available", (method) => {
    expect(shouldFailClosedOnProtectionError(method)).toBe(false);
  });

  it.each([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ])("fails closed for state-changing %s traffic", (method) => {
    expect(shouldFailClosedOnProtectionError(method)).toBe(true);
  });
});

describe("demo mutation boundary", () => {
  it("allows only cookie preferences and deterministic filter parsing", () => {
    for (const path of [
      "/api/preferences",
      "/variant-2/api/preferences",
      "/api/ai/search",
      "/variant-2/api/ai/search",
    ]) {
      expect(isPublicDemoRequestAllowed("POST", path)).toBe(true);
    }
  });
  it.each([
    "/en/contact",
    "/bg/contact",
    "/api/leads",
    "/api/ai/provider",
    "/api/preferences/extra",
    "/variant-2/api/preferences/extra",
    "/api/ai/search/extra",
    "/variant-2/api/ai/search/extra",
  ])("blocks business/unknown POST %s", (path) =>
    expect(isPublicDemoRequestAllowed("POST", path)).toBe(false));
  it.each([
    "PUT",
    "PATCH",
    "DELETE",
  ])("blocks %s even on preferences", (method) =>
    expect(isPublicDemoRequestAllowed(method, "/api/preferences")).toBe(false));
});
