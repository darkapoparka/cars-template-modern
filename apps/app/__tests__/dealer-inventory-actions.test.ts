import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ImportConflict: class extends Error {},
  SourceConflict: class extends Error {},
  activateInventorySource: vi.fn(),
  approveInventoryImportApply: vi.fn(),
  consumeTrustedInventoryImportArtifact: vi.fn(),
  createInventoryImportPreview: vi.fn(),
  createInventorySource: vi.fn(),
  disconnectInventorySource: vi.fn(),
  findImportSession: vi.fn(),
  parseInventoryCsvMappingDefinition: vi.fn(),
  pauseInventorySource: vi.fn(),
  privateStorageProvider: { name: "private-test" },
  redirect: vi.fn(),
  regenerateInventoryCsvSnapshot: vi.fn(),
  requireDealerOrganizationActor: vi.fn(),
  resumeInventorySource: vi.fn(),
  revalidatePath: vi.fn(),
  verifyInventoryImportArtifact: vi.fn(),
}));

vi.mock("@repo/database", () => ({
  database: {
    inventoryImportSession: { findFirst: mocks.findImportSession },
  },
}));
vi.mock("@repo/database/inventory-imports", () => ({
  approveInventoryImportApply: mocks.approveInventoryImportApply,
  createInventoryImportPreview: mocks.createInventoryImportPreview,
  InventoryImportConflictError: mocks.ImportConflict,
}));

vi.mock("@repo/database/inventory-sources", () => ({
  activateInventorySource: mocks.activateInventorySource,
  createInventorySource: mocks.createInventorySource,
  disconnectInventorySource: mocks.disconnectInventorySource,
  InventorySourceConflictError: mocks.SourceConflict,
  pauseInventorySource: mocks.pauseInventorySource,
  resumeInventorySource: mocks.resumeInventorySource,
}));
vi.mock("@repo/marketplace/inventory-csv", () => ({
  parseInventoryCsvMappingDefinition: mocks.parseInventoryCsvMappingDefinition,
  regenerateInventoryCsvSnapshot: mocks.regenerateInventoryCsvSnapshot,
}));
vi.mock("@repo/storage/inventory-imports", () => ({
  consumeTrustedInventoryImportArtifact:
    mocks.consumeTrustedInventoryImportArtifact,
  verifyInventoryImportArtifact: mocks.verifyInventoryImportArtifact,
}));

vi.mock("../app/(authenticated)/dealer/actor", () => ({
  requireDealerOrganizationActor: mocks.requireDealerOrganizationActor,
}));
vi.mock("../app/(authenticated)/dealer/provider-adapters", () => ({
  dealerPrivateObjectStorageProvider: mocks.privateStorageProvider,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import {
  approveInventoryImportAction,
  createInventorySourceAction,
  generateInventoryImportPreviewAction,
  transitionInventorySourceAction,
} from "../app/(authenticated)/dealer/inventory/actions";

const actor = {
  accountId: "account_1",
  dealerOrgId: "dealer_1",
  role: "manager",
} as const;

describe("dealer inventory actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.privateStorageProvider.name = "private-test";
    mocks.requireDealerOrganizationActor.mockResolvedValue(actor);
    mocks.findImportSession.mockResolvedValue({
      artifacts: [
        {
          byteSize: 128,
          id: "artifact_123",
          sha256: "a".repeat(64),
          storageKey:
            "inventory-imports/dealer_1/source_123/session_123/original/file.csv",
          storageProvider: "private-test",
          verifiedAt: new Date("2026-07-13T10:00:00.000Z"),
        },
      ],
      id: "session_123",
      inventorySourceId: "source_123",
      mappingVersion: {
        canonicalMappings: [{ canonicalField: "external_id" }],
        delimiter: ",",
        headerFingerprint: "b".repeat(64),
        id: "mapping_123",
        mappingHash: "c".repeat(64),
        templateId: "automarket.inventory.csv.v1",
      },
      sourceGeneratedAt: new Date("2026-07-13T10:05:00.000Z"),
    });
    mocks.verifyInventoryImportArtifact.mockResolvedValue({ trusted: true });
    mocks.consumeTrustedInventoryImportArtifact.mockReturnValue({
      bytes: new Uint8Array([1, 2, 3]),
      sha256: "a".repeat(64),
    });
    mocks.parseInventoryCsvMappingDefinition.mockReturnValue({
      mappingHash: "c".repeat(64),
    });
    mocks.regenerateInventoryCsvSnapshot.mockReturnValue({
      trusted: "snapshot",
    });
    mocks.createInventoryImportPreview.mockResolvedValue({ id: "preview_123" });
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT:${url}`);
    });
  });

  test("creates a non-secret pending CSV source through the durable actor boundary", async () => {
    const form = new FormData();
    form.set("kind", "csv");
    form.set("name", "Primary CSV");
    form.set("syncMode", "full_snapshot");
    await expect(createInventorySourceAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mocks.requireDealerOrganizationActor).toHaveBeenCalledWith([
      "owner",
      "manager",
    ]);
    expect(mocks.createInventorySource).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        config: { contract: "automarket.inventory.csv.v1" },
        kind: "csv",
        name: "Primary CSV",
        syncMode: "full_snapshot",
      })
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/dealer/inventory/sources?state=source_created"
    );
  });

  test("uses source-owned transition helpers instead of mutating status in the app", async () => {
    const form = new FormData();
    form.set("inventorySourceId", "source_123");
    form.set("transition", "pause");
    await expect(transitionInventorySourceAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(mocks.pauseInventorySource).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        inventorySourceId: "source_123",
        reasonCode: "paused_by_member",
      })
    );
  });

  test("derives preview truth only from the authorized durable session and trusted artifact", async () => {
    const form = new FormData();
    form.set("importSessionId", "session_123");
    form.set("counts", JSON.stringify({ projectedPublication: 999_999 }));
    form.set("issues", "forged");
    form.set("artifactHash", "d".repeat(64));
    form.set("expiresAt", "2099-01-01T00:00:00.000Z");
    form.set("rawRows", "private-forged-row");

    await expect(generateInventoryImportPreviewAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mocks.requireDealerOrganizationActor).toHaveBeenCalledWith([
      "owner",
      "manager",
      "sales",
    ]);
    expect(mocks.findImportSession).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dealerOrgId: actor.dealerOrgId,
          id: "session_123",
          status: {
            in: ["mapping_required", "preview_queued", "previewing", "ready"],
          },
        }),
      })
    );
    expect(mocks.verifyInventoryImportArtifact).toHaveBeenCalledWith(
      mocks.privateStorageProvider,
      expect.objectContaining({
        dealerOrgId: actor.dealerOrgId,
        expectedByteSize: 128,
        expectedSha256: "a".repeat(64),
        importSessionId: "session_123",
        inventorySourceId: "source_123",
      })
    );
    expect(mocks.createInventoryImportPreview).toHaveBeenCalledWith({
      actor,
      importSessionId: "session_123",
      mappingVersionId: "mapping_123",
      requestId: expect.any(String),
      snapshot: { trusted: "snapshot" },
    });
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/dealer/inventory/imports/session_123?state=preview_generated"
    );
  });

  test("does not read private bytes when the session is outside the durable organization boundary", async () => {
    mocks.findImportSession.mockResolvedValueOnce(null);
    const form = new FormData();
    form.set("importSessionId", "session_other");

    await expect(generateInventoryImportPreviewAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mocks.findImportSession).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dealerOrgId: actor.dealerOrgId,
          id: "session_other",
        }),
      })
    );
    expect(mocks.verifyInventoryImportArtifact).not.toHaveBeenCalled();
    expect(mocks.createInventoryImportPreview).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/dealer/inventory/imports/session_other?state=preview_conflict"
    );
  });

  test("fails closed when private storage is unconfigured", async () => {
    mocks.privateStorageProvider.name = "unconfigured";
    const form = new FormData();
    form.set("importSessionId", "session_123");

    await expect(generateInventoryImportPreviewAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mocks.verifyInventoryImportArtifact).not.toHaveBeenCalled();
    expect(mocks.createInventoryImportPreview).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/dealer/inventory/imports/session_123?state=preview_storage_unavailable"
    );
  });

  test("passes explicit snapshot and quarantine acknowledgements to approval", async () => {
    const form = new FormData();
    form.set("expectedSessionVersion", "4");
    form.set("importSessionId", "session_123");
    form.set("previewDigest", "a".repeat(64));
    form.set("acknowledgeFullSnapshot", "on");
    form.set("acknowledgeQuarantine", "on");
    await expect(approveInventoryImportAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mocks.requireDealerOrganizationActor).toHaveBeenCalledWith([
      "owner",
      "manager",
      "sales",
    ]);
    expect(mocks.approveInventoryImportApply).toHaveBeenCalledWith(
      expect.objectContaining({
        acknowledgeFullSnapshot: true,
        acknowledgeQuarantine: true,
        actor,
        expectedSessionVersion: 4,
        importSessionId: "session_123",
        previewDigest: "a".repeat(64),
      })
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/dealer/inventory/imports/session_123?state=apply_queued"
    );
  });

  test("surfaces a durable approval conflict instead of claiming success", async () => {
    mocks.approveInventoryImportApply.mockRejectedValueOnce(
      new mocks.ImportConflict("changed")
    );
    const form = new FormData();
    form.set("expectedSessionVersion", "4");
    form.set("importSessionId", "session_123");
    form.set("previewDigest", "b".repeat(64));

    await expect(approveInventoryImportAction(form)).rejects.toThrow(
      "NEXT_REDIRECT"
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/dealer/inventory/imports/session_123?state=import_conflict"
    );
    expect(mocks.redirect).not.toHaveBeenCalledWith(
      "/dealer/inventory/imports/session_123?state=apply_queued"
    );
  });
});
