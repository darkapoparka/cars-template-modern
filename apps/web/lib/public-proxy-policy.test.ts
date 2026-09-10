import { describe, expect, it } from "vitest";
import { shouldFailClosedOnProtectionError } from "./public-proxy-policy";

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
