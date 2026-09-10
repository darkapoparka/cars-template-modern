import "server-only";
import { createHash, randomUUID } from "node:crypto";
import {
  buildInventoryImportObjectKey as buildInventoryImportObjectKeyContract,
  buildKybDocumentObjectKey as buildKybDocumentObjectKeyContract,
  PRIVATE_DOCUMENT_MAX_BYTES,
  PRIVATE_DOWNLOAD_TTL_SECONDS,
  PRIVATE_UPLOAD_TTL_SECONDS,
  type VerifiedPrivateUploadReceipt,
} from "@repo/marketplace-domain/private-artifacts";

export {
  INVENTORY_IMPORT_MIME_TYPES,
  KYB_DOCUMENT_MIME_TYPES,
  PRIVATE_DOCUMENT_MAX_BYTES,
  PRIVATE_DOWNLOAD_TTL_SECONDS,
  PRIVATE_KYB_CASE_MAX_BYTES,
  PRIVATE_UPLOAD_TTL_SECONDS,
} from "@repo/marketplace-domain/private-artifacts";

const SHA_256_HEX_PATTERN = /^[a-f0-9]{64}$/;
const INVALID_OBJECT_KEY_PATTERN = /[\s@]/;
const defer = <Value>(operation: () => Value): Promise<Value> =>
  Promise.resolve().then(operation);

export interface PrivateUploadRequest {
  readonly byteSize: number;
  readonly contentType: string;
  readonly expiresInSeconds: number;
  readonly objectKey: string;
  readonly sha256: string;
}

export interface SignedPrivateUpload {
  readonly expiresAt: Date;
  readonly headers: Readonly<Record<string, string>>;
  readonly method: "PUT";
  readonly objectKey: string;
  readonly url: string;
}

export interface VerifiedPrivateObject {
  readonly byteSize: number;
  readonly contentType: string;
  readonly etag?: string;
  readonly objectKey: string;
  readonly sha256: string;
}

export interface SignedPrivateDownload {
  readonly expiresAt: Date;
  readonly objectKey: string;
  readonly url: string;
}

export interface PrivateObjectStorageProvider {
  deleteObject(objectKey: string): Promise<{ readonly deleted: boolean }>;
  issueDownload(input: {
    readonly expiresInSeconds: number;
    readonly objectKey: string;
  }): Promise<SignedPrivateDownload>;
  issueUpload(input: PrivateUploadRequest): Promise<SignedPrivateUpload>;
  readonly name: string;
  readBytes(objectKey: string, maxBytes: number): Promise<Uint8Array>;
  stat(objectKey: string): Promise<VerifiedPrivateObject>;
  verifyAbsent(objectKey: string): Promise<boolean>;
}

declare const trustedReceiptBrand: unique symbol;

export interface TrustedPrivateUploadReceipt
  extends VerifiedPrivateUploadReceipt {
  readonly [trustedReceiptBrand]: true;
}

const trustedReceipts = new WeakSet<object>();

export const verifyPrivateUploadCompletion = async (
  provider: PrivateObjectStorageProvider,
  input: {
    readonly allowedMimeTypes: readonly string[];
    readonly dealerOrgId: string;
    readonly documentId: string;
    readonly encryptionKeyVersion: string;
    readonly expectedObjectKey: string;
    readonly expectedProviderName: string;
    readonly expectedSha256: string;
    readonly kybCaseId: string;
    readonly maxBytes: number;
    readonly uploadSessionId: string;
  }
): Promise<TrustedPrivateUploadReceipt> => {
  if (
    provider.name !== input.expectedProviderName ||
    !input.encryptionKeyVersion.trim() ||
    !SHA_256_HEX_PATTERN.test(input.expectedSha256)
  ) {
    throw new Error("Private upload provider or encryption binding is invalid");
  }
  const object = await provider.stat(input.expectedObjectKey);
  if (
    object.objectKey !== input.expectedObjectKey ||
    object.byteSize <= 0 ||
    object.byteSize > input.maxBytes ||
    object.sha256 !== input.expectedSha256 ||
    !input.allowedMimeTypes.includes(object.contentType)
  ) {
    throw new Error("Private upload receipt does not match authorization");
  }
  const bytes = await provider.readBytes(object.objectKey, input.maxBytes);
  if (
    bytes.byteLength !== object.byteSize ||
    bytes.byteLength > input.maxBytes
  ) {
    throw new Error("Private upload content does not match verified metadata");
  }
  const actualSha256 = createHash("sha256").update(bytes).digest("hex");
  const detectedMimeType = detectPrivateDocumentMimeType(bytes);
  if (
    actualSha256 !== object.sha256 ||
    detectedMimeType !== object.contentType
  ) {
    throw new Error("Private upload content does not match verified metadata");
  }
  const receipt = Object.freeze({
    byteSize: object.byteSize,
    dealerOrgId: input.dealerOrgId,
    detectedMimeType,
    documentId: input.documentId,
    encryptionKeyVersion: input.encryptionKeyVersion,
    kybCaseId: input.kybCaseId,
    objectKey: object.objectKey,
    providerName: provider.name,
    sha256: object.sha256,
    uploadSessionId: input.uploadSessionId,
  }) as TrustedPrivateUploadReceipt;
  trustedReceipts.add(receipt);
  return receipt;
};

export const readTrustedPrivateUploadReceipt = (
  receipt: TrustedPrivateUploadReceipt
): VerifiedPrivateUploadReceipt => {
  if (!trustedReceipts.has(receipt)) {
    throw new Error("Private upload receipt is not trusted");
  }
  return receipt;
};

export class PrivateStorageProviderNotConfiguredError extends Error {
  readonly code = "private_storage_provider_not_configured";
}

const notConfigured = (): never => {
  throw new PrivateStorageProviderNotConfiguredError(
    "Private storage provider is not configured"
  );
};

export const unconfiguredPrivateStorageProvider: PrivateObjectStorageProvider =
  {
    deleteObject: () => defer(notConfigured),
    issueDownload: () => defer(notConfigured),
    issueUpload: () => defer(notConfigured),
    name: "unconfigured",
    readBytes: () => defer(notConfigured),
    stat: () => defer(notConfigured),
    verifyAbsent: () => defer(notConfigured),
  };

export const buildKybDocumentObjectKey = (input: {
  readonly dealerOrgId: string;
  readonly documentId: string;
  readonly kybCaseId: string;
  readonly nonce?: string;
}): string =>
  buildKybDocumentObjectKeyContract({
    ...input,
    nonce: input.nonce ?? randomUUID(),
  });

export const buildInventoryImportObjectKey = (input: {
  readonly dealerOrgId: string;
  readonly importSessionId: string;
  readonly inventorySourceId: string;
  readonly nonce?: string;
}): string =>
  buildInventoryImportObjectKeyContract({
    ...input,
    nonce: input.nonce ?? randomUUID(),
  });

const isSha256 = (value: string) => SHA_256_HEX_PATTERN.test(value);

export const validatePrivateUploadRequest = (
  input: PrivateUploadRequest,
  allowedMimeTypes: readonly string[]
): void => {
  if (
    !Number.isInteger(input.byteSize) ||
    input.byteSize <= 0 ||
    input.byteSize > PRIVATE_DOCUMENT_MAX_BYTES
  ) {
    throw new Error("Private upload size is outside the allowed boundary");
  }
  if (!allowedMimeTypes.includes(input.contentType)) {
    throw new Error("Private upload content type is not allowed");
  }
  if (!isSha256(input.sha256)) {
    throw new Error("Private upload requires a SHA-256 digest");
  }
  if (
    input.expiresInSeconds <= 0 ||
    input.expiresInSeconds > PRIVATE_UPLOAD_TTL_SECONDS
  ) {
    throw new Error("Private upload authorization is too long-lived");
  }
  if (
    input.objectKey.includes("..") ||
    input.objectKey.startsWith("/") ||
    INVALID_OBJECT_KEY_PATTERN.test(input.objectKey)
  ) {
    throw new Error("Private upload object key is invalid");
  }
};

export const assertVerifiedPrivateObject = (
  expected: PrivateUploadRequest,
  actual: VerifiedPrivateObject
): void => {
  if (
    actual.objectKey !== expected.objectKey ||
    actual.contentType !== expected.contentType ||
    actual.byteSize !== expected.byteSize ||
    actual.sha256 !== expected.sha256
  ) {
    throw new Error("Private object metadata does not match authorization");
  }
};

export const detectPrivateDocumentMimeType = (
  bytes: Uint8Array
): "application/pdf" | "image/jpeg" | "image/png" | "text/csv" => {
  if (
    bytes.length >= 5 &&
    new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-"
  ) {
    return "application/pdf";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value
    )
  ) {
    return "image/png";
  }
  if (!bytes.includes(0)) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      return "text/csv";
    } catch {
      // Continue to the fail-closed result.
    }
  }
  throw new Error("Private object signature is not allowed");
};

export class InMemoryPrivateObjectStorageProvider
  implements PrivateObjectStorageProvider
{
  readonly name = "in-memory-test";
  readonly #objects = new Map<
    string,
    { readonly bytes: Uint8Array; readonly metadata: VerifiedPrivateObject }
  >();

  putSyntheticObject(metadata: VerifiedPrivateObject, bytes: Uint8Array): void {
    this.#objects.set(metadata.objectKey, { bytes, metadata });
  }

  deleteObject(objectKey: string) {
    return defer(() => ({ deleted: this.#objects.delete(objectKey) }));
  }

  issueDownload(input: {
    readonly expiresInSeconds: number;
    readonly objectKey: string;
  }) {
    return defer(() => {
      if (
        input.expiresInSeconds <= 0 ||
        input.expiresInSeconds > PRIVATE_DOWNLOAD_TTL_SECONDS ||
        !this.#objects.has(input.objectKey)
      ) {
        throw new Error("Private download is not authorized");
      }
      return {
        expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
        objectKey: input.objectKey,
        url: `memory-private://${encodeURIComponent(input.objectKey)}`,
      };
    });
  }

  issueUpload(input: PrivateUploadRequest) {
    return defer(() => ({
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
      headers: {
        "content-length": String(input.byteSize),
        "content-type": input.contentType,
        "x-content-sha256": input.sha256,
      },
      method: "PUT" as const,
      objectKey: input.objectKey,
      url: `memory-private-upload://${encodeURIComponent(input.objectKey)}`,
    }));
  }

  readBytes(objectKey: string, maxBytes: number) {
    return defer(() => {
      const object = this.#objects.get(objectKey);
      if (!object || object.bytes.byteLength > maxBytes) {
        throw new Error(
          "Private object was not found or exceeds the read limit"
        );
      }
      return object.bytes;
    });
  }

  stat(objectKey: string) {
    return defer(() => {
      const object = this.#objects.get(objectKey);
      if (!object) {
        throw new Error("Private object was not found");
      }
      return object.metadata;
    });
  }

  verifyAbsent(objectKey: string) {
    return defer(() => !this.#objects.has(objectKey));
  }
}
