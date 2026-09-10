import { describe, expect, test } from "vitest";
import { listingInputSchema } from "./listing-input";
import { canTransitionListingStatus } from "./listing-lifecycle";
import { stubVinDecodeProvider } from "./providers";

const validListing = {
  bodyType: "suv",
  category: "car",
  description: "A complete and accurate vehicle description.",
  fuelType: "diesel",
  locationCity: "Sofia",
  make: "BMW",
  mileageValue: 42_000,
  model: "X5",
  priceAmount: 80_000,
  priceCurrency: "BGN",
  priceType: "fixed",
  title: "2022 BMW X5",
  transmission: "automatic",
  year: 2022,
} as const;

describe("durable listing core", () => {
  test("validates normalized durable listing input", () => {
    expect(listingInputSchema.parse(validListing).locationCountry).toBe(
      "Bulgaria"
    );
    expect(() =>
      listingInputSchema.parse({ ...validListing, vin: "INVALID" })
    ).toThrow();
  });

  test("enforces lifecycle edges", () => {
    expect(canTransitionListingStatus("draft", "pending_review")).toBe(true);
    expect(canTransitionListingStatus("draft", "active")).toBe(false);
    expect(canTransitionListingStatus("active", "sold")).toBe(true);
    expect(canTransitionListingStatus("sold", "active")).toBe(false);
  });

  test("reports the unavailable VIN capability truthfully", async () => {
    const vin = "WBAKS4C50J0Z12345";
    const first = await stubVinDecodeProvider.decodeVin({ vin });
    const second = await stubVinDecodeProvider.decodeVin({ vin });
    expect(first).toEqual(second);
    expect(first.provider).toBe("unconfigured");
    expect(first.spec).toBeUndefined();
    expect(first.status).toBe("skipped");
  });
});
