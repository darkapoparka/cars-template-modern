import "server-only";

import {
  assertKybCaseTransition,
  assertVerificationGrantTransition,
  projectOrganizationVerification,
} from "@repo/marketplace-domain/organization-verification";
import type {
  KybProviderCheckStatus,
  OrganizationKybCaseStatus,
  OrganizationLegalEntityType,
  OrganizationVerificationEventType,
  OrganizationVerificationGrantStatus,
  Prisma,
  PrismaClient,
  VerificationActorType,
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

const openCaseStatuses: readonly OrganizationKybCaseStatus[] = [
  "draft",
  "awaiting_documents",
  "ready_for_submission",
  "submitted",
  "provider_pending",
  "needs_information",
  "manual_review",
];

export class OrganizationVerificationConflictError extends Error {
  readonly code = "organization_verification_conflict";
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const NORMALIZED_RESULT_CODE_PATTERN = /^[a-z0-9_]{2,64}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
export const KYB_APPROVAL_MAX_VALIDITY_DAYS = 365;
export const KYB_REVIEW_POLICY_VERSION = "m2-v1";
export const KYB_REVIEW_REASON_CODES = [
  "documents_accepted",
  "identity_confirmed",
  "registry_match",
  "low_risk",
  "additional_documents_required",
  "document_unreadable",
  "evidence_inconsistent",
  "identity_mismatch",
  "registry_mismatch",
  "document_invalid",
  "organization_unverifiable",
  "policy_violation",
] as const;
export type KybReviewReasonCode = (typeof KYB_REVIEW_REASON_CODES)[number];

const reviewReasonsByOutcome = {
  approved: new Set<KybReviewReasonCode>([
    "documents_accepted",
    "identity_confirmed",
    "registry_match",
    "low_risk",
  ]),
  needs_information: new Set<KybReviewReasonCode>([
    "additional_documents_required",
    "document_unreadable",
    "evidence_inconsistent",
  ]),
  rejected: new Set<KybReviewReasonCode>([
    "identity_mismatch",
    "registry_mismatch",
    "document_invalid",
    "organization_unverifiable",
    "policy_violation",
  ]),
} as const;

const getReviewEventType = (
  outcome: "needs_information" | "approved" | "rejected"
): OrganizationVerificationEventType => {
  if (outcome === "approved") {
    return "approved";
  }

  return outcome === "rejected" ? "rejected" : "information_requested";
};

export const KYB_GRANT_ADMIN_REASON_CODES = [
  "compliance_review",
  "legal_hold",
  "risk_change",
  "review_cleared",
  "authorization_revoked",
  "fraud_confirmed",
  "organization_closed",
] as const;
export type KybGrantAdminReasonCode =
  (typeof KYB_GRANT_ADMIN_REASON_CODES)[number];

const grantReasonsByStatus = {
  active: new Set<KybGrantAdminReasonCode>(["review_cleared"]),
  revoked: new Set<KybGrantAdminReasonCode>([
    "authorization_revoked",
    "fraud_confirmed",
    "organization_closed",
  ]),
  suspended: new Set<KybGrantAdminReasonCode>([
    "compliance_review",
    "legal_hold",
    "risk_change",
  ]),
} as const;

const getGrantEventType = (
  status: OrganizationVerificationGrantStatus
): OrganizationVerificationEventType => {
  if (status === "suspended") {
    return "grant_suspended";
  }
  if (status === "active") {
    return "grant_reactivated";
  }
  return status === "revoked" ? "grant_revoked" : "grant_expired";
};

const appendVerificationEvent = async (
  tx: Prisma.TransactionClient,
  input: {
    readonly actorAccountId?: string | null;
    readonly actorType: VerificationActorType;
    readonly afterKybStatus?:
      | "not_started"
      | "pending"
      | "in_review"
      | "verified"
      | "rejected"
      | "expired"
      | "suspended";
    readonly beforeKybStatus?:
      | "not_started"
      | "pending"
      | "in_review"
      | "verified"
      | "rejected"
      | "expired"
      | "suspended";
    readonly correlationId?: string | null;
    readonly dealerOrgId: string;
    readonly eventType: OrganizationVerificationEventType;
    readonly kybCaseId?: string | null;
    readonly metadata?: Prisma.InputJsonValue;
    readonly providerEventId?: string | null;
    readonly providerKey?: string | null;
    readonly reasonCodes?: readonly string[];
    readonly requestId?: string | null;
    readonly verificationGrantId?: string | null;
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
      afterKybStatus: input.afterKybStatus,
      beforeKybStatus: input.beforeKybStatus,
      correlationId: input.correlationId,
      dealerOrgId: input.dealerOrgId,
      eventType: input.eventType,
      kybCaseId: input.kybCaseId,
      ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      providerEventId: input.providerEventId,
      providerKey: input.providerKey,
      reasonCodes: [...(input.reasonCodes ?? [])],
      requestId: input.requestId,
      sequence: (aggregate._max.sequence ?? 0n) + 1n,
      verificationGrantId: input.verificationGrantId,
    },
  });
};

export const recordKybProviderCheckResult = async (
  input: {
    readonly checkId: string;
    readonly normalizedResultCode: string;
    readonly payloadHash: string;
    readonly providerEventId: string;
    readonly riskLevel: "high" | "low" | "medium" | "unknown";
    readonly status: Exclude<KybProviderCheckStatus, "expired" | "pending">;
  },
  client: PrismaClient = database
) => {
  if (
    !(
      SHA256_PATTERN.test(input.payloadHash) &&
      NORMALIZED_RESULT_CODE_PATTERN.test(input.normalizedResultCode)
    )
  ) {
    throw new OrganizationVerificationConflictError(
      "Provider result metadata is invalid"
    );
  }
  const expectedMetadata = {
    checkId: input.checkId,
    normalizedResultCode: input.normalizedResultCode,
    payloadHash: input.payloadHash,
    riskLevel: input.riskLevel,
    status: input.status,
  };
  return await client.$transaction(
    async (tx) => {
      const replay = await tx.organizationVerificationEvent.findUnique({
        where: { providerEventId: input.providerEventId },
      });
      if (replay) {
        const metadata =
          replay.metadata && typeof replay.metadata === "object"
            ? (replay.metadata as Record<string, unknown>)
            : null;
        if (
          replay.eventType === "provider_result_recorded" &&
          metadata?.checkId === input.checkId &&
          metadata.normalizedResultCode === input.normalizedResultCode &&
          metadata.payloadHash === input.payloadHash &&
          metadata.riskLevel === input.riskLevel &&
          metadata.status === input.status
        ) {
          return { duplicate: true as const, event: replay };
        }
        throw new OrganizationVerificationConflictError(
          "Provider event id was reused with different evidence"
        );
      }
      const check = await tx.kybProviderCheck.findUnique({
        where: { id: input.checkId },
      });
      if (!check || check.status !== "pending") {
        throw new OrganizationVerificationConflictError(
          "Provider check is not pending"
        );
      }
      const updated = await tx.kybProviderCheck.updateMany({
        data: {
          completedAt: new Date(),
          normalizedResultCode: input.normalizedResultCode,
          riskLevel: input.riskLevel,
          status: input.status,
        },
        where: { id: check.id, status: "pending" },
      });
      if (updated.count !== 1) {
        throw new OrganizationVerificationConflictError(
          "Provider check changed while recording evidence"
        );
      }
      const event = await appendVerificationEvent(tx, {
        actorType: "provider",
        dealerOrgId: check.dealerOrgId,
        eventType: "provider_result_recorded",
        kybCaseId: check.kybCaseId,
        metadata: expectedMetadata,
        providerEventId: input.providerEventId,
        providerKey: check.providerKey,
      });
      return { duplicate: false as const, event };
    },
    { isolationLevel: "Serializable" }
  );
};

const refreshOrganizationProjection = async (
  tx: Prisma.TransactionClient,
  dealerOrgId: string,
  projectionEventId: string,
  now: Date
) => {
  const organization = await tx.dealerOrg.findUniqueOrThrow({
    include: {
      currentKybCase: { select: { status: true } },
      currentVerificationGrant: {
        select: { status: true, validFrom: true, validUntil: true },
      },
      legalEntity: { select: { id: true } },
    },
    where: { id: dealerOrgId },
  });
  const projection = projectOrganizationVerification({
    administrativeSuspension: false,
    currentCaseStatus: organization.currentKybCase?.status,
    currentGrant: organization.currentVerificationGrant,
    deleted: Boolean(organization.deletedAt),
    legalEntityComplete: Boolean(organization.legalEntity),
    now,
  });

  return tx.dealerOrg.update({
    data: {
      ...projection,
      verificationProjectedAt: now,
      verificationProjectionEventId: projectionEventId,
      verificationProjectionVersion: { increment: 1 },
    },
    where: { id: dealerOrgId },
  });
};

interface LegalEntityInput {
  readonly actor: DurableOrganizationActor;
  readonly addressCountryCode: string;
  readonly addressLine1: string;
  readonly addressLine2?: string | null;
  readonly city: string;
  readonly entityType: OrganizationLegalEntityType;
  readonly eoriNumber?: string | null;
  readonly expectedDataVersion?: number;
  readonly incorporationDate?: Date | null;
  readonly legalName: string;
  readonly postalCode?: string | null;
  readonly region?: string | null;
  readonly registrationCountryCode: string;
  readonly registrationNumber: string;
  readonly taxId?: string | null;
  readonly tradingName?: string | null;
  readonly vatId?: string | null;
}

const normalizeCountryCode = (value: string) => {
  const normalized = value.trim().toUpperCase();
  if (!COUNTRY_CODE_PATTERN.test(normalized)) {
    throw new Error("A valid ISO-2 country code is required");
  }
  return normalized;
};

const normalizeRegistrationNumber = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]/g, "");

interface KybReviewDecisionInput {
  readonly authorization: TrustedKybAdminAuthorization;
  readonly expectedCaseVersion: number;
  readonly kybCaseId: string;
  readonly outcome: "needs_information" | "approved" | "rejected";
  readonly reasonCodes: readonly KybReviewReasonCode[];
  readonly requestId: string;
  readonly reviewerNote?: string | null;
  readonly validityDays?: 30 | 90 | 365;
}

export const saveOrganizationLegalEntity = async (
  input: LegalEntityInput,
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  const now = new Date();

  return await client.$transaction(
    async (tx) => {
      const organization = await tx.dealerOrg.findFirst({
        select: { id: true, kybStatus: true },
        where: { deletedAt: null, id: input.actor.dealerOrgId },
      });
      if (!organization) {
        throw new OrganizationVerificationConflictError(
          "Organization verification resource was not found"
        );
      }

      const existing = await tx.organizationLegalEntity.findUnique({
        where: { dealerOrgId: input.actor.dealerOrgId },
      });
      if (
        existing &&
        input.expectedDataVersion !== undefined &&
        existing.dataVersion !== input.expectedDataVersion
      ) {
        throw new OrganizationVerificationConflictError(
          "Legal entity was changed by another request"
        );
      }

      const data = {
        addressCountryCode: normalizeCountryCode(input.addressCountryCode),
        addressLine1: input.addressLine1.trim(),
        addressLine2: input.addressLine2?.trim() || null,
        city: input.city.trim(),
        entityType: input.entityType,
        eoriNumber: input.eoriNumber?.trim() || null,
        incorporationDate: input.incorporationDate,
        legalName: input.legalName.trim(),
        postalCode: input.postalCode?.trim() || null,
        region: input.region?.trim() || null,
        registrationCountryCode: normalizeCountryCode(
          input.registrationCountryCode
        ),
        registrationNumber: input.registrationNumber.trim(),
        registrationNumberNormalized: normalizeRegistrationNumber(
          input.registrationNumber
        ),
        taxId: input.taxId?.trim() || null,
        tradingName: input.tradingName?.trim() || null,
        updatedByAccountId: input.actor.accountId,
        vatId: input.vatId?.trim() || null,
      };

      const legalEntity = existing
        ? await tx.organizationLegalEntity.update({
            data: { ...data, dataVersion: { increment: 1 } },
            where: { id: existing.id },
          })
        : await tx.organizationLegalEntity.create({
            data: { ...data, dealerOrgId: input.actor.dealerOrgId },
          });
      const event = await appendVerificationEvent(tx, {
        actorAccountId: input.actor.accountId,
        actorType: "account",
        beforeKybStatus: organization.kybStatus,
        dealerOrgId: input.actor.dealerOrgId,
        eventType: "legal_entity_updated",
      });
      await refreshOrganizationProjection(
        tx,
        input.actor.dealerOrgId,
        event.id,
        now
      );
      return legalEntity;
    },
    { isolationLevel: "Serializable" }
  );
};

export const createOrganizationKybCase = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly policyVersion?: string;
    readonly requirementsVersion?: string;
    readonly supersedesCaseId?: string | null;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  const now = new Date();

  return await client.$transaction(
    async (tx) => {
      const organization = await tx.dealerOrg.findFirst({
        include: { legalEntity: true },
        where: { deletedAt: null, id: input.actor.dealerOrgId },
      });
      if (!organization?.legalEntity) {
        throw new OrganizationVerificationConflictError(
          "A complete legal entity is required before verification"
        );
      }
      const openCase = await tx.organizationKybCase.findFirst({
        select: { id: true },
        where: {
          dealerOrgId: input.actor.dealerOrgId,
          status: { in: [...openCaseStatuses] },
        },
      });
      if (openCase) {
        throw new OrganizationVerificationConflictError(
          "An open verification case already exists"
        );
      }
      const attempts = await tx.organizationKybCase.aggregate({
        _max: { attempt: true },
        where: { dealerOrgId: input.actor.dealerOrgId },
      });
      const kybCase = await tx.organizationKybCase.create({
        data: {
          attempt: (attempts._max.attempt ?? 0) + 1,
          dealerOrgId: input.actor.dealerOrgId,
          legalEntityId: organization.legalEntity.id,
          policyVersion: input.policyVersion ?? "m2-v1",
          requirementsVersion: input.requirementsVersion ?? "m2-v1",
          status: "draft",
          submittedByAccountId: input.actor.accountId,
          supersedesCaseId: input.supersedesCaseId,
        },
      });
      await tx.dealerOrg.update({
        data: { currentKybCaseId: kybCase.id },
        where: { id: input.actor.dealerOrgId },
      });
      const event = await appendVerificationEvent(tx, {
        actorAccountId: input.actor.accountId,
        actorType: "account",
        beforeKybStatus: organization.kybStatus,
        dealerOrgId: input.actor.dealerOrgId,
        eventType: "case_created",
        kybCaseId: kybCase.id,
      });
      await refreshOrganizationProjection(
        tx,
        input.actor.dealerOrgId,
        event.id,
        now
      );
      return kybCase;
    },
    { isolationLevel: "Serializable" }
  );
};

export const transitionOrganizationKybCase = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly expectedVersion: number;
    readonly kybCaseId: string;
    readonly nextStatus:
      | "awaiting_documents"
      | "cancelled"
      | "ready_for_submission"
      | "submitted";
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  if (
    ![
      "awaiting_documents",
      "cancelled",
      "ready_for_submission",
      "submitted",
    ].includes(input.nextStatus)
  ) {
    throw new OrganizationVerificationConflictError(
      "Organization member cannot record a review outcome"
    );
  }
  const now = new Date();

  return await client.$transaction(
    async (tx) => {
      const kybCase = await tx.organizationKybCase.findFirst({
        include: { dealerOrg: { select: { kybStatus: true } } },
        where: {
          dealerOrgId: input.actor.dealerOrgId,
          id: input.kybCaseId,
        },
      });
      if (!(kybCase && kybCase.version === input.expectedVersion)) {
        throw new OrganizationVerificationConflictError(
          "Verification case changed or was not found"
        );
      }
      assertKybCaseTransition(kybCase.status, input.nextStatus);
      const update = await tx.organizationKybCase.update({
        data: {
          cancelledAt: input.nextStatus === "cancelled" ? now : undefined,
          status: input.nextStatus,
          submittedAt: input.nextStatus === "submitted" ? now : undefined,
          version: { increment: 1 },
        },
        where: { id: kybCase.id },
      });
      const event = await appendVerificationEvent(tx, {
        actorAccountId: input.actor.accountId,
        actorType: "account",
        beforeKybStatus: kybCase.dealerOrg.kybStatus,
        dealerOrgId: input.actor.dealerOrgId,
        eventType: "case_transitioned",
        kybCaseId: kybCase.id,
        requestId: input.requestId,
      });
      await refreshOrganizationProjection(
        tx,
        input.actor.dealerOrgId,
        event.id,
        now
      );
      return update;
    },
    { isolationLevel: "Serializable" }
  );
};

const getReplayedKybReviewDecision = async (
  tx: Prisma.TransactionClient,
  input: KybReviewDecisionInput,
  reviewerAccountId: string,
  reasons: readonly KybReviewReasonCode[]
) => {
  const replay = await tx.kybReviewDecision.findUnique({
    include: {
      dealerOrg: true,
      verificationGrant: true,
    },
    where: { requestId: input.requestId },
  });
  if (!replay) {
    return null;
  }

  const replayConflict = await tx.dealerMember.findFirst({
    select: { id: true },
    where: {
      accountId: reviewerAccountId,
      dealerOrgId: replay.dealerOrgId,
      status: "active",
    },
  });
  const replayValidityDays = replay.verificationGrant
    ? (replay.verificationGrant.validUntil.getTime() -
        replay.verificationGrant.validFrom.getTime()) /
      DAY_MS
    : undefined;
  if (
    replay.reviewerAccountId !== reviewerAccountId ||
    replay.kybCaseId !== input.kybCaseId ||
    replay.outcome !== input.outcome ||
    replay.policyVersion !== KYB_REVIEW_POLICY_VERSION ||
    replay.reviewerNote !== (input.reviewerNote ?? null) ||
    JSON.stringify(replay.reasonCodes) !== JSON.stringify(reasons) ||
    replayValidityDays !== input.validityDays ||
    replay.dealerOrg.deletedAt !== null ||
    replay.dealerOrg.currentKybCaseId !== replay.kybCaseId ||
    replayConflict !== null
  ) {
    throw new OrganizationVerificationConflictError(
      "KYB review request id was reused with different authority"
    );
  }

  return {
    decision: replay,
    duplicate: true as const,
    organization: replay.dealerOrg,
    verificationGrantId: replay.verificationGrant?.id ?? null,
  };
};

export const recordKybReviewDecision = async (
  input: KybReviewDecisionInput,
  client: PrismaClient = database
) => {
  const now = new Date();
  const authorization = readTrustedKybAdminAuthorization(input.authorization);
  const reasons = [...new Set(input.reasonCodes)];
  const validityDays = input.validityDays;
  const approvalValidUntil = new Date(
    now.getTime() + (validityDays ?? 0) * DAY_MS
  );
  if (
    reasons.length === 0 ||
    reasons.some(
      (reason) => !reviewReasonsByOutcome[input.outcome].has(reason)
    ) ||
    (input.reviewerNote?.length ?? 0) > 2000 ||
    (input.outcome === "approved" &&
      !([30, 90, KYB_APPROVAL_MAX_VALIDITY_DAYS] as const).includes(
        validityDays as 30 | 90 | 365
      )) ||
    (input.outcome !== "approved" && validityDays !== undefined)
  ) {
    throw new Error("KYB review decision does not satisfy policy");
  }

  return await client.$transaction(
    async (tx) => {
      const reviewer = await tx.marketplaceAccount.findFirst({
        select: { id: true },
        where: {
          deletedAt: null,
          id: authorization.accountId,
          status: "active",
        },
      });
      if (!reviewer) {
        throw new OrganizationVerificationConflictError(
          "KYB admin account is no longer active"
        );
      }
      const replay = await getReplayedKybReviewDecision(
        tx,
        input,
        reviewer.id,
        reasons
      );
      if (replay) {
        return replay;
      }
      const kybCase = await tx.organizationKybCase.findUnique({
        include: {
          dealerOrg: {
            select: {
              currentKybCaseId: true,
              deletedAt: true,
              kybStatus: true,
            },
          },
        },
        where: { id: input.kybCaseId },
      });
      if (
        !(kybCase && kybCase.version === input.expectedCaseVersion) ||
        kybCase.status !== "manual_review" ||
        kybCase.dealerOrg.deletedAt !== null ||
        kybCase.dealerOrg.currentKybCaseId !== kybCase.id
      ) {
        throw new OrganizationVerificationConflictError(
          "Review case changed or is not reviewable"
        );
      }
      const conflict = await tx.dealerMember.findFirst({
        select: { id: true },
        where: {
          accountId: reviewer.id,
          dealerOrgId: kybCase.dealerOrgId,
          status: "active",
        },
      });
      if (conflict) {
        throw new OrganizationVerificationConflictError(
          "Reviewer has an organization conflict"
        );
      }
      assertKybCaseTransition(kybCase.status, input.outcome);
      const decision = await tx.kybReviewDecision.create({
        data: {
          dealerOrgId: kybCase.dealerOrgId,
          kybCaseId: kybCase.id,
          outcome: input.outcome,
          policyVersion: KYB_REVIEW_POLICY_VERSION,
          reasonCodes: reasons,
          requestId: input.requestId,
          reviewerAccountId: reviewer.id,
          reviewerNote: input.reviewerNote,
        },
      });
      await tx.organizationKybCase.update({
        data: {
          decidedAt:
            input.outcome === "approved" || input.outcome === "rejected"
              ? now
              : undefined,
          status: input.outcome,
          version: { increment: 1 },
        },
        where: { id: kybCase.id },
      });

      let grantId: string | null = null;
      if (input.outcome === "approved") {
        const grant = await tx.organizationVerificationGrant.create({
          data: {
            dealerOrgId: kybCase.dealerOrgId,
            decisionId: decision.id,
            kybCaseId: kybCase.id,
            legalEntityId: kybCase.legalEntityId,
            policyVersion: KYB_REVIEW_POLICY_VERSION,
            validFrom: now,
            validUntil: approvalValidUntil,
          },
        });
        grantId = grant.id;
        await tx.dealerOrg.update({
          data: { currentVerificationGrantId: grant.id },
          where: { id: kybCase.dealerOrgId },
        });
      }
      const eventType = getReviewEventType(input.outcome);
      const event = await appendVerificationEvent(tx, {
        actorAccountId: reviewer.id,
        actorType: "admin",
        beforeKybStatus: kybCase.dealerOrg.kybStatus,
        dealerOrgId: kybCase.dealerOrgId,
        eventType,
        kybCaseId: kybCase.id,
        reasonCodes: reasons,
        requestId: input.requestId,
        verificationGrantId: grantId,
      });
      const organization = await refreshOrganizationProjection(
        tx,
        kybCase.dealerOrgId,
        event.id,
        now
      );
      return {
        decision,
        duplicate: false as const,
        organization,
        verificationGrantId: grantId,
      };
    },
    { isolationLevel: "Serializable" }
  );
};

interface VerificationGrantTransitionInput {
  readonly actorAccountId?: string | null;
  readonly actorType: "admin" | "system";
  readonly expectedKybCaseId?: string;
  readonly expectedVersion: number;
  readonly grantId: string;
  readonly nextStatus: OrganizationVerificationGrantStatus;
  readonly reasonCode: string;
  readonly requestId: string;
}

type VerificationGrantWithOrganization =
  Prisma.OrganizationVerificationGrantGetPayload<{
    include: {
      dealerOrg: {
        select: {
          currentVerificationGrantId: true;
          deletedAt: true;
          kybStatus: true;
        };
      };
    };
  }>;

const requireVerificationGrantActor = async (
  tx: Prisma.TransactionClient,
  input: VerificationGrantTransitionInput
) => {
  if (input.actorType !== "admin") {
    return;
  }
  const account = await tx.marketplaceAccount.findFirst({
    select: { id: true },
    where: {
      deletedAt: null,
      id: input.actorAccountId ?? "not-found",
      status: "active",
    },
  });
  if (!account) {
    throw new OrganizationVerificationConflictError(
      "KYB admin account is no longer active"
    );
  }
};

const assertVerificationGrantScope = (
  input: VerificationGrantTransitionInput,
  grant: VerificationGrantWithOrganization
) => {
  if (
    input.actorType === "admin" &&
    (grant.dealerOrg.deletedAt !== null ||
      grant.dealerOrg.currentVerificationGrantId !== grant.id ||
      grant.kybCaseId !== input.expectedKybCaseId)
  ) {
    throw new OrganizationVerificationConflictError(
      "Verification grant changed or was not found"
    );
  }
};

const getReplayedVerificationGrantTransition = async (
  tx: Prisma.TransactionClient,
  input: VerificationGrantTransitionInput,
  grant: VerificationGrantWithOrganization,
  expectedEventType: OrganizationVerificationEventType
) => {
  if (input.actorType !== "admin") {
    return null;
  }
  const replay = await tx.organizationVerificationEvent.findUnique({
    where: { requestId: input.requestId },
  });
  if (!replay) {
    return null;
  }
  const replayConflict = await tx.dealerMember.findFirst({
    select: { id: true },
    where: {
      accountId: input.actorAccountId ?? "not-found",
      dealerOrgId: grant.dealerOrgId,
      status: "active",
    },
  });
  if (
    replay.actorAccountId !== input.actorAccountId ||
    replay.actorType !== "admin" ||
    replay.eventType !== expectedEventType ||
    replay.kybCaseId !== input.expectedKybCaseId ||
    replay.verificationGrantId !== grant.id ||
    replay.reasonCodes.length !== 1 ||
    replay.reasonCodes[0] !== input.reasonCode ||
    grant.version !== input.expectedVersion + 1 ||
    grant.status !== input.nextStatus ||
    grant.terminalReasonCode !== input.reasonCode ||
    grant.dealerOrg.deletedAt !== null ||
    grant.dealerOrg.currentVerificationGrantId !== grant.id ||
    grant.kybCaseId !== input.expectedKybCaseId ||
    replayConflict !== null
  ) {
    throw new OrganizationVerificationConflictError(
      "Verification grant request id was reused with different authority"
    );
  }
  return grant;
};

const assertVerificationGrantTransitionAuthority = async (
  tx: Prisma.TransactionClient,
  input: VerificationGrantTransitionInput,
  grant: VerificationGrantWithOrganization,
  now: Date
) => {
  if (grant.version !== input.expectedVersion) {
    throw new OrganizationVerificationConflictError(
      "Verification grant changed or was not found"
    );
  }
  if (input.actorType === "admin") {
    const conflict = await tx.dealerMember.findFirst({
      select: { id: true },
      where: {
        accountId: input.actorAccountId ?? "not-found",
        dealerOrgId: grant.dealerOrgId,
        status: "active",
      },
    });
    if (conflict) {
      throw new OrganizationVerificationConflictError(
        "Reviewer has an organization conflict"
      );
    }
  }
  if (
    input.actorType === "system" &&
    (input.nextStatus !== "expired" || grant.validUntil > now)
  ) {
    throw new OrganizationVerificationConflictError(
      "Verification grant is not due for system expiry"
    );
  }
  if (input.nextStatus === "active" && grant.validUntil <= now) {
    throw new OrganizationVerificationConflictError(
      "Expired verification grant cannot be reactivated"
    );
  }
  assertVerificationGrantTransition(grant.status, input.nextStatus);
};

const transitionOrganizationVerificationGrantInternal = async (
  input: VerificationGrantTransitionInput,
  client: PrismaClient = database
) => {
  const now = new Date();
  const expectedEventType = getGrantEventType(input.nextStatus);
  return await client.$transaction(
    async (tx) => {
      await requireVerificationGrantActor(tx, input);
      const grant = await tx.organizationVerificationGrant.findUnique({
        include: {
          dealerOrg: {
            select: {
              currentVerificationGrantId: true,
              deletedAt: true,
              kybStatus: true,
            },
          },
        },
        where: { id: input.grantId },
      });
      if (!grant) {
        throw new OrganizationVerificationConflictError(
          "Verification grant changed or was not found"
        );
      }
      assertVerificationGrantScope(input, grant);
      const replay = await getReplayedVerificationGrantTransition(
        tx,
        input,
        grant,
        expectedEventType
      );
      if (replay) {
        return replay;
      }
      await assertVerificationGrantTransitionAuthority(tx, input, grant, now);
      const updated = await tx.organizationVerificationGrant.update({
        data: {
          expiredAt: input.nextStatus === "expired" ? now : undefined,
          revokedAt: input.nextStatus === "revoked" ? now : undefined,
          status: input.nextStatus,
          suspendedAt: input.nextStatus === "suspended" ? now : null,
          terminalReasonCode: input.reasonCode,
          version: { increment: 1 },
        },
        where: { id: grant.id },
      });
      const event = await appendVerificationEvent(tx, {
        actorAccountId: input.actorAccountId,
        actorType: input.actorType,
        beforeKybStatus: grant.dealerOrg.kybStatus,
        dealerOrgId: grant.dealerOrgId,
        eventType: expectedEventType,
        kybCaseId: grant.kybCaseId,
        reasonCodes: [input.reasonCode],
        requestId: input.requestId,
        verificationGrantId: grant.id,
      });
      await refreshOrganizationProjection(tx, grant.dealerOrgId, event.id, now);
      return updated;
    },
    { isolationLevel: "Serializable" }
  );
};

export const transitionOrganizationVerificationGrant = async (
  input: {
    readonly authorization: TrustedKybAdminAuthorization;
    readonly expectedKybCaseId: string;
    readonly expectedVersion: number;
    readonly grantId: string;
    readonly nextStatus: "active" | "revoked" | "suspended";
    readonly reasonCode: KybGrantAdminReasonCode;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  const authorization = readTrustedKybAdminAuthorization(input.authorization);
  if (!grantReasonsByStatus[input.nextStatus].has(input.reasonCode)) {
    throw new Error("Verification grant transition reason violates policy");
  }
  return await transitionOrganizationVerificationGrantInternal(
    {
      actorAccountId: authorization.accountId,
      actorType: "admin",
      expectedKybCaseId: input.expectedKybCaseId,
      expectedVersion: input.expectedVersion,
      grantId: input.grantId,
      nextStatus: input.nextStatus,
      reasonCode: input.reasonCode,
      requestId: input.requestId,
    },
    client
  );
};

export const expireOrganizationVerificationGrant = (
  input: {
    readonly expectedVersion: number;
    readonly grantId: string;
    readonly requestId: string;
  },
  client: PrismaClient = database
) =>
  transitionOrganizationVerificationGrantInternal(
    {
      actorType: "system",
      expectedVersion: input.expectedVersion,
      grantId: input.grantId,
      nextStatus: "expired",
      reasonCode: "validity_elapsed",
      requestId: input.requestId,
    },
    client
  );

const requireActiveKybAdmin = async (
  tx: Prisma.TransactionClient,
  authorization: TrustedKybAdminAuthorization
) => {
  const trusted = readTrustedKybAdminAuthorization(authorization);
  const account = await tx.marketplaceAccount.findFirst({
    select: { id: true },
    where: {
      deletedAt: null,
      id: trusted.accountId,
      status: "active",
    },
  });
  if (!account) {
    throw new OrganizationVerificationConflictError(
      "KYB admin account is no longer active"
    );
  }
  return account;
};

export const listKybAdminReviewQueue = (
  input: {
    readonly authorization: TrustedKybAdminAuthorization;
    readonly limit?: number;
  },
  client: PrismaClient = database
) =>
  client.$transaction(
    async (tx) => {
      const account = await requireActiveKybAdmin(tx, input.authorization);
      const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
      const where = {
        dealerOrg: {
          deletedAt: null,
          members: {
            none: { accountId: account.id, status: "active" as const },
          },
        },
        status: "manual_review" as const,
      };
      const [cases, total] = await Promise.all([
        tx.organizationKybCase.findMany({
          orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
          select: {
            _count: { select: { documents: true } },
            attempt: true,
            createdAt: true,
            dealerOrg: {
              select: {
                city: true,
                countryCode: true,
                displayName: true,
                id: true,
                kybStatus: true,
                orgType: true,
              },
            },
            id: true,
            legalEntity: {
              select: {
                entityType: true,
                legalName: true,
                registrationCountryCode: true,
                tradingName: true,
              },
            },
            providerChecks: {
              orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
              select: {
                completedAt: true,
                requestedAt: true,
                riskLevel: true,
                status: true,
              },
              take: 1,
            },
            status: true,
            submittedAt: true,
            updatedAt: true,
            version: true,
          },
          take: limit,
          where,
        }),
        tx.organizationKybCase.count({ where }),
      ]);
      return { cases, total };
    },
    { isolationLevel: "Serializable" }
  );

export const getKybAdminReviewCase = (
  input: {
    readonly authorization: TrustedKybAdminAuthorization;
    readonly kybCaseId: string;
  },
  client: PrismaClient = database
) =>
  client.$transaction(
    async (tx) => {
      const account = await requireActiveKybAdmin(tx, input.authorization);
      return tx.organizationKybCase.findFirst({
        select: {
          attempt: true,
          createdAt: true,
          dealerOrg: {
            select: {
              city: true,
              countryCode: true,
              currentVerificationGrant: {
                select: {
                  id: true,
                  kybCaseId: true,
                  status: true,
                  terminalReasonCode: true,
                  validFrom: true,
                  validUntil: true,
                  version: true,
                },
              },
              displayName: true,
              id: true,
              kybStatus: true,
              orgType: true,
            },
          },
          decidedAt: true,
          documents: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              createdAt: true,
              id: true,
              kind: true,
              legalHold: true,
              mimeType: true,
              purgedAt: true,
              retainUntil: true,
              status: true,
              updatedAt: true,
              verifiedByteSize: true,
            },
          },
          events: {
            orderBy: { sequence: "desc" },
            select: {
              actorType: true,
              afterKybStatus: true,
              beforeKybStatus: true,
              eventType: true,
              id: true,
              occurredAt: true,
              reasonCodes: true,
            },
            take: 50,
          },
          id: true,
          legalEntity: {
            select: {
              addressCountryCode: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              entityType: true,
              incorporationDate: true,
              legalName: true,
              postalCode: true,
              region: true,
              registrationCountryCode: true,
              registrationNumber: true,
              tradingName: true,
            },
          },
          policyVersion: true,
          providerChecks: {
            orderBy: [{ requestedAt: "desc" }, { id: "desc" }],
            select: {
              checkType: true,
              completedAt: true,
              id: true,
              normalizedResultCode: true,
              requestedAt: true,
              riskLevel: true,
              status: true,
            },
          },
          requirementsVersion: true,
          reviewDecisions: {
            orderBy: [{ decidedAt: "desc" }, { id: "desc" }],
            select: {
              decidedAt: true,
              id: true,
              outcome: true,
              policyVersion: true,
              reasonCodes: true,
              reviewerNote: true,
            },
          },
          status: true,
          submittedAt: true,
          updatedAt: true,
          version: true,
        },
        where: {
          dealerOrg: {
            deletedAt: null,
            members: {
              none: { accountId: account.id, status: "active" },
            },
          },
          id: input.kybCaseId,
          status: {
            in: ["approved", "manual_review", "needs_information", "rejected"],
          },
          submittedAt: { not: null },
        },
      });
    },
    { isolationLevel: "Serializable" }
  );

export const getOrganizationVerificationSummary = (
  dealerOrgId: string,
  client: PrismaClient = database
) =>
  client.dealerOrg.findFirst({
    include: {
      currentKybCase: {
        include: {
          documents: {
            orderBy: { createdAt: "desc" },
            select: {
              createdAt: true,
              id: true,
              kind: true,
              mimeType: true,
              status: true,
            },
          },
          events: { orderBy: { sequence: "desc" }, take: 50 },
        },
      },
      currentVerificationGrant: true,
      legalEntity: true,
    },
    where: { deletedAt: null, id: dealerOrgId },
  });
