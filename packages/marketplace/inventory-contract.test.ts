import { describe, expect, it } from "vitest";
import {
  inventoryBatchSchema,
  parseInventoryBatch,
  prepareInventoryBatch,
} from "./inventory-contract";

const validBatch = {
  batch: {
    complete: true,
    generatedAt: "2026-07-12T18:00:00.000Z",
    id: "snapshot-42",
    mode: "full_snapshot",
  },
  records: [
    {
      externalId: "stock-1001",
      offer: {
        destinationMarketCodes: ["bg"],
        description: "Authorized supplier inventory record.",
        externalOfferId: "offer-1001",
        media: [
          {
            alt: "Vehicle front view",
            position: 0,
            rights: {
              scope: "territories",
              status: "authorized",
              territoryCountryCodes: ["BG"],
            },
            url: "https://example.test/vehicle.jpg",
          },
        ],
        mileage: { unit: "km", value: 28_531 },
        nativePrice: {
          amountMinor: "5749900",
          currencyCode: "EUR",
          exponent: 2,
        },
        physicalLocation: {
          city: "Berlin",
          country: "Germany",
          countryCode: "DE",
        },
        status: "available",
        taxTreatment: "gross",
        title: "2022 BMW X5 xDrive40d",
      },
      operation: "upsert",
      sourceUpdatedAt: "2026-07-12T17:55:00.000Z",
      sourceVersion: "42",
      vehicle: {
        bodyType: "suv",
        category: "car",
        fuelType: "diesel",
        make: "BMW",
        model: "X5",
        transmission: "automatic",
        trim: "xDrive40d",
        vin: "WBAKS410500H12345",
        year: 2022,
      },
    },
  ],
  schemaVersion: "automarket.inventory.v1",
} as const;

describe("automarket.inventory.v1", () => {
  it("accepts explicit snapshot, provenance, location, rights, and native money", () => {
    const parsed = parseInventoryBatch(validBatch);

    expect(parsed.batch.mode).toBe("full_snapshot");
    expect(parsed.records[0]?.operation).toBe("upsert");
  });

  it("rejects an incremental batch that claims snapshot completeness", () => {
    const result = inventoryBatchSchema.safeParse({
      ...validBatch,
      batch: { ...validBatch.batch, complete: true, mode: "incremental" },
    });

    expect(result.success).toBe(false);
  });

  it("rejects self-asserted fields outside the versioned contract", () => {
    const result = inventoryBatchSchema.safeParse({
      ...validBatch,
      records: [
        {
          ...validBatch.records[0],
          verifiedImporter: true,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("requires strict timezone-aware source timestamps", () => {
    const result = inventoryBatchSchema.safeParse({
      ...validBatch,
      batch: {
        ...validBatch.batch,
        generatedAt: "2026-02-31T18:00:00",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsafe media hosts and non-HTTPS URLs", () => {
    const result = inventoryBatchSchema.safeParse({
      ...validBatch,
      records: [
        {
          ...validBatch.records[0],
          offer: {
            ...validBatch.records[0].offer,
            media: [
              {
                ...validBatch.records[0].offer.media[0],
                url: "http://127.0.0.1/internal.jpg",
              },
            ],
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("bounds native money and protects the legacy two-decimal projection", () => {
    const invalidValues = [
      { amountMinor: "9223372036854775808", currencyCode: "EUR", exponent: 2 },
      { amountMinor: "5749900", currencyCode: "EUR", exponent: 0 },
      { amountMinor: "5749900", currencyCode: "JPY", exponent: 2 },
      { amountMinor: "5749900", currencyCode: "ZZZ", exponent: 2 },
    ];

    for (const nativePrice of invalidValues) {
      const result = inventoryBatchSchema.safeParse({
        ...validBatch,
        records: [
          {
            ...validBatch.records[0],
            offer: { ...validBatch.records[0].offer, nativePrice },
          },
        ],
      });

      expect(result.success).toBe(false);
    }
  });

  it("quarantines invalid rows while preserving valid rows", () => {
    const prepared = prepareInventoryBatch({
      ...validBatch,
      records: [validBatch.records[0], { externalId: "bad-row" }],
    });

    expect(prepared.records).toHaveLength(1);
    expect(prepared.preparedRecords).toMatchObject([
      { raw: validBatch.records[0], rowNumber: 1 },
    ]);
    expect(prepared.quarantinedRecords).toMatchObject([
      { externalId: "bad-row", rowNumber: 2 },
    ]);
  });

  it("allows an empty complete snapshot but rejects other empty batches", () => {
    const emptySnapshot = {
      ...validBatch,
      records: [],
    };

    expect(
      prepareInventoryBatch(emptySnapshot, {
        now: new Date("2026-07-12T18:00:00.000Z"),
      }).records
    ).toEqual([]);
    expect(
      inventoryBatchSchema.safeParse({
        ...emptySnapshot,
        batch: { ...emptySnapshot.batch, complete: false },
      }).success
    ).toBe(false);
  });

  it("rejects a batch timestamp beyond the server clock-skew allowance", () => {
    expect(() =>
      prepareInventoryBatch(
        {
          ...validBatch,
          batch: {
            ...validBatch.batch,
            generatedAt: "2027-01-01T00:00:00.000Z",
          },
        },
        { now: new Date("2026-07-12T18:00:00.000Z") }
      )
    ).toThrow("clock skew");
  });

  it("quarantines every ambiguous duplicate record within a batch", () => {
    const prepared = prepareInventoryBatch({
      ...validBatch,
      records: [validBatch.records[0], structuredClone(validBatch.records[0])],
    });

    expect(prepared.records).toEqual([]);
    expect(prepared.quarantinedRecords).toHaveLength(2);
    expect(prepared.quarantinedRecords[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "externalId" }),
        expect.objectContaining({ path: "offer.externalOfferId" }),
      ])
    );
  });

  it("quarantines PostgreSQL-incompatible text without losing valid rows", () => {
    const poisonedRecord = {
      ...validBatch.records[0],
      externalId: "stock-poisoned",
      offer: {
        ...validBatch.records[0].offer,
        externalOfferId: "offer-poisoned",
        title: "Unsafe\0title",
      },
    };
    const prepared = prepareInventoryBatch({
      ...validBatch,
      records: [validBatch.records[0], poisonedRecord],
    });

    expect(prepared.records).toHaveLength(1);
    expect(prepared.quarantinedRecords).toMatchObject([
      {
        externalId: "stock-poisoned",
        issues: [expect.objectContaining({ path: "offer.title" })],
        rowNumber: 2,
      },
    ]);
  });

  it("requires explicit bounded media and destination scopes", () => {
    const record = {
      ...validBatch.records[0],
      offer: {
        ...validBatch.records[0].offer,
        destinationMarketCodes: ["bg", "bg"],
        media: [
          {
            ...validBatch.records[0].offer.media[0],
            rights: {
              ...validBatch.records[0].offer.media[0].rights,
              territoryCountryCodes: [],
            },
          },
        ],
        physicalLocation: {
          ...validBatch.records[0].offer.physicalLocation,
          countryCode: "ZZ",
        },
      },
    };

    expect(
      inventoryBatchSchema.safeParse({ ...validBatch, records: [record] })
        .success
    ).toBe(false);
  });
});
