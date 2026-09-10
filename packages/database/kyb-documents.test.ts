import { describe, expect, test, vi } from "vitest";
import {
  assertKybCaseUploadBudget,
  assertKybUploadAuthorizationPolicy,
  assertKybUploadReceiptBinding,
  issueTrustedKybAdminAuthorization,
  KYB_MANUAL_RETENTION_POLICY,
  recordKybDocumentAccess,
  type TrustedKybAdminAuthorization,
} from "./kyb-documents";

describe("KYB private document authorization", () => {
  const now = new Date("2026-07-13T10:00:00.000Z");
  const policy = {
    allowedMimeTypes: ["application/pdf"],
    encryptionKeyVersion: "kms-v1",
    expiresAt: new Date("2026-07-13T10:10:00.000Z"),
    maxBytes: 10 * 1024 * 1024,
    mimeType: "application/pdf",
    now,
    retentionPolicy: KYB_MANUAL_RETENTION_POLICY,
    storageProvider: "private-s3",
  };

  test("caps upload authorization at ten minutes", () => {
    expect(() => assertKybUploadAuthorizationPolicy(policy)).not.toThrow();
    expect(() =>
      assertKybUploadAuthorizationPolicy({
        ...policy,
        expiresAt: new Date("2026-07-13T10:10:00.001Z"),
      })
    ).toThrow("policy is invalid");
  });

  test("rejects an unapproved automatic retention policy", () => {
    expect(() =>
      assertKybUploadAuthorizationPolicy({
        ...policy,
        retentionPolicy: "provider-chosen-retention",
      })
    ).toThrow("policy is invalid");
  });

  test("enforces the aggregate case budget across repeated live sessions", () => {
    expect(() =>
      assertKybCaseUploadBudget({
        pendingAuthorizedBytes: 90 * 1024 * 1024,
        requestedBytes: 10 * 1024 * 1024,
        retainedDocumentBytes: 0,
      })
    ).not.toThrow();
    expect(() =>
      assertKybCaseUploadBudget({
        pendingAuthorizedBytes: 90 * 1024 * 1024,
        requestedBytes: 10 * 1024 * 1024,
        retainedDocumentBytes: 1,
      })
    ).toThrow("budget is exhausted");
  });

  test.each([
    ["cross organization", { dealerOrgId: "org_654321" }],
    ["cross document", { documentId: "document_654321" }],
    ["oversize", { byteSize: 1025 }],
    ["MIME mismatch", { detectedMimeType: "image/png" }],
    ["provider mismatch", { providerName: "other-provider" }],
    ["encryption mismatch", { encryptionKeyVersion: "kms-v2" }],
    ["object substitution", { objectKey: "kyb/org_other/case/doc/nonce" }],
  ])("rejects %s receipt substitution", (_label, changed) => {
    expect(() =>
      assertKybUploadReceiptBinding({
        document: {
          dealerOrgId: "org_123456",
          encryptionKeyVersion: "kms-v1",
          id: "document_123456",
          kybCaseId: "case_123456",
          mimeType: "application/pdf",
          storageProvider: "private-s3",
        },
        receipt: {
          byteSize: 1024,
          dealerOrgId: "org_123456",
          detectedMimeType: "application/pdf",
          documentId: "document_123456",
          encryptionKeyVersion: "kms-v1",
          kybCaseId: "case_123456",
          objectKey: "kyb/org_123456/case_123456/document_123456/nonce_123456",
          providerName: "private-s3",
          uploadSessionId: "upload_123456",
          ...changed,
        },
        session: {
          allowedMimeTypes: ["application/pdf"],
          id: "upload_123456",
          maxBytes: 1024,
          opaquePrefix: "nonce_123456",
        },
      })
    ).toThrow("does not match authorization");
  });

  test("rejects a caller-forged admin-shaped capability before reading evidence", async () => {
    const transaction = vi.fn(async (callback) => callback({}));
    await expect(
      recordKybDocumentAccess(
        {
          actor: {
            authorization: {
              accountId: "account_123",
            } as TrustedKybAdminAuthorization,
            kind: "admin",
          },
          dealerOrgId: "org_123456",
          documentId: "document_123456",
          purpose: "review",
          requestId: "request_123456",
        },
        { $transaction: transaction } as never
      )
    ).rejects.toThrow("authority is not trusted");
  });

  test("issues explicit admin authority only for an active durable admin account", async () => {
    await expect(
      issueTrustedKybAdminAuthorization(
        {
          adminRoleVerified: false,
          clerkUserId: "user_123456",
        },
        { marketplaceAccount: { findFirst: vi.fn() } } as never
      )
    ).rejects.toThrow("admin authority is required");

    const authorization = await issueTrustedKybAdminAuthorization(
      {
        adminRoleVerified: true,
        clerkUserId: "user_123456",
      },
      {
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_123456" }),
        },
      } as never
    );
    expect(authorization).toMatchObject({ accountId: "account_123456" });
  });

  test("requires the app composition boundary to verify the admin role", async () => {
    const findFirst = vi.fn();
    await expect(
      issueTrustedKybAdminAuthorization(
        {
          adminRoleVerified: false,
          clerkUserId: "user_victim",
        },
        { marketplaceAccount: { findFirst } } as never
      )
    ).rejects.toThrow("admin authority is required");
    expect(findFirst).not.toHaveBeenCalled();
  });

  test("rechecks an issued admin capability before returning private evidence", async () => {
    const authorization = await issueTrustedKybAdminAuthorization(
      {
        adminRoleVerified: true,
        clerkUserId: "user_123456",
      },
      {
        marketplaceAccount: {
          findFirst: vi.fn().mockResolvedValue({ id: "account_123456" }),
        },
      } as never
    );
    const readDocument = vi.fn();

    await expect(
      recordKybDocumentAccess(
        {
          actor: { authorization, kind: "admin" },
          dealerOrgId: "org_123456",
          documentId: "document_123456",
          purpose: "review",
          requestId: "request_123456",
        },
        {
          $transaction: vi.fn(async (callback) =>
            callback({
              kybDocument: { findFirst: readDocument },
              marketplaceAccount: {
                findFirst: vi.fn().mockResolvedValue(null),
              },
            })
          ),
        } as never
      )
    ).rejects.toThrow("Document was not found");
    expect(readDocument).not.toHaveBeenCalled();
  });
});
