import { describe, expect, it } from "vitest";
import {
  getInventoryFreshnessWindow,
  hasEqualBatchTimestampConflict,
  hasSameTimestampPayloadConflict,
} from "./inventory-ordering";

describe("inventory ordering and freshness", () => {
  const receivedAt = new Date("2026-07-13T12:00:00.000Z");

  it("uses source generation time for delayed-batch freshness", () => {
    expect(
      getInventoryFreshnessWindow({
        receivedAt,
        sourceGeneratedAt: new Date("2026-07-13T11:30:00.000Z"),
        staleAfterMinutes: 120,
      })
    ).toEqual({
      confirmationAt: new Date("2026-07-13T11:30:00.000Z"),
      expiredAtReceipt: false,
      freshUntil: new Date("2026-07-13T13:30:00.000Z"),
    });
  });

  it("fails freshness closed when a first batch is already stale", () => {
    expect(
      getInventoryFreshnessWindow({
        receivedAt,
        sourceGeneratedAt: new Date("2026-07-13T10:00:00.000Z"),
        staleAfterMinutes: 120,
      }).expiredAtReceipt
    ).toBe(true);
  });

  it("never confirms inventory in the future", () => {
    expect(
      getInventoryFreshnessWindow({
        receivedAt,
        sourceGeneratedAt: new Date("2026-07-13T12:01:00.000Z"),
        staleAfterMinutes: 120,
      }).confirmationAt
    ).toEqual(receivedAt);
  });

  it("rejects changed content at the same record timestamp regardless of version", () => {
    expect(
      hasSameTimestampPayloadConflict({
        existingPayloadHash: "a".repeat(64),
        existingSourceUpdatedAt: receivedAt,
        incomingPayloadHash: "b".repeat(64),
        incomingSourceUpdatedAt: receivedAt,
      })
    ).toBe(true);
  });

  it("allows an exact record confirmation at the same timestamp", () => {
    expect(
      hasSameTimestampPayloadConflict({
        existingPayloadHash: "a".repeat(64),
        existingSourceUpdatedAt: receivedAt,
        incomingPayloadHash: "a".repeat(64),
        incomingSourceUpdatedAt: receivedAt,
      })
    ).toBe(false);
  });

  it("rejects distinct equal-timestamp batches and permits exact content", () => {
    expect(
      hasEqualBatchTimestampConflict({
        incomingPayloadHash: "b".repeat(64),
        incomingSourceGeneratedAt: receivedAt,
        lastAppliedPayloadHash: "a".repeat(64),
        lastAppliedSourceGeneratedAt: receivedAt,
      })
    ).toBe(true);
    expect(
      hasEqualBatchTimestampConflict({
        incomingPayloadHash: "a".repeat(64),
        incomingSourceGeneratedAt: receivedAt,
        lastAppliedPayloadHash: "a".repeat(64),
        lastAppliedSourceGeneratedAt: receivedAt,
      })
    ).toBe(false);
  });
});
