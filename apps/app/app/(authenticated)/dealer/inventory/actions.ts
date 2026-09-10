"use server";

import { randomUUID } from "node:crypto";
import { database } from "@repo/database";
import {
  approveInventoryImportApply,
  createInventoryImportPreview,
  InventoryImportConflictError,
} from "@repo/database/inventory-imports";
import {
  activateInventorySource,
  createInventorySource,
  disconnectInventorySource,
  InventorySourceConflictError,
  pauseInventorySource,
  resumeInventorySource,
} from "@repo/database/inventory-sources";
import {
  parseInventoryCsvMappingDefinition,
  regenerateInventoryCsvSnapshot,
} from "@repo/marketplace/inventory-csv";
import {
  consumeTrustedInventoryImportArtifact,
  verifyInventoryImportArtifact,
} from "@repo/storage/inventory-imports";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDealerOrganizationActor } from "../actor";
import { dealerPrivateObjectStorageProvider } from "../provider-adapters";

const createSourceSchema = z.object({
  kind: z.enum(["csv", "json", "https_feed", "api", "webhook", "sftp", "dms"]),
  name: z.string().trim().min(2).max(120),
  syncMode: z.enum(["full_snapshot", "incremental"]),
});

const sourceTransitionSchema = z.object({
  inventorySourceId: z.string().min(6).max(128),
  transition: z.enum(["activate", "pause", "resume", "disconnect"]),
});

const applySchema = z.object({
  expectedSessionVersion: z.coerce.number().int().positive(),
  importSessionId: z.string().min(6).max(128),
  previewDigest: z.string().regex(/^[a-f0-9]{64}$/),
});

const previewSchema = z.object({
  importSessionId: z.string().min(6).max(128),
});

const sourcesState = (state: string): never =>
  redirect(`/dealer/inventory/sources?state=${encodeURIComponent(state)}`);

const importState = (sessionId: string, state: string): never =>
  redirect(
    `/dealer/inventory/imports/${encodeURIComponent(sessionId)}?state=${encodeURIComponent(state)}`
  );

export const createInventorySourceAction = async (formData: FormData) => {
  const parsed = createSourceSchema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    syncMode: formData.get("syncMode"),
  });
  const data = parsed.success ? parsed.data : sourcesState("invalid_source");

  const actor = await requireDealerOrganizationActor(["owner", "manager"]);
  try {
    await createInventorySource({
      actor,
      kind: data.kind,
      name: data.name,
      config:
        data.kind === "csv"
          ? { contract: "automarket.inventory.csv.v1" }
          : { contract: "automarket.inventory.v1" },
      requestId: randomUUID(),
      syncMode: data.syncMode,
    });
  } catch (error) {
    sourcesState(
      error instanceof InventorySourceConflictError
        ? "source_gate_conflict"
        : "source_create_failed"
    );
  }

  revalidatePath("/dealer/inventory/sources");
  sourcesState("source_created");
};

export const transitionInventorySourceAction = async (formData: FormData) => {
  const parsed = sourceTransitionSchema.safeParse({
    inventorySourceId: formData.get("inventorySourceId"),
    transition: formData.get("transition"),
  });
  const data = parsed.success ? parsed.data : sourcesState("source_conflict");

  const actor = await requireDealerOrganizationActor(["owner", "manager"]);
  const base = {
    actor,
    inventorySourceId: data.inventorySourceId,
    requestId: randomUUID(),
  };

  try {
    if (data.transition === "activate") {
      await activateInventorySource(base);
    } else if (data.transition === "pause") {
      await pauseInventorySource({ ...base, reasonCode: "paused_by_member" });
    } else if (data.transition === "resume") {
      await resumeInventorySource(base);
    } else {
      await disconnectInventorySource({
        ...base,
        reasonCode: "disconnected_by_member",
      });
    }
  } catch (error) {
    sourcesState(
      error instanceof InventorySourceConflictError
        ? "source_conflict"
        : "source_transition_failed"
    );
  }

  revalidatePath("/dealer/inventory");
  revalidatePath("/dealer/inventory/sources");
  sourcesState("source_updated");
};

export const generateInventoryImportPreviewAction = async (
  formData: FormData
) => {
  const parsed = previewSchema.safeParse({
    importSessionId: formData.get("importSessionId"),
  });
  const data = parsed.success
    ? parsed.data
    : importState(
        String(formData.get("importSessionId") ?? "invalid"),
        "preview_conflict"
      );

  const actor = await requireDealerOrganizationActor([
    "owner",
    "manager",
    "sales",
  ]);
  const session = await database.inventoryImportSession
    .findFirst({
      include: {
        artifacts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          where: { kind: "original", scanStatus: "clean" },
        },
        mappingVersion: true,
      },
      where: {
        dealerOrgId: actor.dealerOrgId,
        expiresAt: { gt: new Date() },
        id: data.importSessionId,
        status: {
          in: ["mapping_required", "preview_queued", "previewing", "ready"],
        },
      },
    })
    .catch(() => importState(data.importSessionId, "preview_failed"));

  const boundSession =
    session ?? importState(data.importSessionId, "preview_conflict");
  const artifact =
    boundSession.artifacts[0] ??
    importState(data.importSessionId, "preview_conflict");
  const mapping =
    boundSession.mappingVersion ??
    importState(data.importSessionId, "preview_conflict");
  if (dealerPrivateObjectStorageProvider.name === "unconfigured") {
    importState(data.importSessionId, "preview_storage_unavailable");
  }

  try {
    const verified = await verifyInventoryImportArtifact(
      dealerPrivateObjectStorageProvider,
      {
        dealerOrgId: actor.dealerOrgId,
        expectedByteSize: artifact.byteSize,
        expectedObjectKey: artifact.storageKey,
        expectedProviderName: artifact.storageProvider,
        expectedSha256: artifact.sha256,
        importSessionId: boundSession.id,
        inventorySourceId: boundSession.inventorySourceId,
      }
    );
    const trustedArtifact = consumeTrustedInventoryImportArtifact(verified);
    const trustedMapping = parseInventoryCsvMappingDefinition({
      delimiter: mapping.delimiter,
      headerFingerprint: mapping.headerFingerprint,
      mappingHash: mapping.mappingHash,
      mappings: mapping.canonicalMappings,
      templateId: mapping.templateId,
    });
    const snapshot = regenerateInventoryCsvSnapshot({
      artifact: trustedArtifact.bytes,
      artifactHash: trustedArtifact.sha256,
      fixedUploadTime: artifact.verifiedAt,
      mapping: trustedMapping,
      sourceGeneratedAt: boundSession.sourceGeneratedAt,
    });
    await createInventoryImportPreview({
      actor,
      importSessionId: boundSession.id,
      mappingVersionId: mapping.id,
      requestId: randomUUID(),
      snapshot,
    });
  } catch (error) {
    importState(
      data.importSessionId,
      error instanceof InventoryImportConflictError
        ? "preview_conflict"
        : "preview_failed"
    );
  }

  revalidatePath("/dealer/inventory");
  revalidatePath("/dealer/inventory/runs");
  revalidatePath(`/dealer/inventory/imports/${data.importSessionId}`);
  importState(data.importSessionId, "preview_generated");
};

export const approveInventoryImportAction = async (formData: FormData) => {
  const parsed = applySchema.safeParse({
    expectedSessionVersion: formData.get("expectedSessionVersion"),
    importSessionId: formData.get("importSessionId"),
    previewDigest: formData.get("previewDigest"),
  });
  const data = parsed.success
    ? parsed.data
    : importState(
        String(formData.get("importSessionId") ?? "invalid"),
        "import_conflict"
      );

  const actor = await requireDealerOrganizationActor([
    "owner",
    "manager",
    "sales",
  ]);
  try {
    await approveInventoryImportApply({
      acknowledgeFullSnapshot: formData.get("acknowledgeFullSnapshot") === "on",
      acknowledgeQuarantine: formData.get("acknowledgeQuarantine") === "on",
      actor,
      expectedSessionVersion: data.expectedSessionVersion,
      importSessionId: data.importSessionId,
      previewDigest: data.previewDigest,
      requestId: randomUUID(),
    });
  } catch (error) {
    importState(
      data.importSessionId,
      error instanceof InventoryImportConflictError
        ? "import_conflict"
        : "apply_failed"
    );
  }

  revalidatePath("/dealer/inventory");
  revalidatePath("/dealer/inventory/runs");
  revalidatePath(`/dealer/inventory/imports/${data.importSessionId}`);
  importState(data.importSessionId, "apply_queued");
};
