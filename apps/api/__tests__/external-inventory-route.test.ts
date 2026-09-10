import { inventoryRecordSchema } from "@repo/marketplace";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/public/inventory/external/route";
import { externalInventoryProvider } from "@/lib/provider-adapters";

const normalizedRecord = inventoryRecordSchema.parse({
  externalId: "vehicle-1",
  offer: {
    destinationMarketCodes: ["us"],
    description: "Source-backed external listing.",
    externalOfferId: "vehicle-1",
    media: [],
    mileage: { unit: "km", value: 50_000 },
    nativePrice: {
      amountMinor: "4250000",
      currencyCode: "USD",
      exponent: 2,
    },
    physicalLocation: {
      city: "Austin",
      country: "United States",
      countryCode: "US",
      region: "TX",
    },
    status: "available",
    taxTreatment: "unspecified",
    title: "2022 Volvo XC90 Recharge",
  },
  operation: "upsert",
  sourceUpdatedAt: "2026-08-28T10:00:00.000Z",
  vehicle: {
    bodyType: "suv",
    category: "car",
    fuelType: "plug_in_hybrid",
    make: "Volvo",
    model: "XC90",
    transmission: "automatic",
    trim: "Recharge",
    vin: "YV4BR0CK1N1234567",
    year: 2022,
  },
});

describe("public external inventory route", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns an honest disabled state for unsupported origins", async () => {
    const response = await GET(
      new Request("https://api.example/public/inventory/external?origin=KR")
    );
    await expect(response.json()).resolves.toMatchObject({
      listings: [],
      originCountryCode: "KR",
      reason: "unsupported_origin",
      status: "disabled",
    });
  });

  it("projects normalized records into the public contract", async () => {
    vi.spyOn(externalInventoryProvider, "fetchSnapshot").mockResolvedValue({
      provider: "auto-dev-listings-api",
      records: [normalizedRecord],
      references: [
        {
          dealerName: "Example Motors",
          externalId: "vehicle-1",
          listingUrl: "https://dealer.example/vehicle/1",
        },
      ],
      retrievedAt: "2026-08-28T12:00:00.000Z",
      snapshotComplete: false,
      sourceKey: "auto-dev-listings-api",
      status: "ok",
    });

    const response = await GET(
      new Request("https://api.example/public/inventory/external?origin=US")
    );
    await expect(response.json()).resolves.toMatchObject({
      listings: [
        {
          externalId: "vehicle-1",
          offer: { dealerName: "Example Motors", mileageKm: 50_000 },
          source: { displayName: "Auto.dev" },
        },
      ],
      originCountryCode: "US",
      status: "ok",
    });
  });
});
