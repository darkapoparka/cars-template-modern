import { describe, expect, test } from "vitest";
import {
  canAccessBuyerResource,
  getOwnedBuyerResourceWhere,
} from "../app/(authenticated)/buyer-authorization";
import { getWorkspaceCapabilities } from "../app/(authenticated)/workspace-capabilities";

describe("buyer resource authorization", () => {
  test("allows the owning user and denies a different user", () => {
    expect(canAccessBuyerResource("user_1", "user_1")).toBe(true);
    expect(canAccessBuyerResource("user_1", "user_2")).toBe(false);
  });

  test("builds an ownership-scoped mutation selector", () => {
    expect(getOwnedBuyerResourceWhere("user_1", "saved_1")).toEqual({
      accountId: "user_1",
      id: "saved_1",
    });
  });
});

describe("workspace navigation capabilities", () => {
  test("keeps dealer and admin navigation hidden for a buyer", () => {
    expect(
      getWorkspaceCapabilities({
        dealerCommerceEnabled: false,
        hasDealerOrganization: false,
        isAdmin: false,
      })
    ).toEqual({
      admin: false,
      buyer: true,
      dealer: false,
      dealerCommerce: false,
      seller: true,
    });
  });

  test("adds privileged navigation only for explicit capabilities", () => {
    expect(
      getWorkspaceCapabilities({
        dealerCommerceEnabled: true,
        hasDealerOrganization: true,
        isAdmin: true,
      })
    ).toEqual({
      admin: true,
      buyer: true,
      dealer: true,
      dealerCommerce: true,
      seller: true,
    });
  });
});
