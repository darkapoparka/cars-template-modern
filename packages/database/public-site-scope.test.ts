import { describe, expect, it } from "vitest";
import { scopePublicInventory } from "./public-site-scope";

describe("public dealer inventory isolation", () => {
  it("retains full marketplace behavior only for an explicitly unscoped server caller", () => {
    const where = { status: "active" as const };
    expect(scopePublicInventory(where)).toBe(where);
  });
  it("ANDs trusted dealer scope with public visibility instead of replacing it", () => {
    expect(
      scopePublicInventory({ status: "active" }, { dealerOrgId: "dealer-a" })
    ).toEqual({
      AND: [
        { status: "active" },
        {
          dealerOrgId: "dealer-a",
          dealerOrg: { deletedAt: null, clerkDeletedAt: null },
        },
      ],
    });
  });
  it("fails closed on an empty binding", () => {
    expect(() => scopePublicInventory({}, { dealerOrgId: "" })).toThrow();
  });
});
