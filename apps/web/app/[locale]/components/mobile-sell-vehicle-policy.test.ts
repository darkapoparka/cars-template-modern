import { describe, expect, it } from "vitest";
import {
  isCompleteVehicleVin,
  normalizeVehicleVin,
} from "./mobile-sell-vehicle-policy";

describe("mobile sell vehicle policy", () => {
  it("removes I, O and Q while preserving allowed characters such as U", () => {
    expect(normalizeVehicleVin("wba-ioqu_1234567890x")).toBe("WBAU1234567890X");
  });

  it("caps VIN input at 17 characters", () => {
    expect(normalizeVehicleVin("WBA1234567890123456789")).toHaveLength(17);
  });

  it("requires a complete 17-character VIN before relaxing manual fields", () => {
    expect(isCompleteVehicleVin("WBA12345678901234")).toBe(true);
    expect(isCompleteVehicleVin("WBA1234567890123")).toBe(false);
  });
});
