import { describe, expect, it } from "vitest";
import {
  getDesktopSavedCarsStorageKey,
  parseDesktopSavedCars,
} from "./desktop-saved-car";

const car = {
  id: "saved-1",
  title: "BMW X5",
  href: "/bg/listing/bmw-x5",
  image: "https://images.unsplash.com/car.jpg",
  price: "89 379 лв.",
  money: { amount: 89_379, currency: "BGN" },
};

describe("desktop shortlist trust boundary", () => {
  it("isolates dealer and mounted-variant storage", () => {
    expect(getDesktopSavedCarsStorageKey("dealer-a", "")).not.toBe(
      getDesktopSavedCarsStorageKey("dealer-b", "")
    );
    expect(getDesktopSavedCarsStorageKey("dealer-a", "")).not.toBe(
      getDesktopSavedCarsStorageKey("dealer-a", "/variant-2")
    );
  });
  it.each([
    "/\\external.test/x",
    "//external.test/x",
    "https://external.test/x",
    "/bg/listing/%2f%2fexternal.test",
    "/bg/listing/%255cexternal.test",
    "/bg/contact",
    "/variant-3/bg/listing/car",
  ])("rejects external, encoded or unrelated destinations: %s", (href) => {
    expect(parseDesktopSavedCars(JSON.stringify([{ ...car, href }]))).toEqual(
      []
    );
  });
  it("retains valid legacy records, sanitizes bad thumbnails and deduplicates identities", () => {
    const old = { ...car, money: undefined, image: "javascript:alert(1)" };
    const saved = parseDesktopSavedCars(JSON.stringify([null, {}, old, car]));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      id: car.id,
      href: car.href,
      image: "",
      price: car.price,
    });
    expect(saved[0].money).toBeUndefined();
  });
  it("retains numeric prices for the active locale and limits corrupt state", () => {
    const saved = parseDesktopSavedCars(JSON.stringify([car]));
    expect(saved[0].money).toEqual(car.money);
    expect(parseDesktopSavedCars("invalid JSON")).toEqual([]);
    expect(
      parseDesktopSavedCars(
        JSON.stringify(
          Array.from({ length: 120 }, (_, i) => ({ ...car, id: String(i) }))
        )
      )
    ).toHaveLength(100);
  });
});
