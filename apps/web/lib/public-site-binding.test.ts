import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPublicDealerBinding,
  requirePublicInventoryScope,
} from "./public-site-binding";

afterEach(() => vi.unstubAllEnvs());
describe("trusted single-dealer binding", () => {
  it("fails closed for a live dealership with no binding", () => {
    vi.stubEnv("AUTOMARKET_DEALER_ORG_ID", "");
    expect(() => requirePublicInventoryScope()).toThrow();
  });
  it("does not accept malformed identities", () => {
    expect(
      getPublicDealerBinding({ AUTOMARKET_DEALER_ORG_ID: "../other?tenant=a" })
    ).toBeUndefined();
  });
  it("obtains tenant scope from server configuration, not browser parameters", () => {
    vi.stubEnv("AUTOMARKET_DEALER_ORG_ID", "dealer-a");
    expect(requirePublicInventoryScope()).toEqual({ dealerOrgId: "dealer-a" });
  });
});
