import { describe, expect, test } from "vitest";
import {
  canDurableMemberPerform,
  hasActiveOrganization,
} from "./authorization";
import { mapClerkOrganizationRole } from "./organization-roles";

describe("organization role and membership policy", () => {
  test.each([
    ["org:owner", "owner"],
    ["org:admin", "manager"],
    ["org:member", "sales"],
  ])("maps %s exactly", (clerkRole, durableRole) => {
    expect(mapClerkOrganizationRole(clerkRole)).toEqual({
      clerkRole,
      durableRole,
      recognized: true,
    });
  });

  test("fails unknown Clerk roles closed", () => {
    expect(mapClerkOrganizationRole("org:custom")).toEqual({
      clerkRole: "org:custom",
      durableRole: "viewer",
      recognized: false,
    });
    expect(
      hasActiveOrganization({
        orgId: "org_1",
        orgRole: "org:custom",
        userId: "user_1",
      })
    ).toBe(false);
  });

  test("requires an active durable member in the matching organization", () => {
    const base = {
      accountActive: true,
      activeClerkOrgId: "org_1",
      memberRole: "manager" as const,
      memberStatus: "active" as const,
      operation: "inventory:source:manage" as const,
      organizationDeleted: false,
      resourceClerkOrgId: "org_1",
    };
    expect(canDurableMemberPerform(base)).toBe(true);
    expect(canDurableMemberPerform({ ...base, memberStatus: "disabled" })).toBe(
      false
    );
    expect(
      canDurableMemberPerform({ ...base, resourceClerkOrgId: "org_2" })
    ).toBe(false);
  });

  test("keeps full snapshot approval owner/manager only", () => {
    expect(
      canDurableMemberPerform({
        accountActive: true,
        activeClerkOrgId: "org_1",
        memberRole: "sales",
        memberStatus: "active",
        operation: "inventory:snapshot:approve",
        organizationDeleted: false,
        resourceClerkOrgId: "org_1",
      })
    ).toBe(false);
  });
});
