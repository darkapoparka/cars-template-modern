import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const databaseBoundary = vi.hoisted(() => {
  class InventoryIdempotencyConflictError extends Error {}
  class InventoryBatchTimestampError extends Error {}
  class InventoryPayloadHashError extends Error {}
  class InventorySourceModeMismatchError extends Error {}
  class InventorySourceNotFoundError extends Error {}
  class InventorySourceLeasedError extends Error {}
  class InventorySourceUnavailableError extends Error {}

  return {
    getInventorySourceAuthorizationContext: vi.fn(),
    ingestPreparedInventoryBatch: vi.fn(),
    InventoryBatchTimestampError,
    InventoryIdempotencyConflictError,
    InventoryPayloadHashError,
    InventorySourceModeMismatchError,
    InventorySourceNotFoundError,
    InventorySourceLeasedError,
    InventorySourceUnavailableError,
    recordInventoryIngressFailure: vi.fn(),
    reconcileStaleInventory: vi.fn(),
  };
});

const prismaBoundary = vi.hoisted(() => ({
  inventorySource: { findFirst: vi.fn() },
}));

vi.mock("@repo/database/inventory-ingestion", () => databaseBoundary);
vi.mock("@repo/database", () => ({ database: prismaBoundary }));
vi.mock("@/env", () => ({
  env: {
    get CRON_SECRET() {
      return process.env.CRON_SECRET;
    },
  },
}));

import { GET as reconcileInventory } from "../app/cron/inventory-reconciliation/route";
import { POST as pushInventoryBatch } from "../app/inventory/v1/sources/[sourceKey]/batches/route";
import { POST as importInventory } from "../app/inventory/v1/sources/[sourceKey]/imports/route";
import {
  INVENTORY_CSV_COLUMNS,
  INVENTORY_CSV_TEMPLATE_HEADER,
} from "../lib/inventory-csv";
import { INVENTORY_MAX_PAYLOAD_BYTES } from "../lib/inventory-http";

const SOURCE_KEY = "dealer-feed-one";
const SOURCE_SECRET = "inventory-source-secret-123";
const SOURCE_SECRET_REFERENCE =
  "env:AUTOMARKET_INVENTORY_DEALER_FEED_ONE_TOKEN";
const RETIRING_SOURCE_SECRET = "inventory-source-retiring-secret-456";
const RETIRING_SOURCE_SECRET_REFERENCE =
  "env:AUTOMARKET_INVENTORY_DEALER_FEED_ONE_RETIRING_TOKEN";
const CRON_SECRET = "cron-secret-0123456789";
const CSV_QUOTE_PATTERN = /[",\r\n]/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const routeContext = () => ({
  params: Promise.resolve({ sourceKey: SOURCE_KEY }),
});

const createRecord = (suffix = "1001") => ({
  externalId: `stock-${suffix}`,
  offer: {
    destinationMarketCodes: ["bg"],
    description: "Authorized supplier inventory record.",
    externalOfferId: `offer-${suffix}`,
    media: [
      {
        alt: "Vehicle front view",
        position: 0,
        rights: {
          scope: "territories",
          status: "authorized",
          territoryCountryCodes: ["BG"],
        },
        url: `https://cdn.example.test/vehicle-${suffix}.jpg`,
      },
    ],
    mileage: { unit: "km", value: 28_531 },
    nativePrice: {
      amountMinor: "5749900",
      currencyCode: "EUR",
      exponent: 2,
    },
    physicalLocation: {
      city: "Sofia",
      country: "Bulgaria",
      countryCode: "BG",
    },
    status: "available",
    taxTreatment: "gross",
    title: `2022 BMW X5 ${suffix}`,
  },
  operation: "upsert",
  sourceUpdatedAt: "2026-07-12T17:55:00.000Z",
  sourceVersion: suffix,
  vehicle: {
    bodyType: "suv",
    category: "car",
    fuelType: "diesel",
    make: "BMW",
    model: "X5",
    transmission: "automatic",
    trim: "xDrive40d",
    vin: "wbaks410500h12345",
    year: 2022,
  },
});

const createBatch = (records: unknown[] = [createRecord()]) => ({
  batch: {
    complete: false,
    generatedAt: "2026-07-12T18:00:00.000Z",
    id: "batch-42",
    mode: "incremental",
  },
  records,
  schemaVersion: "automarket.inventory.v1",
});

const ingestionResult = (overrides: Record<string, unknown> = {}) => ({
  changedCount: 1,
  duplicate: false,
  missingCount: 0,
  projectedCount: 1,
  rejectedCount: 0,
  runId: "run-1",
  status: "completed",
  unchangedCount: 0,
  unpublishedCount: 0,
  ...overrides,
});

const pushHeaders = (overrides: Record<string, string> = {}) => ({
  authorization: `Bearer ${SOURCE_SECRET}`,
  "content-type": "application/json",
  "idempotency-key": "request-42",
  ...overrides,
});

const pushRequest = (
  body: unknown = createBatch(),
  headers: Record<string, string> = pushHeaders()
) =>
  new Request(
    `https://api.example/inventory/v1/sources/${SOURCE_KEY}/batches`,
    {
      body: JSON.stringify(body),
      headers,
      method: "POST",
    }
  );

const csvCell = (value: string) =>
  CSV_QUOTE_PATTERN.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

const createCsv = (
  overrides: Record<string, string> = {},
  columns: readonly string[] = INVENTORY_CSV_COLUMNS
) => {
  const values: Record<string, string> = {
    body_type: "suv",
    category: "car",
    city: "Sofia",
    country: "Bulgaria",
    country_code: "bg",
    description: "Authorized, dealer inventory",
    destination_market_codes: "bg|de",
    external_id: "csv-stock-1",
    external_offer_id: "csv-offer-1",
    fuel_type: "diesel",
    make: "BMW",
    mileage_km: "28531",
    model: "X5",
    operation: "upsert",
    price_amount_minor: "5749900",
    price_currency_code: "eur",
    price_exponent: "2",
    source_updated_at: "2026-07-12T17:55:00+03:00",
    status: "available",
    tax_treatment: "gross",
    title: "2022 BMW X5 xDrive40d",
    transmission: "automatic",
    vin: "wbaks410500h12345",
    year: "2022",
    ...overrides,
  };

  return [
    columns === INVENTORY_CSV_COLUMNS
      ? INVENTORY_CSV_TEMPLATE_HEADER
      : columns.join(","),
    columns.map((column) => csvCell(values[column] ?? "")).join(","),
  ].join("\r\n");
};

const getFirstIngestionCall = () => {
  const call = databaseBoundary.ingestPreparedInventoryBatch.mock.calls[0]?.[0];
  if (!call) {
    throw new Error("Expected the inventory ingestion service to be called");
  }

  return call;
};

const csvRequest = (body = createCsv()) =>
  new Request(
    `https://api.example/inventory/v1/sources/${SOURCE_KEY}/imports`,
    {
      body,
      headers: {
        authorization: `Bearer ${SOURCE_SECRET}`,
        "content-type": "text/csv; charset=utf-8",
        "idempotency-key": "csv-request-42",
        "x-automarket-generated-at": "2026-07-12T18:00:00.000Z",
      },
      method: "POST",
    }
  );

describe("inventory ingestion routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("AUTOMARKET_INVENTORY_DEALER_FEED_ONE_TOKEN", SOURCE_SECRET);
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    prismaBoundary.inventorySource.findFirst.mockResolvedValue({
      applyLeaseExpiresAt: null,
      applyLeaseToken: null,
      credentialBindings: [{ credentialReference: SOURCE_SECRET_REFERENCE }],
      id: "source-1",
      sourceKey: SOURCE_KEY,
      status: "active",
      supplierOrgId: "supplier-1",
    });
    databaseBoundary.ingestPreparedInventoryBatch.mockResolvedValue(
      ingestionResult()
    );
    databaseBoundary.reconcileStaleInventory.mockResolvedValue({
      degradedSourceCount: 1,
      staleOfferCount: 2,
      unpublishedCount: 2,
    });
  });

  test("rejects malformed source keys before database authorization", async () => {
    const response = await pushInventoryBatch(pushRequest(), {
      params: Promise.resolve({ sourceKey: "../tenant-escape" }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: "invalid_source_key",
    });
    expect(prismaBoundary.inventorySource.findFirst).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("rejects a missing source bearer credential", async () => {
    const response = await pushInventoryBatch(
      pushRequest(createBatch(), {
        "content-type": "application/json",
        "idempotency-key": "request-42",
      }),
      routeContext()
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
  });

  test("fails closed when the source credential reference is missing", async () => {
    prismaBoundary.inventorySource.findFirst.mockResolvedValue({
      applyLeaseExpiresAt: null,
      applyLeaseToken: null,
      credentialBindings: [],
      id: "source-1",
      sourceKey: SOURCE_KEY,
      status: "active",
      supplierOrgId: "supplier-1",
    });

    const response = await pushInventoryBatch(pushRequest(), routeContext());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "source_credential_not_configured",
    });
  });

  test("fails closed when the credential reference is unresolved", async () => {
    vi.stubEnv("AUTOMARKET_INVENTORY_DEALER_FEED_ONE_TOKEN", "");

    const response = await pushInventoryBatch(pushRequest(), routeContext());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "source_credential_not_configured",
    });
  });

  test("rejects a credential reference outside the inventory token namespace", async () => {
    prismaBoundary.inventorySource.findFirst.mockResolvedValue({
      applyLeaseExpiresAt: null,
      applyLeaseToken: null,
      credentialBindings: [{ credentialReference: "managed:credential:one" }],
      id: "source-1",
      sourceKey: SOURCE_KEY,
      status: "active",
      supplierOrgId: "supplier-1",
    });

    const response = await pushInventoryBatch(pushRequest(), routeContext());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "source_credential_not_configured",
    });
  });

  test("rejects a source whose scoped ingress binding is revoked", async () => {
    prismaBoundary.inventorySource.findFirst.mockResolvedValue(null);
    const response = await pushInventoryBatch(pushRequest(), routeContext());
    expect(response.status).toBe(401);
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
  });

  test("accepts a current retiring scoped binding", async () => {
    const response = await pushInventoryBatch(pushRequest(), routeContext());
    expect(response.status).toBe(200);
    expect(databaseBoundary.ingestPreparedInventoryBatch).toHaveBeenCalledTimes(
      1
    );
  });

  test("accepts the retiring binding during credential rotation overlap", async () => {
    vi.stubEnv(
      "AUTOMARKET_INVENTORY_DEALER_FEED_ONE_RETIRING_TOKEN",
      RETIRING_SOURCE_SECRET
    );
    prismaBoundary.inventorySource.findFirst.mockResolvedValue({
      applyLeaseExpiresAt: null,
      applyLeaseToken: null,
      credentialBindings: [
        { credentialReference: SOURCE_SECRET_REFERENCE },
        { credentialReference: RETIRING_SOURCE_SECRET_REFERENCE },
      ],
      id: "source-1",
      sourceKey: SOURCE_KEY,
      status: "active",
      supplierOrgId: "supplier-1",
    });

    const response = await pushInventoryBatch(
      pushRequest(
        createBatch(),
        pushHeaders({ authorization: `Bearer ${RETIRING_SOURCE_SECRET}` })
      ),
      routeContext()
    );

    expect(response.status).toBe(200);
    expect(databaseBoundary.ingestPreparedInventoryBatch).toHaveBeenCalledTimes(
      1
    );
  });

  test("lets a valid retiring binding survive an unresolved newest binding", async () => {
    vi.stubEnv(
      "AUTOMARKET_INVENTORY_DEALER_FEED_ONE_RETIRING_TOKEN",
      RETIRING_SOURCE_SECRET
    );
    prismaBoundary.inventorySource.findFirst.mockResolvedValue({
      applyLeaseExpiresAt: null,
      applyLeaseToken: null,
      credentialBindings: [
        { credentialReference: "managed:unconfigured:newest" },
        { credentialReference: RETIRING_SOURCE_SECRET_REFERENCE },
      ],
      id: "source-1",
      sourceKey: SOURCE_KEY,
      status: "active",
      supplierOrgId: "supplier-1",
    });

    const response = await pushInventoryBatch(
      pushRequest(
        createBatch(),
        pushHeaders({ authorization: `Bearer ${RETIRING_SOURCE_SECRET}` })
      ),
      routeContext()
    );

    expect(response.status).toBe(200);
  });

  test.each([
    [
      { credentialReference: SOURCE_SECRET_REFERENCE },
      { credentialReference: "managed:unconfigured:retiring" },
    ],
    [
      { credentialReference: "managed:unconfigured:retiring" },
      { credentialReference: SOURCE_SECRET_REFERENCE },
    ],
  ])("fails closed when a rejected credential overlaps an unresolved binding", async (...credentialBindings) => {
    prismaBoundary.inventorySource.findFirst.mockResolvedValue({
      applyLeaseExpiresAt: null,
      applyLeaseToken: null,
      credentialBindings,
      id: "source-1",
      sourceKey: SOURCE_KEY,
      status: "active",
      supplierOrgId: "supplier-1",
    });

    const response = await pushInventoryBatch(
      pushRequest(
        createBatch(),
        pushHeaders({ authorization: "Bearer definitely-not-valid" })
      ),
      routeContext()
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "source_credential_not_configured",
    });
  });

  test("bounds scoped credential candidates in the source query", async () => {
    await pushInventoryBatch(pushRequest(), routeContext());

    expect(prismaBoundary.inventorySource.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          credentialBindings: expect.objectContaining({ take: 5 }),
        }),
      })
    );
  });

  test("rejects external ingestion while the source apply lease is current", async () => {
    prismaBoundary.inventorySource.findFirst.mockResolvedValue({
      applyLeaseExpiresAt: new Date(Date.now() + 60_000),
      applyLeaseToken: "opaque-lease-token",
      credentialBindings: [{ credentialReference: SOURCE_SECRET_REFERENCE }],
      id: "source-1",
      sourceKey: SOURCE_KEY,
      status: "active",
      supplierOrgId: "supplier-1",
    });
    const response = await pushInventoryBatch(pushRequest(), routeContext());
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "inventory_source_leased",
    });
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
  });

  test("rejects an invalid source bearer credential", async () => {
    const response = await pushInventoryBatch(
      pushRequest(
        createBatch(),
        pushHeaders({ authorization: "Bearer wrong" })
      ),
      routeContext()
    );

    expect(response.status).toBe(401);
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
  });

  test("requires a source-scoped idempotency key", async () => {
    const response = await pushInventoryBatch(
      pushRequest(createBatch(), {
        authorization: `Bearer ${SOURCE_SECRET}`,
        "content-type": "application/json",
      }),
      routeContext()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "idempotency_key_required",
    });
  });

  test("rejects a declared payload larger than the synchronous limit", async () => {
    const response = await pushInventoryBatch(
      pushRequest(
        createBatch(),
        pushHeaders({
          "content-length": String(INVENTORY_MAX_PAYLOAD_BYTES + 1),
        })
      ),
      routeContext()
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "payload_too_large",
    });
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
    expect(
      databaseBoundary.recordInventoryIngressFailure
    ).not.toHaveBeenCalled();
  });

  test("does not persist a synthetic exact-replay hash after a partial oversized read", async () => {
    const request = new Request(
      `https://api.example/inventory/v1/sources/${SOURCE_KEY}/batches`,
      {
        body: new Uint8Array(INVENTORY_MAX_PAYLOAD_BYTES + 1),
        headers: pushHeaders(),
        method: "POST",
      }
    );
    expect(request.headers.get("content-length")).toBeNull();

    const response = await pushInventoryBatch(request, routeContext());

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "payload_too_large",
    });
    expect(
      databaseBoundary.recordInventoryIngressFailure
    ).not.toHaveBeenCalled();
  });

  test("rejects unsupported push media without reading or durably hashing its body", async () => {
    const response = await pushInventoryBatch(
      new Request(
        `https://api.example/inventory/v1/sources/${SOURCE_KEY}/batches`,
        {
          body: "not-an-exactly-read-payload",
          headers: pushHeaders({ "content-type": "application/xml" }),
          method: "POST",
        }
      ),
      routeContext()
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: "unsupported_media_type",
    });
    expect(
      databaseBoundary.recordInventoryIngressFailure
    ).not.toHaveBeenCalled();
  });

  test("rejects an invalid v1 envelope without echoing its payload", async () => {
    const response = await pushInventoryBatch(
      pushRequest({
        ...createBatch(),
        secretMarker: "must-not-be-returned",
      }),
      routeContext()
    );

    expect(response.status).toBe(422);
    const responseBody = await response.text();
    expect(responseBody).toBe('{"error":"invalid_inventory_envelope"}');
    expect(responseBody).not.toContain("must-not-be-returned");
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
    expect(databaseBoundary.recordInventoryIngressFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: "invalid_inventory_envelope",
        idempotencyKey: "request-42",
        sourceKey: SOURCE_KEY,
      })
    );
  });

  test("returns 409 when malformed bytes reuse an idempotency key", async () => {
    databaseBoundary.recordInventoryIngressFailure.mockRejectedValueOnce(
      new databaseBoundary.InventoryIdempotencyConflictError()
    );

    const response = await pushInventoryBatch(
      pushRequest({ malformed: "different-content" }),
      routeContext()
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "idempotency_conflict",
    });
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
  });

  test("quarantines an unsafe row while passing valid raw and normalized provenance", async () => {
    const unsafeRecord = createRecord("unsafe");
    const unsafeMedia = unsafeRecord.offer.media[0];
    if (!unsafeMedia) {
      throw new Error("Expected the test record to include media");
    }
    unsafeMedia.url = "http://127.0.0.1/private.jpg";
    databaseBoundary.ingestPreparedInventoryBatch.mockResolvedValue(
      ingestionResult({
        projectedCount: 0,
        rejectedCount: 1,
        status: "completed_with_issues",
      })
    );

    const response = await pushInventoryBatch(
      pushRequest(createBatch([createRecord("valid"), unsafeRecord])),
      routeContext()
    );

    expect(response.status).toBe(200);
    const call = getFirstIngestionCall();
    expect(call.trigger).toBe("api");
    expect(call.payloadSha256).toMatch(SHA256_PATTERN);
    expect(call.preparedBatch.records).toHaveLength(1);
    expect(call.preparedBatch.preparedRecords).toMatchObject([
      {
        normalized: { vehicle: { vin: "WBAKS410500H12345" } },
        raw: {
          externalId: "stock-valid",
          vehicle: { vin: "wbaks410500h12345" },
        },
        rowNumber: 1,
      },
    ]);
    expect(call.preparedBatch.quarantinedRecords[0]).toMatchObject({
      externalId: "stock-unsafe",
      rowNumber: 2,
    });
    expect(call.preparedBatch.quarantinedRecords[0].issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "offer.media.0.url" }),
      ])
    );
    expect(await response.text()).not.toContain("127.0.0.1");
  });

  test("accepts 100 records and rejects a 101-record synchronous envelope", async () => {
    const oneHundred = Array.from({ length: 100 }, (_, index) =>
      createRecord(String(index + 1))
    );
    const accepted = await pushInventoryBatch(
      pushRequest(createBatch(oneHundred)),
      routeContext()
    );

    expect(accepted.status).toBe(200);
    expect(databaseBoundary.ingestPreparedInventoryBatch).toHaveBeenCalledTimes(
      1
    );

    const rejected = await pushInventoryBatch(
      pushRequest(createBatch([...oneHundred, createRecord("101")])),
      routeContext()
    );

    expect(rejected.status).toBe(422);
    await expect(rejected.json()).resolves.toEqual({
      error: "invalid_inventory_envelope",
    });
    expect(databaseBoundary.ingestPreparedInventoryBatch).toHaveBeenCalledTimes(
      1
    );
  });

  test("accepts an empty complete full snapshot and rejects an empty incremental batch", async () => {
    const accepted = await pushInventoryBatch(
      pushRequest({
        ...createBatch([]),
        batch: {
          ...createBatch([]).batch,
          complete: true,
          mode: "full_snapshot",
        },
      }),
      routeContext()
    );
    expect(accepted.status).toBe(200);
    expect(getFirstIngestionCall().preparedBatch.records).toEqual([]);

    databaseBoundary.ingestPreparedInventoryBatch.mockClear();
    const rejected = await pushInventoryBatch(
      pushRequest(createBatch([])),
      routeContext()
    );
    expect(rejected.status).toBe(422);
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
  });

  test.each([
    ["duplicate", 200],
    ["in_progress", 202],
    ["failed_replay", 409],
  ])("maps %s replays to HTTP %i", async (status, httpStatus) => {
    databaseBoundary.ingestPreparedInventoryBatch.mockResolvedValue(
      ingestionResult({ duplicate: true, status })
    );

    const response = await pushInventoryBatch(pushRequest(), routeContext());

    expect(response.status).toBe(httpStatus);
    await expect(response.json()).resolves.toMatchObject({
      duplicate: true,
      status,
    });
  });

  test("maps a configured source mode mismatch to a stable conflict", async () => {
    databaseBoundary.ingestPreparedInventoryBatch.mockRejectedValue(
      new databaseBoundary.InventorySourceModeMismatchError()
    );

    const response = await pushInventoryBatch(pushRequest(), routeContext());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "inventory_source_mode_mismatch",
    });
  });

  test("accepts the explicit CSV template and maps it into the v1 envelope", async () => {
    const response = await importInventory(csvRequest(), routeContext());

    expect(response.status).toBe(200);
    const call = getFirstIngestionCall();
    expect(call).toMatchObject({
      idempotencyKey: "csv-request-42",
      sourceKey: SOURCE_KEY,
      trigger: "manual",
    });
    expect(call.preparedBatch.batch).toEqual({
      complete: false,
      generatedAt: "2026-07-12T18:00:00.000Z",
      id: "csv-request-42",
      mode: "incremental",
    });
    expect(call.preparedBatch.preparedRecords).toMatchObject([
      {
        normalized: {
          offer: {
            description: "Authorized, dealer inventory",
            destinationMarketCodes: ["bg", "de"],
            nativePrice: {
              amountMinor: "5749900",
              currencyCode: "EUR",
              exponent: 2,
            },
          },
          sourceUpdatedAt: "2026-07-12T17:55:00+03:00",
          vehicle: { vin: "WBAKS410500H12345", year: 2022 },
        },
        raw: {
          format: "csv",
          headers: expect.arrayContaining(["external_id", "source_updated_at"]),
          sourceRowNumber: 2,
          values: expect.any(Array),
        },
        rowNumber: 1,
      },
    ]);
    expect(call.payloadSha256).toMatch(SHA256_PATTERN);
  });

  test("rejects unsupported import media without durable exact-replay recording", async () => {
    const response = await importInventory(
      new Request(
        `https://api.example/inventory/v1/sources/${SOURCE_KEY}/imports`,
        {
          body: "not-an-exactly-read-payload",
          headers: pushHeaders({
            "content-type": "application/octet-stream",
            "idempotency-key": "manual-unsupported-1",
          }),
          method: "POST",
        }
      ),
      routeContext()
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: "unsupported_media_type",
    });
    expect(
      databaseBoundary.recordInventoryIngressFailure
    ).not.toHaveBeenCalled();
  });

  test("rejects a CSV template that omits source_updated_at", async () => {
    const columns = INVENTORY_CSV_COLUMNS.filter(
      (column) => column !== "source_updated_at"
    );
    const response = await importInventory(
      csvRequest(createCsv({}, columns)),
      routeContext()
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: "invalid_csv" });
    expect(
      databaseBoundary.ingestPreparedInventoryBatch
    ).not.toHaveBeenCalled();
  });

  test("accepts a manual JSON import through the same ingestion service", async () => {
    const response = await importInventory(
      new Request(
        `https://api.example/inventory/v1/sources/${SOURCE_KEY}/imports`,
        {
          body: JSON.stringify(createBatch()),
          headers: pushHeaders({ "idempotency-key": "manual-json-1" }),
          method: "POST",
        }
      ),
      routeContext()
    );

    expect(response.status).toBe(200);
    expect(databaseBoundary.ingestPreparedInventoryBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "manual-json-1",
        trigger: "manual",
      })
    );
  });
});

describe("inventory reconciliation cron", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("CRON_SECRET", CRON_SECRET);
    databaseBoundary.reconcileStaleInventory.mockResolvedValue({
      degradedSourceCount: 1,
      staleOfferCount: 2,
      unpublishedCount: 2,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("fails closed when cron authentication is not configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const response = await reconcileInventory(
      new Request("https://api.example/cron/inventory-reconciliation")
    );

    expect(response.status).toBe(503);
    expect(databaseBoundary.reconcileStaleInventory).not.toHaveBeenCalled();
  });

  test("rejects an invalid cron bearer", async () => {
    const response = await reconcileInventory(
      new Request("https://api.example/cron/inventory-reconciliation", {
        headers: { authorization: "Bearer wrong" },
      })
    );

    expect(response.status).toBe(401);
    expect(databaseBoundary.reconcileStaleInventory).not.toHaveBeenCalled();
  });

  test("reconciles stale inventory only with the configured cron bearer", async () => {
    const response = await reconcileInventory(
      new Request("https://api.example/cron/inventory-reconciliation", {
        headers: { authorization: `Bearer ${CRON_SECRET}` },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      degradedSourceCount: 1,
      staleOfferCount: 2,
      unpublishedCount: 2,
    });
    expect(databaseBoundary.reconcileStaleInventory).toHaveBeenCalledTimes(1);
  });
});
