import {
  hasActiveOrganization,
  hasAdminRole,
  matchesActiveOrganization,
} from "@repo/auth/authorization";
import { describe, expect, test } from "vitest";

describe("authorization policy", () => {
  test("accepts only the configured global admin claim", () => {
    expect(hasAdminRole({ metadata: { role: "admin" } })).toBe(true);
    expect(hasAdminRole({ metadata: { role: "member" } })).toBe(false);
    expect(hasAdminRole({ role: "admin" })).toBe(false);
    expect(hasAdminRole(undefined)).toBe(false);
  });

  test("requires an authenticated active organization membership", () => {
    expect(
      hasActiveOrganization({
        orgId: "org_1",
        orgRole: "org:member",
        userId: "user_1",
      })
    ).toBe(true);
    expect(
      hasActiveOrganization({
        orgId: "org_2",
        orgRole: null,
        userId: "user_1",
      })
    ).toBe(false);
    expect(
      hasActiveOrganization({
        orgId: null,
        orgRole: null,
        userId: "user_1",
      })
    ).toBe(false);
  });

  test("denies a resource belonging to another organization", () => {
    expect(matchesActiveOrganization("org_active", "org_active")).toBe(true);
    expect(matchesActiveOrganization("org_active", "org_other")).toBe(false);
  });
});
