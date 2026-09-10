import "server-only";

import { randomUUID } from "node:crypto";
import {
  assertKybDocumentTransition,
  type KybDocumentLifecycleStatus,
} from "@repo/marketplace-domain/organization-verification";
import {
  buildKybDocumentObjectKey,
  KYB_DOCUMENT_MIME_TYPES,
  PRIVATE_DOCUMENT_MAX_BYTES,
  PRIVATE_KYB_CASE_MAX_BYTES,
  PRIVATE_UPLOAD_TTL_SECONDS,
  type VerifiedPrivateUploadReceipt,
} from "@repo/marketplace-domain/private-artifacts";
import {
  Prisma,
  type PrismaClient,
  type VerificationActorType,
} from "./generated/client";
import { database } from "./index";
import {
  assertOrganizationActorRole,
  type DurableOrganizationActor,
} from "./organization-access";
import {
  readTrustedKybAdminAuthorization,
  type TrustedKybAdminAuthorization,
} from "./trusted-admin";

export {
  issueTrustedKybAdminAuthorization,
  type TrustedKybAdminAuthorization,
} from "./trusted-admin";

export class KybDocumentConflictError extends Error {
  readonly code = "kyb_document_conflict";
}

export const KYB_MANUAL_RETENTION_POLICY = "manual-review-required-v1";
const KYB_PURGE_LEASE_MS = 5 * 60_000;
const KYB_PURGE_MAX_ATTEMPTS = 5;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

interface KybDocumentAccessInput {
  readonly actor:
    | {
        readonly kind: "member";
        readonly organizationActor: DurableOrganizationActor;
      }
    | {
        readonly authorization: TrustedKybAdminAuthorization;
        readonly kind: "admin";
      };
  readonly dealerOrgId: string;
  readonly documentId: string;
  readonly purpose: string;
  readonly requestId: string;
}

interface KybDocumentScanResultInput {
  readonly accepted: boolean;
  readonly documentId: string;
  readonly payloadHash: string;
  readonly providerEventId: string;
}

interface ClaimedKybDocumentPurgeLease {
  readonly documentId: string;
  readonly leaseExpiresAt: Date;
  readonly leaseToken: string;
  readonly storageKey: string;
  readonly storageProvider: string;
}

export const assertKybUploadAuthorizationPolicy = (input: {
  readonly allowedMimeTypes: readonly string[];
  readonly encryptionKeyVersion: string;
  readonly expiresAt: Date;
  readonly maxBytes: number;
  readonly mimeType: string;
  readonly now: Date;
  readonly retentionPolicy?: string;
  readonly storageProvider: string;
}): void => {
  if (
    input.expiresAt <= input.now ||
    input.expiresAt.getTime() - input.now.getTime() >
      PRIVATE_UPLOAD_TTL_SECONDS * 1000 ||
    input.maxBytes <= 0 ||
    input.maxBytes > PRIVATE_DOCUMENT_MAX_BYTES ||
    !KYB_DOCUMENT_MIME_TYPES.includes(
      input.mimeType as (typeof KYB_DOCUMENT_MIME_TYPES)[number]
    ) ||
    !input.allowedMimeTypes.includes(input.mimeType) ||
    input.allowedMimeTypes.some(
      (mimeType) =>
        !KYB_DOCUMENT_MIME_TYPES.includes(
          mimeType as (typeof KYB_DOCUMENT_MIME_TYPES)[number]
        )
    ) ||
    !input.storageProvider.trim() ||
    input.storageProvider === "unconfigured" ||
    !input.encryptionKeyVersion.trim() ||
    (input.retentionPolicy !== undefined &&
      input.retentionPolicy !== KYB_MANUAL_RETENTION_POLICY)
  ) {
    throw new Error("KYB document upload policy is invalid");
  }
};

export const assertKybCaseUploadBudget = (input: {
  readonly pendingAuthorizedBytes: number;
  readonly requestedBytes: number;
  readonly retainedDocumentBytes: number;
}): void => {
  if (
    input.pendingAuthorizedBytes < 0 ||
    input.retainedDocumentBytes < 0 ||
    input.requestedBytes <= 0 ||
    input.pendingAuthorizedBytes +
      input.retainedDocumentBytes +
      input.requestedBytes >
      PRIVATE_KYB_CASE_MAX_BYTES
  ) {
    throw new KybDocumentConflictError(
      "KYB case private document budget is exhausted"
    );
  }
};

export const assertKybUploadReceiptBinding = (input: {
  readonly document: {
    readonly dealerOrgId: string;
    readonly encryptionKeyVersion: string | null;
    readonly id: string;
    readonly kybCaseId: string;
    readonly mimeType: string;
    readonly storageProvider: string;
  };
  readonly receipt: {
    readonly byteSize: number;
    readonly dealerOrgId: string;
    readonly detectedMimeType: string;
    readonly documentId: string;
    readonly encryptionKeyVersion: string;
    readonly kybCaseId: string;
    readonly objectKey: string;
    readonly providerName: string;
    readonly uploadSessionId: string;
  };
  readonly session: {
    readonly allowedMimeTypes: readonly string[];
    readonly id: string;
    readonly maxBytes: number;
    readonly opaquePrefix: string;
  };
}): void => {
  const expectedObjectKey = buildKybDocumentObjectKey({
    dealerOrgId: input.document.dealerOrgId,
    documentId: input.document.id,
    kybCaseId: input.document.kybCaseId,
    nonce: input.session.opaquePrefix,
  });
  if (
    input.receipt.documentId !== input.document.id ||
    input.receipt.dealerOrgId !== input.document.dealerOrgId ||
    input.receipt.kybCaseId !== input.document.kybCaseId ||
    input.receipt.uploadSessionId !== input.session.id ||
    input.receipt.providerName !== input.document.storageProvider ||
    input.receipt.encryptionKeyVersion !==
      input.document.encryptionKeyVersion ||
    input.receipt.detectedMimeType !== input.document.mimeType ||
    input.receipt.byteSize > input.session.maxBytes ||
    !input.session.allowedMimeTypes.includes(input.receipt.detectedMimeType) ||
    input.receipt.objectKey !== expectedObjectKey
  ) {
    throw new KybDocumentConflictError(
      "Document upload receipt does not match authorization"
    );
  }
};

const appendDocumentEvent = async (
  tx: Prisma.TransactionClient,
  input: {
    readonly actorAccountId?: string | null;
    readonly actorType: VerificationActorType;
    readonly dealerOrgId: string;
    readonly eventType:
      | "document_authorized"
      | "document_uploaded"
      | "document_accepted"
      | "document_rejected";
    readonly kybCaseId: string;
    readonly requestId?: string;
  }
) => {
  const aggregate = await tx.organizationVerificationEvent.aggregate({
    _max: { sequence: true },
    where: { dealerOrgId: input.dealerOrgId },
  });
  return tx.organizationVerificationEvent.create({
    data: {
      actorAccountId: input.actorAccountId,
      actorType: input.actorType,
      dealerOrgId: input.dealerOrgId,
      eventType: input.eventType,
      kybCaseId: input.kybCaseId,
      reasonCodes: [],
      requestId: input.requestId,
      sequence: (aggregate._max.sequence ?? 0n) + 1n,
    },
  });
};

export const authorizeKybDocumentUpload = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly allowedMimeTypes: readonly string[];
    readonly documentKind: string;
    readonly encryptionKeyVersion: string;
    readonly expiresAt: Date;
    readonly maxBytes: number;
    readonly mimeType: string;
    readonly requestId: string;
    readonly retentionPolicy: string;
    readonly storageProvider: string;
    readonly kybCaseId: string;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  const now = new Date();
  assertKybUploadAuthorizationPolicy({ ...input, now });
  return await client.$transaction(
    async (tx) => {
      const kybCase = await tx.organizationKybCase.findFirst({
        where: {
          dealerOrgId: input.actor.dealerOrgId,
          id: input.kybCaseId,
          status: { in: ["awaiting_documents", "needs_information"] },
        },
      });
      if (!kybCase) {
        throw new KybDocumentConflictError(
          "Verification case is not accepting documents"
        );
      }
      const retained = await tx.kybDocument.aggregate({
        _sum: { verifiedByteSize: true },
        where: {
          kybCaseId: kybCase.id,
          purgedAt: null,
          status: {
            in: [
              "uploaded",
              "quarantined",
              "scanning",
              "accepted",
              "rejected",
              "superseded",
              "purge_pending",
              "purge_dead_letter",
            ],
          },
        },
      });
      const liveSessions = await tx.kybDocumentUploadSession.aggregate({
        _sum: { maxBytes: true },
        where: {
          expiresAt: { gt: now },
          kybCaseId: kybCase.id,
          status: "authorized",
        },
      });
      assertKybCaseUploadBudget({
        pendingAuthorizedBytes: liveSessions._sum.maxBytes ?? 0,
        requestedBytes: input.maxBytes,
        retainedDocumentBytes: retained._sum.verifiedByteSize ?? 0,
      });
      const uploadSession = await tx.kybDocumentUploadSession.create({
        data: {
          allowedMimeTypes: [...input.allowedMimeTypes],
          dealerOrgId: input.actor.dealerOrgId,
          expiresAt: input.expiresAt,
          kybCaseId: kybCase.id,
          maxBytes: input.maxBytes,
          opaquePrefix: randomUUID(),
          requestedByAccountId: input.actor.accountId,
        },
      });
      const document = await tx.kybDocument.create({
        data: {
          dealerOrgId: input.actor.dealerOrgId,
          kind: input.documentKind,
          kybCaseId: kybCase.id,
          mimeType: input.mimeType,
          encryptionKeyVersion: input.encryptionKeyVersion,
          retentionPolicy: input.retentionPolicy,
          status: "authorized",
          storageProvider: input.storageProvider,
          uploadedByAccountId: input.actor.accountId,
          uploadSessionId: uploadSession.id,
        },
      });
      await appendDocumentEvent(tx, {
        actorAccountId: input.actor.accountId,
        actorType: "account",
        dealerOrgId: input.actor.dealerOrgId,
        eventType: "document_authorized",
        kybCaseId: kybCase.id,
        requestId: input.requestId,
      });
      return { document, uploadSession };
    },
    { isolationLevel: "Serializable" }
  );
};

export const completeKybDocumentUpload = async (
  input: {
    readonly receipt: VerifiedPrivateUploadReceipt;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  const { receipt } = input;
  return await client.$transaction(
    async (tx) => {
      const document = await tx.kybDocument.findUnique({
        include: { uploadSession: true },
        where: { id: receipt.documentId },
      });
      if (
        !document?.uploadSession ||
        document.status !== "authorized" ||
        document.uploadSession.status !== "authorized" ||
        document.uploadSession.expiresAt <= new Date()
      ) {
        throw new KybDocumentConflictError(
          "Document upload authorization is not current"
        );
      }
      assertKybUploadReceiptBinding({
        document,
        receipt,
        session: document.uploadSession,
      });
      assertKybDocumentTransition(document.status, "uploaded");
      await tx.kybDocument.update({
        data: {
          sha256: receipt.sha256,
          status: "uploaded",
          storageKey: receipt.objectKey,
          verifiedByteSize: receipt.byteSize,
        },
        where: { id: document.id },
      });
      assertKybDocumentTransition("uploaded", "quarantined");
      const quarantined = await tx.kybDocument.update({
        data: { status: "quarantined" },
        where: { id: document.id },
      });
      await tx.kybDocumentUploadSession.update({
        data: { completedAt: new Date(), status: "completed" },
        where: { id: document.uploadSession.id },
      });
      await appendDocumentEvent(tx, {
        actorAccountId: document.uploadedByAccountId,
        actorType: "account",
        dealerOrgId: document.dealerOrgId,
        eventType: "document_uploaded",
        kybCaseId: document.kybCaseId,
        requestId: input.requestId,
      });
      return quarantined;
    },
    { isolationLevel: "Serializable" }
  );
};

const getReplayedKybDocumentScanResult = async (
  tx: Prisma.TransactionClient,
  input: KybDocumentScanResultInput
) => {
  const replay = await tx.organizationVerificationEvent.findUnique({
    where: { providerEventId: input.providerEventId },
  });
  if (!replay) {
    return null;
  }

  const metadata =
    replay.metadata && typeof replay.metadata === "object"
      ? (replay.metadata as Record<string, unknown>)
      : null;
  const isMatchingReplay =
    (replay.eventType === "document_accepted" ||
      replay.eventType === "document_rejected") &&
    metadata?.accepted === input.accepted &&
    metadata.documentId === input.documentId &&
    metadata.payloadHash === input.payloadHash;
  if (!isMatchingReplay) {
    throw new KybDocumentConflictError(
      "Scanner event id was reused with different evidence"
    );
  }

  return tx.kybDocument.findUniqueOrThrow({
    where: { id: input.documentId },
  });
};

export const recordKybDocumentScanResult = async (
  input: KybDocumentScanResultInput,
  client: PrismaClient = database
) =>
  await client.$transaction(
    async (tx) => {
      if (!SHA256_PATTERN.test(input.payloadHash)) {
        throw new KybDocumentConflictError("Scan result metadata is invalid");
      }
      const expectedMetadata = {
        accepted: input.accepted,
        documentId: input.documentId,
        payloadHash: input.payloadHash,
      };
      const replayedDocument = await getReplayedKybDocumentScanResult(
        tx,
        input
      );
      if (replayedDocument) {
        return replayedDocument;
      }
      const document = await tx.kybDocument.findUnique({
        where: { id: input.documentId },
      });
      if (!document || document.status !== "quarantined") {
        throw new KybDocumentConflictError(
          "Document is not awaiting a scan result"
        );
      }
      if (document.retentionPolicy !== KYB_MANUAL_RETENTION_POLICY) {
        throw new KybDocumentConflictError(
          "Document retention policy requires authorized migration"
        );
      }
      assertKybDocumentTransition("quarantined", "scanning");
      await tx.kybDocument.update({
        data: { status: "scanning" },
        where: { id: document.id },
      });
      const nextStatus: KybDocumentLifecycleStatus = input.accepted
        ? "accepted"
        : "rejected";
      assertKybDocumentTransition("scanning", nextStatus);
      const updated = await tx.kybDocument.update({
        data: {
          // This policy intentionally requires a later authorized legal-policy
          // decision; the scanner cannot choose or shorten evidence retention.
          retainUntil: null,
          status: nextStatus,
        },
        where: { id: document.id },
      });
      const aggregate = await tx.organizationVerificationEvent.aggregate({
        _max: { sequence: true },
        where: { dealerOrgId: document.dealerOrgId },
      });
      await tx.organizationVerificationEvent.create({
        data: {
          actorType: "provider",
          dealerOrgId: document.dealerOrgId,
          eventType: input.accepted ? "document_accepted" : "document_rejected",
          kybCaseId: document.kybCaseId,
          metadata: expectedMetadata,
          providerEventId: input.providerEventId,
          reasonCodes: [],
          sequence: (aggregate._max.sequence ?? 0n) + 1n,
        },
      });
      return updated;
    },
    { isolationLevel: "Serializable" }
  );

const requireKybDocumentReaderAccount = async (
  tx: Prisma.TransactionClient,
  input: KybDocumentAccessInput
): Promise<string> => {
  if (input.actor.kind === "member") {
    return input.actor.organizationActor.accountId;
  }

  const authorization = readTrustedKybAdminAuthorization(
    input.actor.authorization
  );
  const account = await tx.marketplaceAccount.findFirst({
    select: { id: true },
    where: {
      deletedAt: null,
      id: authorization.accountId,
      status: "active",
    },
  });
  if (!account) {
    throw new KybDocumentConflictError("Document was not found");
  }

  return account.id;
};

const assertKybDocumentReaderScope = async (
  tx: Prisma.TransactionClient,
  input: KybDocumentAccessInput,
  actorAccountId: string
) => {
  if (input.actor.kind === "member") {
    if (input.actor.organizationActor.dealerOrgId !== input.dealerOrgId) {
      throw new KybDocumentConflictError("Document was not found");
    }
    const member = await tx.dealerMember.findFirst({
      where: {
        accountId: actorAccountId,
        dealerOrgId: input.dealerOrgId,
        role: { in: ["owner", "manager"] },
        status: "active",
      },
    });
    if (!member) {
      throw new KybDocumentConflictError("Document was not found");
    }
    return;
  }

  const conflict = await tx.dealerMember.findFirst({
    where: {
      accountId: actorAccountId,
      dealerOrgId: input.dealerOrgId,
      status: "active",
    },
  });
  if (conflict) {
    throw new KybDocumentConflictError("Reviewer has an organization conflict");
  }
};

export const recordKybDocumentAccess = async (
  input: KybDocumentAccessInput,
  client: PrismaClient = database
) =>
  client.$transaction(async (tx) => {
    const actorAccountId = await requireKybDocumentReaderAccount(tx, input);
    const document = await tx.kybDocument.findFirst({
      select: {
        id: true,
        status: true,
        storageKey: true,
        storageProvider: true,
      },
      where: {
        dealerOrgId: input.dealerOrgId,
        id: input.documentId,
        status: "accepted",
      },
    });
    if (!(document?.storageKey && input.purpose.trim())) {
      throw new KybDocumentConflictError("Document was not found");
    }
    await assertKybDocumentReaderScope(tx, input, actorAccountId);
    await tx.auditLog.create({
      data: {
        action: "kyb.document.read",
        actorAccountId,
        actorType: input.actor.kind === "admin" ? "admin" : "account",
        dealerOrgId: input.dealerOrgId,
        entityId: document.id,
        entityType: "KybDocument",
        metadata: { purpose: input.purpose.trim() },
        requestId: input.requestId,
      },
    });
    return {
      objectKey: document.storageKey,
      storageProvider: document.storageProvider,
    };
  });

export const claimKybDocumentsForRetentionPurge = async (
  limit = 100,
  client: PrismaClient = database,
  now = new Date()
) => {
  return await client.$transaction(async (tx) => {
    const boundedLimit = Math.min(Math.max(limit, 1), 100);
    const candidates = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT d."id"
      FROM "KybDocument" d
      INNER JOIN "OrganizationKybCase" c
        ON c."id" = d."kybCaseId" AND c."dealerOrgId" = d."dealerOrgId"
      WHERE d."legalHold" = FALSE
        AND d."purgedAt" IS NULL
        AND d."storageKey" IS NOT NULL
        AND d."purgeDeadLetteredAt" IS NULL
        AND d."purgeAttemptCount" < ${KYB_PURGE_MAX_ATTEMPTS}
        AND c."status" IN ('approved', 'rejected', 'cancelled')
        AND (
          (
            d."status" IN ('accepted', 'rejected', 'superseded')
            AND d."retainUntil" IS NOT NULL
            AND d."retainUntil" <= ${now}
          )
          OR (
            d."status" = 'purge_pending'
            AND (
              d."purgeLeaseExpiresAt" IS NULL
              OR d."purgeLeaseExpiresAt" <= ${now}
            )
          )
        )
      ORDER BY d."retainUntil" ASC NULLS LAST, d."id" ASC
      FOR UPDATE OF d SKIP LOCKED
      LIMIT ${boundedLimit}
    `);
    const leases: ClaimedKybDocumentPurgeLease[] = [];
    for (const candidate of candidates) {
      const leaseToken = randomUUID();
      const leaseExpiresAt = new Date(now.getTime() + KYB_PURGE_LEASE_MS);
      const claimed = await tx.kybDocument.update({
        data: {
          purgeAttemptCount: { increment: 1 },
          purgeLastAttemptAt: now,
          purgeLastErrorCode: null,
          purgeLeaseExpiresAt: leaseExpiresAt,
          purgeLeaseToken: leaseToken,
          purgeRequestedAt: now,
          status: "purge_pending",
        },
        where: { id: candidate.id },
      });
      if (claimed.storageKey) {
        leases.push({
          documentId: claimed.id,
          leaseExpiresAt,
          leaseToken,
          storageKey: claimed.storageKey,
          storageProvider: claimed.storageProvider,
        });
      }
    }
    return leases;
  });
};

export const validateKybDocumentPurgeLease = (
  input: { readonly documentId: string; readonly leaseToken: string },
  client: PrismaClient = database,
  now = new Date()
) =>
  client.kybDocument.findFirst({
    select: { id: true, storageKey: true, storageProvider: true },
    where: {
      id: input.documentId,
      kybCase: {
        is: { status: { in: ["approved", "rejected", "cancelled"] } },
      },
      legalHold: false,
      purgeLeaseExpiresAt: { gt: now },
      purgeLeaseToken: input.leaseToken,
      purgedAt: null,
      status: "purge_pending",
      storageKey: { not: null },
    },
  });

export const recordKybDocumentPurged = (
  input: { readonly documentId: string; readonly leaseToken: string },
  client: PrismaClient = database,
  now = new Date()
) =>
  client.kybDocument.updateMany({
    data: {
      purgeLeaseExpiresAt: null,
      purgeLeaseToken: null,
      purgeLastErrorCode: null,
      purgedAt: new Date(),
      status: "purged",
      storageKey: null,
    },
    where: {
      id: input.documentId,
      legalHold: false,
      purgeLeaseExpiresAt: { gt: now },
      purgeLeaseToken: input.leaseToken,
      status: "purge_pending",
    },
  });

export const recordKybDocumentPurgeFailure = async (
  input: {
    readonly documentId: string;
    readonly errorCode: string;
    readonly leaseToken: string;
  },
  client: PrismaClient = database,
  now = new Date()
) => {
  const current = await client.kybDocument.findFirst({
    select: { purgeAttemptCount: true },
    where: {
      id: input.documentId,
      legalHold: false,
      purgeLeaseExpiresAt: { gt: now },
      purgeLeaseToken: input.leaseToken,
      status: "purge_pending",
    },
  });
  if (!current) {
    return { count: 0 };
  }
  const deadLetter = current.purgeAttemptCount >= KYB_PURGE_MAX_ATTEMPTS;
  const retryAt = new Date(
    now.getTime() + Math.min(24 * 60, 2 ** current.purgeAttemptCount) * 60_000
  );
  return client.kybDocument.updateMany({
    data: {
      purgeDeadLetteredAt: deadLetter ? now : null,
      purgeLastErrorCode: input.errorCode.slice(0, 64),
      purgeLeaseExpiresAt: deadLetter ? null : retryAt,
      purgeLeaseToken: null,
      status: deadLetter ? "purge_dead_letter" : "purge_pending",
    },
    where: {
      id: input.documentId,
      legalHold: false,
      purgeLeaseExpiresAt: { gt: now },
      purgeLeaseToken: input.leaseToken,
      status: "purge_pending",
    },
  });
};
