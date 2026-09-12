import { describe, expect, it } from "vitest";
import {
  hasSellVehicleDetails,
  isCompleteVehicleVin,
  parseSellVehicleDraft,
  readSellVehicleDraft,
  serializeSellVehicleDraft,
} from "./sell-vehicle-draft";

describe("sell vehicle draft", () => {
  it("round-trips every supported field through an edit URL", () => {
    const draft = parseSellVehicleDraft({
      category: "van",
      vin: "WBA12345678901234",
      make: "BMW",
      model: "X5 & xDrive",
      year: "2020",
      mileage: "080000",
      notes: "Бележки + history",
    });
    expect(
      parseSellVehicleDraft(
        Object.fromEntries(
          new URLSearchParams(serializeSellVehicleDraft(draft))
        )
      )
    ).toEqual(draft);
    expect(draft.mileage).toBe("80000");
    expect(hasSellVehicleDetails(draft)).toBe(true);
  });
  it("preserves a VIN-only draft without inventing vehicle data", () => {
    const draft = parseSellVehicleDraft({ vin: "wba12345678901234" });
    expect(draft.vin).toBe("WBA12345678901234");
    expect(isCompleteVehicleVin(draft.vin)).toBe(true);
    expect(draft.make).toBe("");
    expect(draft.year).toBe("");
  });
  it("normalizes bounded query input and rejects inherited category names", () => {
    const draft = parseSellVehicleDraft({
      category: "__proto__",
      make: ["  BMW  ", "ignored"],
      year: "9999",
      mileage: "-1",
      notes: "x".repeat(600),
    });
    expect(draft.category).toBe("car");
    expect(draft.make).toBe("BMW");
    expect(draft.year).toBe("");
    expect(draft.mileage).toBe("");
    expect(draft.notes).toHaveLength(500);
    expect(hasSellVehicleDetails(parseSellVehicleDraft())).toBe(false);
  });
  it("preserves editable numbers without relaxing URL validation", () => {
    const values = { year: "202", mileage: "10000001", vin: "WBA123" };
    const draft = readSellVehicleDraft(values);
    expect(draft).toMatchObject(values);
    expect(parseSellVehicleDraft(values)).toMatchObject({
      year: "",
      mileage: "",
    });
    const query = new URLSearchParams(serializeSellVehicleDraft(draft));
    expect(query.has("year")).toBe(false);
    expect(query.has("mileage")).toBe(false);
    expect(query.get("vin")).toBe("WBA123");
  });
  it.each([
    "SHORT",
    "WBA1234567890123I",
    "WBA123456789012345",
  ])("does not accept malformed VIN %s", (vin) => {
    expect(isCompleteVehicleVin(vin)).toBe(false);
  });
});
