import "server-only";
import { createHash } from "node:crypto";
import {
  INVENTORY_CSV_MAX_BYTES,
  INVENTORY_CSV_MAX_CELL_BYTES,
  INVENTORY_CSV_MAX_COLUMNS,
  INVENTORY_CSV_MAX_ROW_BYTES,
  INVENTORY_CSV_MAX_ROWS,
} from "@repo/marketplace-domain/inventory-csv";
import type { VerifiedInventoryImportArtifact } from "@repo/marketplace-domain/private-artifacts";
import {
  detectPrivateDocumentMimeType,
  INVENTORY_IMPORT_MIME_TYPES,
  type PrivateObjectStorageProvider,
} from "./private-documents";

const SHA_256_HEX_PATTERN = /^[a-f0-9]{64}$/;

export const INVENTORY_IMPORT_MAX_BYTES = INVENTORY_CSV_MAX_BYTES;
export const INVENTORY_IMPORT_MAX_ROWS = INVENTORY_CSV_MAX_ROWS;
export const INVENTORY_IMPORT_MAX_COLUMNS = INVENTORY_CSV_MAX_COLUMNS;
export const INVENTORY_IMPORT_MAX_CELL_BYTES = INVENTORY_CSV_MAX_CELL_BYTES;
export const INVENTORY_IMPORT_MAX_ROW_BYTES = INVENTORY_CSV_MAX_ROW_BYTES;

declare const trustedInventoryArtifactBrand: unique symbol;

export interface TrustedInventoryImportArtifactReceipt
  extends VerifiedInventoryImportArtifact {
  readonly [trustedInventoryArtifactBrand]: true;
}

interface TrustedInventoryImportArtifactPayload
  extends TrustedInventoryImportArtifactReceipt {
  readonly bytes: Uint8Array;
}

const trustedInventoryArtifacts = new WeakSet<object>();

const inventoryImportObjectPrefix = (input: {
  readonly dealerOrgId: string;
  readonly importSessionId: string;
  readonly inventorySourceId: string;
}) =>
  [
    "inventory-imports",
    input.dealerOrgId,
    input.inventorySourceId,
    input.importSessionId,
    "original",
    "",
  ].join("/");

export const verifyInventoryImportArtifact = async (
  provider: PrivateObjectStorageProvider,
  input: {
    readonly dealerOrgId: string;
    readonly expectedByteSize: number;
    readonly expectedObjectKey: string;
    readonly expectedProviderName: string;
    readonly expectedSha256: string;
    readonly importSessionId: string;
    readonly inventorySourceId: string;
    readonly now?: Date;
  }
): Promise<TrustedInventoryImportArtifactReceipt> => {
  if (
    provider.name !== input.expectedProviderName ||
    !Number.isInteger(input.expectedByteSize) ||
    input.expectedByteSize <= 0 ||
    input.expectedByteSize > INVENTORY_IMPORT_MAX_BYTES ||
    !SHA_256_HEX_PATTERN.test(input.expectedSha256) ||
    !input.expectedObjectKey.startsWith(inventoryImportObjectPrefix(input))
  ) {
    throw new Error("Inventory artifact authorization is invalid");
  }

  const object = await provider.stat(input.expectedObjectKey);
  if (
    object.objectKey !== input.expectedObjectKey ||
    object.byteSize !== input.expectedByteSize ||
    object.byteSize > INVENTORY_IMPORT_MAX_BYTES ||
    object.sha256 !== input.expectedSha256 ||
    !INVENTORY_IMPORT_MIME_TYPES.includes(
      object.contentType as (typeof INVENTORY_IMPORT_MIME_TYPES)[number]
    )
  ) {
    throw new Error("Inventory artifact metadata does not match authorization");
  }

  const bytes = await provider.readBytes(
    object.objectKey,
    INVENTORY_IMPORT_MAX_BYTES
  );
  if (bytes.byteLength !== object.byteSize) {
    throw new Error("Inventory artifact bytes do not match verified metadata");
  }
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  const detectedMimeType = detectPrivateDocumentMimeType(bytes);
  if (actualSha256 !== object.sha256 || detectedMimeType !== "text/csv") {
    throw new Error("Inventory artifact content is not an allowed CSV object");
  }

  const receipt = Object.freeze({
    byteSize: object.byteSize,
    bytes,
    dealerOrgId: input.dealerOrgId,
    detectedMimeType,
    importSessionId: input.importSessionId,
    inventorySourceId: input.inventorySourceId,
    objectKey: object.objectKey,
    providerName: provider.name,
    sha256: object.sha256,
    verifiedAt: input.now ?? new Date(),
  }) as TrustedInventoryImportArtifactPayload;
  trustedInventoryArtifacts.add(receipt);
  return receipt;
};

export const consumeTrustedInventoryImportArtifact = (
  receipt: TrustedInventoryImportArtifactReceipt
): Omit<
  TrustedInventoryImportArtifactPayload,
  typeof trustedInventoryArtifactBrand
> => {
  if (!trustedInventoryArtifacts.delete(receipt)) {
    throw new Error(
      "Inventory artifact receipt is not trusted or was already consumed"
    );
  }
  return receipt as TrustedInventoryImportArtifactPayload;
};

export interface InventoryArtifactScanner {
  readonly name: string;
  requestScan(input: {
    readonly callbackToken: string;
    readonly idempotencyKey: string;
    readonly objectKey: string;
    readonly sha256: string;
  }): Promise<{ readonly providerReference: string }>;
}

export class InventoryArtifactScannerNotConfiguredError extends Error {
  readonly code = "inventory_artifact_scanner_not_configured";
}

export const unconfiguredInventoryArtifactScanner: InventoryArtifactScanner = {
  name: "unconfigured",
  requestScan: () =>
    Promise.reject(
      new InventoryArtifactScannerNotConfiguredError(
        "Inventory artifact scanner is not configured"
      )
    ),
};

export const purgePrivateArtifact = async (
  provider: PrivateObjectStorageProvider,
  objectKey: string
): Promise<void> => {
  try {
    await provider.deleteObject(objectKey);
  } catch (error) {
    if (await provider.verifyAbsent(objectKey).catch(() => false)) {
      return;
    }
    throw error;
  }
  if (await provider.verifyAbsent(objectKey)) {
    return;
  }
  throw new Error("Private artifact deletion was not verified");
};
