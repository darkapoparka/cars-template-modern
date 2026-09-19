import { describe, expect, it } from "vitest";
import {
  hashInventoryPayload,
  stableInventoryJson,
  toInputJson,
  toRawInputJson,
} from "./inventory-payload";

describe("inventory payload serialization", () => {
  it("hashes object key order consistently while retaining array order", () => {
    const first = {
      z: [{ b: 2, a: 1 }],
      at: new Date("2026-09-19T00:00:00Z"),
      absent: undefined,
    };
    const second = { at: "2026-09-19T00:00:00.000Z", z: [{ a: 1, b: 2 }] };
    expect(hashInventoryPayload(first)).toBe(hashInventoryPayload(second));
    expect(hashInventoryPayload([1, 2])).not.toBe(hashInventoryPayload([2, 1]));
    expect(stableInventoryJson(first)).toBe(JSON.stringify(second));
  });
  it("keeps JSON input independent of the caller", () => {
    const original = { vehicle: { year: 2020 }, missing: undefined };
    const serialized = toInputJson(original);
    original.vehicle.year = 2021;
    expect(serialized).toEqual({ vehicle: { year: 2020 } });
    expect(toInputJson(undefined)).toBeNull();
  });
  it("losslessly encodes raw NUL payloads that PostgreSQL JSON cannot store", () => {
    const value = { note: "before\u0000after" };
    const raw = toRawInputJson(value) as { data: string; encoding: string };
    expect(raw.encoding).toBe("json-utf8-base64");
    expect(
      JSON.parse(Buffer.from(raw.data, "base64").toString("utf8"))
    ).toEqual(value);
    expect(toRawInputJson({ note: "ordinary" })).toEqual({ note: "ordinary" });
  });
});
