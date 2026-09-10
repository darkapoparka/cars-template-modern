export const PRIVATE_UPLOAD_TTL_SECONDS = 10 * 60;
export const PRIVATE_DOWNLOAD_TTL_SECONDS = 60;
export const PRIVATE_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const PRIVATE_KYB_CASE_MAX_BYTES = 100 * 1024 * 1024;

export const KYB_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const INVENTORY_IMPORT_MIME_TYPES = ["text/csv", "text/plain"] as const;

const OPAQUE_SEGMENT_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;

const opaqueSegment = (value: string, label: string): string => {
  if (!OPAQUE_SEGMENT_PATTERN.test(value)) {
    throw new Error(`${label} must be an opaque identifier`);
  }
  return value;
};

export const buildKybDocumentObjectKey = (input: {
  readonly dealerOrgId: string;
  readonly documentId: string;
  readonly kybCaseId: string;
  readonly nonce: string;
}): string =>
  [
    "kyb",
    opaqueSegment(input.dealerOrgId, "dealerOrgId"),
    opaqueSegment(input.kybCaseId, "kybCaseId"),
    opaqueSegment(input.documentId, "documentId"),
    opaqueSegment(input.nonce, "nonce"),
  ].join("/");

export const buildInventoryImportObjectKey = (input: {
  readonly dealerOrgId: string;
  readonly importSessionId: string;
  readonly inventorySourceId: string;
  readonly nonce: string;
}): string =>
  [
    "inventory-imports",
    opaqueSegment(input.dealerOrgId, "dealerOrgId"),
    opaqueSegment(input.inventorySourceId, "inventorySourceId"),
    opaqueSegment(input.importSessionId, "importSessionId"),
    "original",
    opaqueSegment(input.nonce, "nonce"),
  ].join("/");

export interface VerifiedPrivateUploadReceipt {
  readonly byteSize: number;
  readonly dealerOrgId: string;
  readonly detectedMimeType: string;
  readonly documentId: string;
  readonly encryptionKeyVersion: string;
  readonly kybCaseId: string;
  readonly objectKey: string;
  readonly providerName: string;
  readonly sha256: string;
  readonly uploadSessionId: string;
}

export interface VerifiedInventoryImportArtifact {
  readonly byteSize: number;
  readonly dealerOrgId: string;
  readonly detectedMimeType: "text/csv";
  readonly importSessionId: string;
  readonly inventorySourceId: string;
  readonly objectKey: string;
  readonly providerName: string;
  readonly sha256: string;
  readonly verifiedAt: Date;
}
