import { describe, expect, it } from "vitest";
import {
  evaluatePublicationEligibility,
  getCanonicalVehicleKey,
  getInventoryFreshnessStatus,
  shouldReconcileMissingRecord,
} from "./inventory-policy";

const now = new Date("2026-07-12T18:00:00.000Z");

const eligibleInput = {
  capabilityStatuses: {
    "inventory.supply": { status: "active" as const },
    "marketplace.publish": { status: "active" as const },
  },
  displayCurrencySupported: true,
  inventoryRight: { status: "active" as const },
  marketPermission: { status: "active" as const },
  mediaRights: { status: "active" as const },
  moderationHold: false,
  now,
  offer: {
    freshUntil: new Date("2026-07-13T18:00:00.000Z"),
    status: "available" as const,
  },
  organization: {
    active: true,
    kybStatus: "verified" as const,
    supplierTrustStatus: "verified" as const,
  },
  requiredDataComplete: true,
  sourceStatus: "active" as const,
  vehicleIdentityStatus: "canonical" as const,
};

describe("supplier publication policy", () => {
  it("allows only a fully permissioned and fresh offer", () => {
    expect(evaluatePublicationEligibility(eligibleInput)).toEqual({
      decision: "eligible",
      reasonCodes: [],
    });
  });

  it("accepts a recovering degraded source while a successful batch is applying", () => {
    expect(
      evaluatePublicationEligibility({
        ...eligibleInput,
        sourceStatus: "degraded",
      })
    ).toEqual({ decision: "eligible", reasonCodes: [] });
  });

  it("returns stable blockers instead of trusting organization type", () => {
    const result = evaluatePublicationEligibility({
      ...eligibleInput,
      marketPermission: null,
      organization: {
        ...eligibleInput.organization,
        kybStatus: "pending",
      },
    });

    expect(result.decision).toBe("ineligible");
    expect(result.reasonCodes).toContain("organization_kyb_not_verified");
    expect(result.reasonCodes).toContain("market_permission_missing");
  });
});

describe("inventory reconciliation and identity", () => {
  it("requires two complete successful snapshots and 24 hours before absence withdrawal", () => {
    expect(
      shouldReconcileMissingRecord({
        complete: true,
        consecutiveMissingRuns: 1,
        lastSeenAt: new Date("2026-07-11T17:00:00.000Z"),
        missingGraceRuns: 2,
        mode: "full_snapshot",
        now,
        runStatus: "completed",
      })
    ).toBe(true);

    expect(
      shouldReconcileMissingRecord({
        complete: false,
        consecutiveMissingRuns: 8,
        lastSeenAt: new Date("2026-07-01T00:00:00.000Z"),
        missingGraceRuns: 2,
        mode: "full_snapshot",
        now,
        runStatus: "failed",
      })
    ).toBe(false);
  });

  it("uses validated VIN only and otherwise keeps identity source-scoped", () => {
    const baseRecord = {
      externalId: "stock-1001",
      vehicle: {
        bodyType: "suv" as const,
        category: "car" as const,
        fuelType: "diesel" as const,
        make: "BMW",
        model: "X5",
        transmission: "automatic" as const,
        year: 2022,
      },
    };

    expect(getCanonicalVehicleKey("feed-1", baseRecord)).toBe(
      "source:feed-1:stock-1001"
    );
    expect(
      getCanonicalVehicleKey("feed-1", {
        ...baseRecord,
        vehicle: { ...baseRecord.vehicle, vin: "WBAKS410500H12345" },
      })
    ).toBe("vin:WBAKS410500H12345");
  });

  it("derives freshness from the persisted deadline", () => {
    expect(getInventoryFreshnessStatus(null, now)).toBe("unknown");
    expect(getInventoryFreshnessStatus("2026-07-12T19:00:00.000Z", now)).toBe(
      "fresh"
    );
    expect(getInventoryFreshnessStatus("2026-07-12T17:00:00.000Z", now)).toBe(
      "stale"
    );
  });
});
