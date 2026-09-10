import "server-only";

import { getInventoryFreshnessStatus } from "@repo/marketplace-domain";
import { database } from "./index";

export interface InventorySourceHealthRow {
  connectionStatus: "setup" | "active" | "degraded" | "paused" | "disconnected";
  consecutiveFailureCount: number;
  freshness: "fresh" | "stale" | "unknown";
  id: string;
  issueCounts: {
    blocking: number;
    error: number;
    warning: number;
  };
  kind:
    | "legacy"
    | "manual"
    | "csv"
    | "json"
    | "https_feed"
    | "api"
    | "webhook"
    | "sftp"
    | "dms";
  lastAttemptAt?: string;
  lastCompleteSnapshotAt?: string;
  lastSuccessfulSyncAt?: string;
  latestRun?: {
    changedCount: number;
    completedAt?: string;
    id: string;
    missingCount: number;
    projectedCount: number;
    receivedCount: number;
    rejectedCount: number;
    startedAt: string;
    status: string;
    unchangedCount: number;
    unpublishedCount: number;
  };
  name: string;
  nextExpectedSyncAt?: string;
  sourceKey: string;
  syncMode: "full_snapshot" | "incremental";
}

export interface ImporterWorkspaceOverview {
  capabilities: Array<{
    capabilityKey: string;
    expiresAt?: string;
    status: string;
  }>;
  marketPermissions: Array<{
    category: string;
    countryCode?: string;
    marketCode: string;
    permissionKey: string;
    status: string;
    validFrom: string;
    validUntil?: string;
  }>;
  organization: {
    displayName: string;
    id: string;
    kybExpiresAt?: string;
    kybStatus: string;
    onboardingStatus: string;
    orgType: string;
    supplierTrustExpiresAt?: string;
    supplierTrustStatus: "pending" | "rejected" | "unverified" | "verified";
  };
  sources: InventorySourceHealthRow[];
}

const toIso = (value?: Date | null) => value?.toISOString();

const toConnectionStatus = (
  status: "pending" | "active" | "paused" | "degraded" | "disabled"
): InventorySourceHealthRow["connectionStatus"] => {
  if (status === "active" || status === "degraded") {
    return status;
  }

  if (status === "paused") {
    return "paused";
  }

  return status === "pending" ? "setup" : "disconnected";
};

export const getImporterWorkspaceOverviewByClerkOrgId = async (
  clerkOrgId: string
): Promise<ImporterWorkspaceOverview | null> => {
  const organization = await database.dealerOrg.findFirst({
    include: {
      capabilities: {
        orderBy: { capabilityKey: "asc" },
      },
      inventorySources: {
        include: {
          syncRuns: {
            include: {
              issues: {
                select: { severity: true },
              },
            },
            orderBy: { startedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { name: "asc" },
        where: { deletedAt: null },
      },
      marketPermissions: {
        include: { market: true },
        orderBy: [{ market: { code: "asc" } }, { category: "asc" }],
      },
      supplierTrust: {
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
    where: { clerkOrgId, deletedAt: null },
  });

  if (!organization) {
    return null;
  }

  const supplierTrustStatus =
    organization.supplierTrust[0]?.status ?? "unverified";

  return {
    capabilities: organization.capabilities.map((capability) => ({
      capabilityKey: capability.capabilityKey,
      expiresAt: toIso(capability.expiresAt),
      status: capability.status,
    })),
    marketPermissions: organization.marketPermissions.map((permission) => ({
      category: permission.category,
      countryCode: permission.market.countryCode ?? undefined,
      marketCode: permission.market.code,
      permissionKey: permission.permissionKey,
      status: permission.status,
      validFrom: permission.validFrom.toISOString(),
      validUntil: toIso(permission.validUntil),
    })),
    organization: {
      displayName: organization.displayName,
      id: organization.id,
      kybExpiresAt: toIso(organization.kybExpiresAt),
      kybStatus: organization.kybStatus,
      onboardingStatus: organization.onboardingStatus,
      orgType: organization.orgType,
      supplierTrustExpiresAt: toIso(organization.supplierTrust[0]?.expiresAt),
      supplierTrustStatus,
    },
    sources: organization.inventorySources.map((source) => {
      const latestRun = source.syncRuns[0];
      const issueCounts = { blocking: 0, error: 0, warning: 0 };

      for (const issue of latestRun?.issues ?? []) {
        issueCounts[issue.severity] += 1;
      }

      return {
        connectionStatus: toConnectionStatus(source.status),
        consecutiveFailureCount: source.consecutiveFailureCount,
        freshness: getInventoryFreshnessStatus(source.nextExpectedSyncAt),
        id: source.id,
        issueCounts,
        kind: source.kind,
        lastAttemptAt: toIso(source.lastAttemptAt),
        lastCompleteSnapshotAt: toIso(source.lastCompleteSnapshotAt),
        lastSuccessfulSyncAt: toIso(source.lastSuccessfulSyncAt),
        latestRun: latestRun
          ? {
              changedCount: latestRun.changedCount,
              completedAt: toIso(latestRun.completedAt),
              id: latestRun.id,
              missingCount: latestRun.missingCount,
              projectedCount: latestRun.projectedCount,
              receivedCount: latestRun.receivedCount,
              rejectedCount: latestRun.rejectedCount,
              startedAt: latestRun.startedAt.toISOString(),
              status: latestRun.status,
              unchangedCount: latestRun.unchangedCount,
              unpublishedCount: latestRun.unpublishedCount,
            }
          : undefined,
        name: source.name,
        nextExpectedSyncAt: toIso(source.nextExpectedSyncAt),
        sourceKey: source.sourceKey,
        syncMode: source.syncMode,
      };
    }),
  };
};
