import { createHash } from "node:crypto";
import { describe, expect, test } from "vitest";
import type { PrivateObjectStorageProvider } from "./private-documents";
import {
  assertVerifiedPrivateObject,
  buildInventoryImportObjectKey,
  buildKybDocumentObjectKey,
  detectPrivateDocumentMimeType,
  InMemoryPrivateObjectStorageProvider,
  unconfiguredPrivateStorageProvider,
  validatePrivateUploadRequest,
  verifyPrivateUploadCompletion,
} from "./private-documents";

describe("private storage boundary", () => {
  const bytes = new TextEncoder().encode("external_id,make\ncar-1,Volvo\n");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const request = {
    byteSize: bytes.byteLength,
    contentType: "text/csv",
    expiresInSeconds: 600,
    objectKey:
      "inventory-imports/org_123/source_123/import_123/original/nonce_123",
    sha256,
  };

  test("builds opaque keys without filenames or legal identity", () => {
    expect(
      buildKybDocumentObjectKey({
        dealerOrgId: "org_123456",
        documentId: "document_123456",
        kybCaseId: "case_123456",
        nonce: "nonce_123456",
      })
    ).toBe("kyb/org_123456/case_123456/document_123456/nonce_123456");
    expect(
      buildInventoryImportObjectKey({
        dealerOrgId: "org_123456",
        importSessionId: "import_123456",
        inventorySourceId: "source_123456",
        nonce: "nonce_123456",
      })
    ).not.toContain(".csv");
  });

  test("binds upload authorization to exact metadata", () => {
    expect(() =>
      validatePrivateUploadRequest(request, ["text/csv"])
    ).not.toThrow();
    expect(() =>
      assertVerifiedPrivateObject(request, {
        byteSize: bytes.byteLength,
        contentType: "text/csv",
        objectKey: request.objectKey,
        sha256,
      })
    ).not.toThrow();
    expect(() =>
      assertVerifiedPrivateObject(request, {
        byteSize: bytes.byteLength + 1,
        contentType: "text/csv",
        objectKey: request.objectKey,
        sha256,
      })
    ).toThrow("does not match");
  });

  test("checks signatures and UTF-8 fail closed", () => {
    expect(detectPrivateDocumentMimeType(bytes)).toBe("text/csv");
    expect(() =>
      detectPrivateDocumentMimeType(new Uint8Array([0, 1, 2, 3]))
    ).toThrow("signature");
  });

  test("default provider never pretends success", async () => {
    await expect(
      unconfiguredPrivateStorageProvider.deleteObject(request.objectKey)
    ).rejects.toMatchObject({
      code: "private_storage_provider_not_configured",
    });
  });

  test("test adapter keeps signed reads short-lived", async () => {
    const provider = new InMemoryPrivateObjectStorageProvider();
    provider.putSyntheticObject(
      {
        byteSize: bytes.byteLength,
        contentType: "text/csv",
        objectKey: request.objectKey,
        sha256,
      },
      bytes
    );
    await expect(
      provider.issueDownload({
        expiresInSeconds: 61,
        objectKey: request.objectKey,
      })
    ).rejects.toThrow("not authorized");
    await expect(
      provider.issueDownload({
        expiresInSeconds: 60,
        objectKey: request.objectKey,
      })
    ).resolves.toMatchObject({ objectKey: request.objectKey });
  });

  test("issues a trusted receipt only for exact provider, size, MIME, hash, and encryption bindings", async () => {
    const provider = new InMemoryPrivateObjectStorageProvider();
    provider.putSyntheticObject(
      {
        byteSize: bytes.byteLength,
        contentType: "text/csv",
        objectKey: request.objectKey,
        sha256,
      },
      bytes
    );
    await expect(
      verifyPrivateUploadCompletion(provider, {
        allowedMimeTypes: ["text/csv"],
        dealerOrgId: "org_123456",
        documentId: "document_123456",
        encryptionKeyVersion: "kms-v1",
        expectedObjectKey: request.objectKey,
        expectedProviderName: "in-memory-test",
        expectedSha256: sha256,
        kybCaseId: "case_123456",
        maxBytes: bytes.byteLength,
        uploadSessionId: "upload_123456",
      })
    ).resolves.toMatchObject({
      byteSize: bytes.byteLength,
      detectedMimeType: "text/csv",
      providerName: "in-memory-test",
    });
    await expect(
      verifyPrivateUploadCompletion(provider, {
        allowedMimeTypes: ["text/csv"],
        dealerOrgId: "org_123456",
        documentId: "document_123456",
        encryptionKeyVersion: "kms-v1",
        expectedObjectKey: request.objectKey,
        expectedProviderName: "other-provider",
        expectedSha256: sha256,
        kybCaseId: "case_123456",
        maxBytes: bytes.byteLength,
        uploadSessionId: "upload_123456",
      })
    ).rejects.toThrow("provider or encryption");
    await expect(
      verifyPrivateUploadCompletion(provider, {
        allowedMimeTypes: ["application/pdf"],
        dealerOrgId: "org_123456",
        documentId: "document_123456",
        encryptionKeyVersion: "kms-v1",
        expectedObjectKey: request.objectKey,
        expectedProviderName: "in-memory-test",
        expectedSha256: sha256,
        kybCaseId: "case_123456",
        maxBytes: bytes.byteLength,
        uploadSessionId: "upload_123456",
      })
    ).rejects.toThrow("does not match authorization");
    await expect(
      verifyPrivateUploadCompletion(provider, {
        allowedMimeTypes: ["text/csv"],
        dealerOrgId: "org_123456",
        documentId: "document_123456",
        encryptionKeyVersion: "kms-v1",
        expectedObjectKey: request.objectKey,
        expectedProviderName: "in-memory-test",
        expectedSha256: sha256,
        kybCaseId: "case_123456",
        maxBytes: bytes.byteLength - 1,
        uploadSessionId: "upload_123456",
      })
    ).rejects.toThrow("does not match authorization");
  });

  test("rejects provider metadata that under-reports the bytes read", async () => {
    const provider: PrivateObjectStorageProvider = {
      name: "under-reporting-test",
      deleteObject() {
        return Promise.resolve({ deleted: true });
      },
      issueDownload() {
        return Promise.reject(new Error("unused"));
      },
      issueUpload() {
        return Promise.reject(new Error("unused"));
      },
      readBytes() {
        return Promise.resolve(bytes);
      },
      stat(objectKey) {
        return Promise.resolve({
          byteSize: 1,
          contentType: "text/csv",
          objectKey,
          sha256,
        });
      },
      verifyAbsent() {
        return Promise.resolve(false);
      },
    };

    await expect(
      verifyPrivateUploadCompletion(provider, {
        allowedMimeTypes: ["text/csv"],
        dealerOrgId: "org_123456",
        documentId: "document_123456",
        encryptionKeyVersion: "kms-v1",
        expectedObjectKey: request.objectKey,
        expectedProviderName: provider.name,
        expectedSha256: sha256,
        kybCaseId: "case_123456",
        maxBytes: bytes.byteLength,
        uploadSessionId: "upload_123456",
      })
    ).rejects.toThrow("content does not match verified metadata");
  });
});
