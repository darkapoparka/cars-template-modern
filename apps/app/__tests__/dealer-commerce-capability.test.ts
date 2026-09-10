import { describe, expect, test, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { AUTOMARKET_ENABLE_BILLING: "false" },
}));

import { getDealerCommerceCapability } from "../app/(authenticated)/dealer/commerce-capability";

describe("dealer commerce capability", () => {
  test("keeps the review surface visible while transactions fail closed", () => {
    expect(getDealerCommerceCapability(undefined)).toEqual({
      checkoutAvailable: false,
      mode: "misconfigured",
      surfaceAvailable: true,
    });
    expect(getDealerCommerceCapability("false")).toEqual({
      checkoutAvailable: false,
      mode: "disabled",
      surfaceAvailable: true,
    });
    expect(getDealerCommerceCapability("true")).toEqual({
      checkoutAvailable: false,
      mode: "provider_unavailable",
      surfaceAvailable: true,
    });
    expect(getDealerCommerceCapability("true", true)).toEqual({
      checkoutAvailable: true,
      mode: "launch_enabled",
      surfaceAvailable: true,
    });
  });
});
