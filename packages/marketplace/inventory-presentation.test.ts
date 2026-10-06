import { describe, expect, it } from "vitest";
import {
  getInventoryLayoutCookieName,
  resolveInventoryFilterLayout,
} from "./inventory-presentation";

describe("inventory presentation preference", () => {
  it("accepts only known layouts and retains the configured default for untrusted values", () => {
    expect(resolveInventoryFilterLayout("sidebar", "quick")).toBe("sidebar");
    expect(resolveInventoryFilterLayout("quick", "sidebar")).toBe("quick");
    for (const value of [undefined, "", "grid", "quick; Path=/", "<script>"]) {
      expect(resolveInventoryFilterLayout(value, "sidebar")).toBe("sidebar");
    }
  });
  it("isolates independent dealer identities", () => {
    expect(getInventoryLayoutCookieName("dealer-a")).not.toBe(
      getInventoryLayoutCookieName("dealer-b")
    );
  });
});
