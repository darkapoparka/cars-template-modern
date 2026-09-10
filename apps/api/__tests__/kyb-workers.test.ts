import { beforeEach, describe, expect, test, vi } from "vitest";

const boundary = vi.hoisted(() => ({
  claim: vi.fn(),
  expire: vi.fn(),
  findGrants: vi.fn(),
  purge: vi.fn(),
  recordFailure: vi.fn(),
  recordPurged: vi.fn(),
  validateLease: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    organizationVerificationGrant: { findMany: boundary.findGrants },
  },
}));
vi.mock("@repo/database/kyb-documents", () => ({
  claimKybDocumentsForRetentionPurge: boundary.claim,
  recordKybDocumentPurgeFailure: boundary.recordFailure,
  recordKybDocumentPurged: boundary.recordPurged,
  validateKybDocumentPurgeLease: boundary.validateLease,
}));
vi.mock("@repo/database/organization-verification", () => ({
  expireOrganizationVerificationGrant: boundary.expire,
  OrganizationVerificationConflictError: class extends Error {},
}));
vi.mock("@repo/storage", () => ({ purgePrivateArtifact: boundary.purge }));

import {
  expireVerificationGrants,
  purgeKybRetention,
} from "../lib/kyb-workers";

const provider = { name: "private-test" } as never;
const document = {
  documentId: "document_123456",
  leaseExpiresAt: new Date(Date.now() + 60_000),
  leaseToken: "opaque-purge-lease",
  storageKey: "kyb/org/case/document/object",
  storageProvider: "private-test",
};

describe("KYB retention worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boundary.claim.mockResolvedValue([document]);
    boundary.expire.mockResolvedValue({});
    boundary.findGrants.mockResolvedValue([]);
    boundary.validateLease.mockResolvedValue({
      storageKey: document.storageKey,
    });
    boundary.purge.mockResolvedValue(undefined);
    boundary.recordPurged.mockResolvedValue({ count: 1 });
    boundary.recordFailure.mockResolvedValue({});
  });

  test("tombstones only after verified deletion", async () => {
    const result = await purgeKybRetention(provider, 10);
    expect(result).toMatchObject({ failed: 0, purged: 1 });
    expect(boundary.purge).toHaveBeenCalledWith(provider, document.storageKey);
    expect(boundary.recordPurged).toHaveBeenCalledWith({
      documentId: document.documentId,
      leaseToken: document.leaseToken,
    });
  });

  test("keeps deletion failures retryable", async () => {
    boundary.purge.mockRejectedValue(new Error("storage_unavailable"));
    const result = await purgeKybRetention(provider, 10);
    expect(result).toMatchObject({ failed: 1, purged: 0 });
    expect(boundary.recordPurged).not.toHaveBeenCalled();
    expect(boundary.recordFailure).toHaveBeenCalledWith({
      documentId: document.documentId,
      errorCode: "storage_unavailable",
      leaseToken: document.leaseToken,
    });
  });

  test("does not mutate legal-hold work when the durable claim returns none", async () => {
    boundary.claim.mockResolvedValue([]);
    const result = await purgeKybRetention(provider, 10);
    expect(result).toMatchObject({ failed: 0, purged: 0 });
    expect(boundary.purge).not.toHaveBeenCalled();
    expect(boundary.recordPurged).not.toHaveBeenCalled();
  });

  test("rechecks legal hold immediately before private deletion", async () => {
    boundary.validateLease.mockResolvedValue(null);
    const result = await purgeKybRetention(provider, 10);
    expect(result).toMatchObject({ failed: 0, purged: 0 });
    expect(boundary.purge).not.toHaveBeenCalled();
    expect(boundary.recordPurged).not.toHaveBeenCalled();
  });

  test("fails closed before claiming when private storage is unconfigured", async () => {
    const result = await purgeKybRetention(
      { name: "unconfigured" } as never,
      10
    );
    expect(result.status).toBe("storage_unconfigured");
    expect(boundary.claim).not.toHaveBeenCalled();
  });

  test("expires elapsed active and suspended grants", async () => {
    boundary.findGrants.mockResolvedValue([
      { id: "grant_active", version: 2 },
      { id: "grant_suspended", version: 4 },
    ]);

    await expect(expireVerificationGrants(10)).resolves.toMatchObject({
      claimed: 2,
      conflicts: 0,
      expired: 2,
    });
    expect(boundary.findGrants).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ["active", "suspended"] },
          validUntil: { lte: expect.any(Date) },
        },
      })
    );
    expect(boundary.expire).toHaveBeenCalledTimes(2);
  });

  test("counts only optimistic verification conflicts and surfaces service failures", async () => {
    const { OrganizationVerificationConflictError } = await import(
      "@repo/database/organization-verification"
    );
    boundary.findGrants.mockResolvedValue([{ id: "grant_active", version: 2 }]);
    boundary.expire.mockRejectedValueOnce(
      new OrganizationVerificationConflictError("changed")
    );
    await expect(expireVerificationGrants(10)).resolves.toMatchObject({
      claimed: 1,
      conflicts: 1,
      expired: 0,
    });

    boundary.expire.mockRejectedValueOnce(new Error("database_unavailable"));
    await expect(expireVerificationGrants(10)).rejects.toThrow(
      "database_unavailable"
    );
  });
});
