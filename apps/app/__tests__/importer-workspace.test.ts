import { readFileSync } from "node:fs";
import type {
  ImporterWorkspaceOverview,
  InventorySourceHealthRow,
} from "@repo/database/inventory-health";
import { describe, expect, test } from "vitest";
import {
  formatImporterDate,
  formatImporterTimestamp,
  formatImporterToken,
  getImporterAuthorizationView,
  getInventorySourceHealthSummary,
  getInventorySourceHealthView,
} from "../app/(authenticated)/dealer/inventory/importer-view-state";

const now = new Date("2026-07-12T18:00:00.000Z");

const currentMarketPermission: ImporterWorkspaceOverview["marketPermissions"][number] =
  {
    category: "car",
    countryCode: "BG",
    marketCode: "BG",
    permissionKey: "inventory.publish",
    status: "active",
    validFrom: "2026-07-01T00:00:00.000Z",
    validUntil: "2026-08-12T18:00:00.000Z",
  };

const completedRun: NonNullable<InventorySourceHealthRow["latestRun"]> = {
  changedCount: 6,
  completedAt: "2026-07-12T17:30:00.000Z",
  id: "run_1",
  missingCount: 2,
  projectedCount: 6,
  receivedCount: 10,
  rejectedCount: 0,
  startedAt: "2026-07-12T17:25:00.000Z",
  status: "completed",
  unchangedCount: 4,
  unpublishedCount: 1,
};

const authorizedOverview: ImporterWorkspaceOverview = {
  capabilities: [
    {
      capabilityKey: "inventory.supply",
      expiresAt: "2026-08-12T18:00:00.000Z",
      status: "active",
    },
    {
      capabilityKey: "marketplace.publish",
      expiresAt: "2026-08-12T18:00:00.000Z",
      status: "active",
    },
  ],
  marketPermissions: [currentMarketPermission],
  organization: {
    displayName: "Auto Import Sofia",
    id: "dealer_1",
    kybExpiresAt: "2026-08-12T18:00:00.000Z",
    kybStatus: "verified",
    onboardingStatus: "approved",
    orgType: "importer",
    supplierTrustExpiresAt: "2026-08-12T18:00:00.000Z",
    supplierTrustStatus: "verified",
  },
  sources: [],
};

const completedSource: InventorySourceHealthRow = {
  connectionStatus: "active",
  consecutiveFailureCount: 0,
  freshness: "fresh",
  id: "source_1",
  issueCounts: { blocking: 0, error: 0, warning: 0 },
  kind: "json",
  lastAttemptAt: "2026-07-12T17:30:00.000Z",
  lastCompleteSnapshotAt: "2026-07-12T17:30:00.000Z",
  lastSuccessfulSyncAt: "2026-07-12T17:30:00.000Z",
  latestRun: completedRun,
  name: "Primary feed",
  nextExpectedSyncAt: "2026-07-13T17:30:00.000Z",
  sourceKey: "primary-feed",
  syncMode: "full_snapshot",
};

describe("importer workspace chrome layout", () => {
  test("uses responsive status grids without fixed-width mobile strips", () => {
    const source = readFileSync(
      "app/(authenticated)/dealer/inventory/components/importer-workspace-chrome.tsx",
      "utf8"
    );

    expect(source).not.toContain("min-w-[800px]");
    expect(source).not.toContain("overflow-x-auto border-t outline-none");
    expect(source).not.toContain("tabIndex={0}");
    expect(source.match(/overflow-x-auto/g)).toHaveLength(1);
    expect(source).toContain("overflow-x-auto border-t bg-control p-1.5");
    expect(source).toContain("min-[360px]:grid-cols-2");
    expect(source).toContain("md:grid-cols-3");
    expect(source).toContain("xl:grid-cols-5");
    expect(source).toContain("Инвентар");
    expect(source).toContain("Източници");
    expect(source).toContain("Импортирания");
    expect(source).toContain('id="importer-workspace-heading"');
    expect(source).toContain("<h2");
  });
});

describe("importer Bulgarian display copy", () => {
  test("formats dates, protocol acronyms, and enum display labels", () => {
    expect(formatImporterDate("2026-07-12T17:30:00.000Z")).toBe(
      "12.07.2026 г."
    );
    expect(formatImporterTimestamp("2026-07-12T17:30:00.000Z")).toBe(
      "12.07.2026 г., 17:30 UTC"
    );
    expect(formatImporterTimestamp()).toBe("Не е записано");
    expect(
      ["api", "csv", "json", "sftp", "dms"].map(formatImporterToken)
    ).toEqual(["API", "CSV", "JSON", "SFTP", "DMS"]);
    expect(formatImporterToken("full_snapshot")).toBe("Пълна снимка");
    expect(formatImporterToken("completed_with_issues")).toBe(
      "Завършено с проблеми"
    );
    expect(formatImporterToken("future_unknown_value")).toBe("Неизвестно");
  });
});

describe("importer organization authorization view", () => {
  test("keeps registered and pending organizations visibly gated", () => {
    const view = getImporterAuthorizationView(
      {
        ...authorizedOverview,
        capabilities: [],
        marketPermissions: [],
        organization: {
          ...authorizedOverview.organization,
          kybExpiresAt: undefined,
          kybStatus: "pending",
          onboardingStatus: "registered",
          supplierTrustExpiresAt: undefined,
          supplierTrustStatus: "unverified",
        },
      },
      now
    );

    expect(view.organizationGatesCurrent).toBe(false);
    expect(view.readiness.label).toBe("Публикуването е блокирано");
    expect(
      view.gates.find((gate) => gate.key === "registration")
    ).toMatchObject({ label: "Регистрирано", ready: false });
    expect(view.gates.find((gate) => gate.key === "kyb")).toMatchObject({
      label: "Изчаква",
      ready: false,
    });
    expect(
      view.gates.find((gate) => gate.key === "capabilities")
    ).toMatchObject({ label: "0/2 актуални", ready: false });
    expect(view.gates.find((gate) => gate.key === "markets")).toMatchObject({
      label: "Не е дадено",
      ready: false,
    });
  });

  test("reports only organization gates as current when every time-bound grant is current", () => {
    const view = getImporterAuthorizationView(authorizedOverview, now);

    expect(view.organizationGatesCurrent).toBe(true);
    expect(view.readiness).toMatchObject({
      label: "Проверките са актуални",
      tone: "success",
    });
    expect(view.readiness.detail).toContain("За всяка обява");
  });

  test("does not treat an unrelated current market grant as publish permission", () => {
    const view = getImporterAuthorizationView(
      {
        ...authorizedOverview,
        marketPermissions: [
          {
            ...currentMarketPermission,
            permissionKey: "inventory.read",
          },
        ],
      },
      now
    );

    expect(view.organizationGatesCurrent).toBe(false);
    expect(view.gates.find((gate) => gate.key === "markets")).toMatchObject({
      detail: "Няма записано право inventory.publish",
      label: "Не е дадено",
      ready: false,
    });
  });

  test("blocks expired, boundary-expired, and future-dated authorizations", () => {
    const view = getImporterAuthorizationView(
      {
        ...authorizedOverview,
        capabilities: authorizedOverview.capabilities.map(
          (capability, index) =>
            index === 0
              ? { ...capability, expiresAt: "2026-07-12T17:59:59.000Z" }
              : capability
        ),
        marketPermissions: [
          {
            ...currentMarketPermission,
            validFrom: "2026-07-12T18:00:01.000Z",
            validUntil: "2026-08-12T18:00:00.000Z",
          },
          {
            ...currentMarketPermission,
            category: "truck",
            validUntil: "2026-07-12T18:00:00.000Z",
          },
        ],
        organization: {
          ...authorizedOverview.organization,
          kybExpiresAt: "2026-07-12T18:00:00.000Z",
          supplierTrustExpiresAt: "2026-07-12T17:59:59.000Z",
        },
      },
      now
    );

    expect(view.organizationGatesCurrent).toBe(false);
    expect(view.gates.find((gate) => gate.key === "kyb")).toMatchObject({
      label: "Изтекло",
      ready: false,
    });
    expect(view.gates.find((gate) => gate.key === "trust")).toMatchObject({
      label: "Изтекло",
      ready: false,
    });
    expect(
      view.gates.find((gate) => gate.key === "capabilities")
    ).toMatchObject({ label: "1/2 актуални", ready: false });
    expect(view.gates.find((gate) => gate.key === "markets")).toMatchObject({
      label: "0/2 актуални",
      ready: false,
    });
  });

  test("keeps durable expired and rejected statuses explicit", () => {
    const view = getImporterAuthorizationView(
      {
        ...authorizedOverview,
        capabilities: authorizedOverview.capabilities.map(
          (capability, index) =>
            index === 0 ? { ...capability, status: "expired" } : capability
        ),
        marketPermissions: [{ ...currentMarketPermission, status: "expired" }],
        organization: {
          ...authorizedOverview.organization,
          kybExpiresAt: undefined,
          kybStatus: "expired",
          supplierTrustExpiresAt: "2026-08-12T18:00:00.000Z",
          supplierTrustStatus: "rejected",
        },
      },
      now
    );

    expect(view.gates.find((gate) => gate.key === "kyb")).toMatchObject({
      detail: "Състояние: Изтекло",
      label: "Изтекло",
    });
    expect(view.gates.find((gate) => gate.key === "trust")).toMatchObject({
      detail: "Състояние: Отхвърлено",
      label: "Блокирано",
    });
    expect(
      view.gates.find((gate) => gate.key === "capabilities")
    ).toMatchObject({ label: "1/2 актуални", ready: false });
    expect(view.gates.find((gate) => gate.key === "markets")).toMatchObject({
      label: "0/1 актуални",
      ready: false,
    });
  });

  test("accepts a permission starting now and fails closed on invalid dates", () => {
    const boundaryView = getImporterAuthorizationView(
      {
        ...authorizedOverview,
        marketPermissions: [
          {
            ...currentMarketPermission,
            validFrom: now.toISOString(),
          },
        ],
      },
      now
    );
    const invalidView = getImporterAuthorizationView(
      {
        ...authorizedOverview,
        marketPermissions: [
          {
            ...currentMarketPermission,
            validFrom: "not-a-date",
          },
        ],
      },
      now
    );

    expect(boundaryView.organizationGatesCurrent).toBe(true);
    expect(invalidView.organizationGatesCurrent).toBe(false);
    expect(
      invalidView.gates.find((gate) => gate.key === "markets")
    ).toMatchObject({ label: "0/1 актуални", tone: "destructive" });
  });
});

describe("inventory source health view", () => {
  test("distinguishes no run from a first sync in progress", () => {
    const noRun = getInventorySourceHealthView({
      ...completedSource,
      freshness: "unknown",
      lastAttemptAt: undefined,
      lastCompleteSnapshotAt: undefined,
      lastSuccessfulSyncAt: undefined,
      latestRun: undefined,
    });
    const syncing = getInventorySourceHealthView({
      ...completedSource,
      freshness: "unknown",
      lastCompleteSnapshotAt: undefined,
      lastSuccessfulSyncAt: undefined,
      latestRun: {
        ...completedRun,
        completedAt: undefined,
        startedAt: "2026-07-12T17:55:00.000Z",
        status: "validating",
      },
    });

    expect(noRun.latestRun.label).toBe("Няма импорти");
    expect(noRun.quality.label).toBe("Непроверено");
    expect(noRun.reconciliation.label).toBe("Не е изпълнено");
    expect(syncing.latestRun).toMatchObject({
      label: "Първа синхронизация",
      tone: "info",
    });
    expect(syncing.reconciliation.label).toBe("Изчаква");
  });

  test("preserves last-good truth when the latest run fails", () => {
    const source: InventorySourceHealthRow = {
      ...completedSource,
      connectionStatus: "degraded",
      consecutiveFailureCount: 2,
      latestRun: {
        ...completedRun,
        completedAt: "2026-07-12T17:50:00.000Z",
        missingCount: 0,
        projectedCount: 0,
        receivedCount: 0,
        startedAt: "2026-07-12T17:49:00.000Z",
        status: "failed",
        unpublishedCount: 0,
      },
    };
    const view = getInventorySourceHealthView(source);

    expect(view.connection).toMatchObject({
      label: "Влошена",
      tone: "warning",
    });
    expect(view.latestRun.label).toBe("Неуспешен");
    expect(view.latestRun.detail).toContain("Опит 12.07.2026 г., 17:50 UTC");
    expect(view.latestRun.detail).toContain(
      "Последен успешен импорт 12.07.2026 г., 17:30 UTC"
    );
    expect(view.latestRun.detail).toContain("е запазен");
    expect(view.freshness.label).toBe("Актуален");
    expect(view.reconciliation).toMatchObject({
      label: "Задържано",
      tone: "warning",
    });
  });

  test("does not invent last-good inventory for a first failed run", () => {
    const source: InventorySourceHealthRow = {
      ...completedSource,
      connectionStatus: "degraded",
      consecutiveFailureCount: 1,
      freshness: "unknown",
      lastCompleteSnapshotAt: undefined,
      lastSuccessfulSyncAt: undefined,
      latestRun: {
        ...completedRun,
        status: "failed",
      },
    };
    const view = getInventorySourceHealthView(source);
    const summary = getInventorySourceHealthSummary([source]);

    expect(view.latestRun.detail).toContain(
      "няма завършен инвентар за запазване"
    );
    expect(view.latestRun.detail).not.toContain("Последен успешен импорт");
    expect(summary.latestRun.detail).toBe("Все още няма успешен импорт");
  });

  test("keeps paused and disconnected connections distinct", () => {
    const paused = getInventorySourceHealthView({
      ...completedSource,
      connectionStatus: "paused",
    });
    const disconnected = getInventorySourceHealthView({
      ...completedSource,
      connectionStatus: "disconnected",
    });

    expect(paused.connection).toMatchObject({
      label: "На пауза",
      tone: "warning",
    });
    expect(disconnected.connection).toMatchObject({
      label: "Прекъсната",
      tone: "destructive",
    });

    const mixedSummary = getInventorySourceHealthSummary([
      { ...completedSource, connectionStatus: "degraded" },
      { ...completedSource, connectionStatus: "disconnected", id: "source_2" },
    ]);
    expect(mixedSummary.connection).toMatchObject({
      label: "1 прекъсната връзка",
      tone: "destructive",
    });
  });

  test("surfaces stale and invalid inventory independently", () => {
    const view = getInventorySourceHealthView({
      ...completedSource,
      freshness: "stale",
      issueCounts: { blocking: 1, error: 2, warning: 1 },
      latestRun: {
        ...completedRun,
        rejectedCount: 3,
        status: "completed_with_issues",
      },
    });

    expect(view.freshness).toMatchObject({
      label: "Остарял",
      tone: "warning",
    });
    expect(view.quality).toMatchObject({
      label: "Невалидни / проблеми",
      tone: "destructive",
    });
    expect(view.quality.detail).toContain("3 отхвърлени");
    expect(view.reconciliation.label).toBe("Задържано");
  });

  test("reports reconciliation only for a recorded complete snapshot", () => {
    const applied = getInventorySourceHealthView(completedSource);
    const incomplete = getInventorySourceHealthView({
      ...completedSource,
      lastCompleteSnapshotAt: "2026-07-11T17:30:00.000Z",
    });
    const incremental = getInventorySourceHealthView({
      ...completedSource,
      syncMode: "incremental",
    });

    expect(applied.reconciliation).toMatchObject({
      label: "Приложено",
      tone: "success",
    });
    expect(applied.reconciliation.detail).toBe("2 липсващи · 1 свалени");
    expect(incomplete.reconciliation.label).toBe("Не е приложено");
    expect(incremental.reconciliation.label).toBe("Инкрементално");
  });

  test("summarizes all five dimensions without erasing a failed source", () => {
    const failedSource: InventorySourceHealthRow = {
      ...completedSource,
      connectionStatus: "degraded",
      consecutiveFailureCount: 1,
      id: "source_2",
      latestRun: {
        ...completedRun,
        status: "failed",
      },
      name: "Backup feed",
      sourceKey: "backup-feed",
    };
    const summary = getInventorySourceHealthSummary([
      completedSource,
      failedSource,
    ]);

    expect(summary.connection.label).toBe("1 влошена връзка");
    expect(summary.latestRun.label).toBe("1 неуспешен импорт");
    expect(summary.latestRun.detail).toBe(
      "1 последен успешен инвентар е запазен"
    );
    expect(summary.freshness.label).toBe("Всички са актуални");
    expect(summary.quality.label).toBe("1 източник с проблеми");
    expect(summary.reconciliation.label).toBe("1 задържана снимка");
  });
});
