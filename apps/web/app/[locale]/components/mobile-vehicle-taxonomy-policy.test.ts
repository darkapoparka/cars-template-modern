import { describe, expect, it } from "vitest";
import {
  canUseCustomVehicleTaxonomyValue,
  getRequiredVehicleTaxonomyField,
  getVehicleTaxonomyModels,
} from "./mobile-vehicle-taxonomy-policy";

describe("mobile vehicle taxonomy policy", () => {
  it("requires make before model", () => {
    expect(getRequiredVehicleTaxonomyField("", "")).toBe("make");
    expect(getRequiredVehicleTaxonomyField("BMW", "")).toBe("model");
    expect(getRequiredVehicleTaxonomyField("BMW", "X5")).toBeNull();
  });

  it("exposes known models and permits meaningful custom values", () => {
    expect(getVehicleTaxonomyModels("BMW").length).toBeGreaterThan(0);
    expect(canUseCustomVehicleTaxonomyValue("Custom", ["X5", "X6"])).toBe(
      true
    );
    expect(canUseCustomVehicleTaxonomyValue("x5", ["X5", "X6"])).toBe(false);
  });
});
