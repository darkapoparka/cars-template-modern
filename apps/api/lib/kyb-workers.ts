import { database } from "@repo/database";
import {
  claimKybDocumentsForRetentionPurge,
  recordKybDocumentPurged,
  recordKybDocumentPurgeFailure,
  validateKybDocumentPurgeLease,
} from "@repo/database/kyb-documents";
import {
  expireOrganizationVerificationGrant,
  OrganizationVerificationConflictError,
} from "@repo/database/organization-verification";
import {
  type PrivateObjectStorageProvider,
  purgePrivateArtifact,
} from "@repo/storage";

const SAFE_PURGE_ERROR_CODE_PATTERN = /^[a-z0-9_]{3,64}$/;

export const expireVerificationGrants = async (limit = 50) => {
  const now = new Date();
  const grants = await database.organizationVerificationGrant.findMany({
    orderBy: { validUntil: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
    where: {
      status: { in: ["active", "suspended"] },
      validUntil: { lte: now },
    },
  });
  let expired = 0;
  let conflicts = 0;
  for (const grant of grants) {
    try {
      await expireOrganizationVerificationGrant({
        expectedVersion: grant.version,
        grantId: grant.id,
        requestId: `verification-expiry:${grant.id}:${grant.version}`,
      });
      expired += 1;
    } catch (error) {
      if (error instanceof OrganizationVerificationConflictError) {
        conflicts += 1;
        continue;
      }
      throw error;
    }
  }
  return { claimed: grants.length, conflicts, expired };
};

export const purgeKybRetention = async (
  provider: PrivateObjectStorageProvider,
  limit = 25
) => {
  if (provider.name === "unconfigured") {
    return { failed: 0, purged: 0, status: "storage_unconfigured" as const };
  }
  const candidates = await claimKybDocumentsForRetentionPurge(limit);
  let failed = 0;
  let purged = 0;
  for (const document of candidates) {
    try {
      const current = await validateKybDocumentPurgeLease({
        documentId: document.documentId,
        leaseToken: document.leaseToken,
      });
      if (!current?.storageKey) {
        continue;
      }
      await purgePrivateArtifact(provider, current.storageKey);
      const finalized = await recordKybDocumentPurged({
        documentId: document.documentId,
        leaseToken: document.leaseToken,
      });
      if (finalized.count !== 1) {
        throw new Error("kyb_purge_lease_lost");
      }
      purged += 1;
    } catch (error) {
      const errorCode =
        error instanceof Error &&
        SAFE_PURGE_ERROR_CODE_PATTERN.test(error.message)
          ? error.message
          : "kyb_private_purge_failed";
      await recordKybDocumentPurgeFailure({
        documentId: document.documentId,
        errorCode,
        leaseToken: document.leaseToken,
      });
      failed += 1;
    }
  }
  return { failed, purged, status: "completed" as const };
};
