import "server-only";

import {
  type OrganizationProfileClaimSubmissionInput,
  organizationProfileClaimantTypes,
  organizationProfileClaimSubmissionSchema,
} from "@repo/marketplace-domain";
import type { Prisma, PrismaClient } from "./generated/client";
import { database } from "./index";
import type { DurableOrganizationActor } from "./organization-access";
import { assertOrganizationActorRole } from "./organization-access";
import {
  readTrustedDirectoryAdminAuthorization,
  type TrustedDirectoryAdminAuthorization,
} from "./trusted-directory-admin";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

const claimantRoles = ["owner", "manager"] as const;

export class OrganizationProfileClaimConflictError extends Error {
  readonly code = "organization_profile_claim_conflict";
}

export class OrganizationProfileClaimAuthorizationError extends Error {
  readonly code = "organization_profile_claim_authorization_denied";
}

export class OrganizationProfileClaimInputError extends Error {
  readonly code = "organization_profile_claim_input_invalid";
}

export type SubmitOrganizationProfileClaimInput =
  Readonly<OrganizationProfileClaimSubmissionInput> & {
    readonly actor: DurableOrganizationActor;
  };

const assertCurrentClaimantActor = async (
  actor: DurableOrganizationActor,
  client: DatabaseClient
) => {
  try {
    assertOrganizationActorRole(actor, claimantRoles);
  } catch {
    throw new OrganizationProfileClaimAuthorizationError(
      "Only an active organization owner or manager may submit a claim"
    );
  }

  const membership = await client.dealerMember.findFirst({
    select: { id: true },
    where: {
      account: { deletedAt: null, status: "active" },
      accountId: actor.accountId,
      clerkDeletedAt: null,
      dealerOrg: {
        deletedAt: null,
        orgType: { in: [...organizationProfileClaimantTypes] },
      },
      dealerOrgId: actor.dealerOrgId,
      disabledAt: null,
      role: { in: [...claimantRoles] },
      status: "active",
    },
  });

  if (!membership) {
    throw new OrganizationProfileClaimAuthorizationError(
      "Organization membership is no longer authorized"
    );
  }
};

export const requireClaimantOrganizationActor = async (
  input: { readonly clerkUserId: string; readonly dealerOrgId: string },
  client: DatabaseClient = database
): Promise<DurableOrganizationActor> => {
  const membership = await client.dealerMember.findFirst({
    select: {
      accountId: true,
      dealerOrgId: true,
      role: true,
    },
    where: {
      account: {
        clerkUserId: input.clerkUserId,
        deletedAt: null,
        status: "active",
      },
      clerkDeletedAt: null,
      dealerOrg: {
        deletedAt: null,
        orgType: { in: [...organizationProfileClaimantTypes] },
      },
      dealerOrgId: input.dealerOrgId,
      disabledAt: null,
      role: { in: [...claimantRoles] },
      status: "active",
    },
  });

  if (!membership) {
    throw new OrganizationProfileClaimAuthorizationError(
      "The selected organization is not manageable by this account"
    );
  }

  return membership;
};

export const listClaimantOrganizations = async (
  clerkUserId: string,
  client: DatabaseClient = database
) => {
  const memberships = await client.dealerMember.findMany({
    orderBy: [{ dealerOrg: { displayName: "asc" } }, { dealerOrgId: "asc" }],
    select: {
      dealerOrg: {
        select: {
          clerkOrgId: true,
          displayName: true,
          id: true,
          orgType: true,
        },
      },
      role: true,
    },
    where: {
      account: {
        clerkUserId,
        deletedAt: null,
        status: "active",
      },
      clerkDeletedAt: null,
      dealerOrg: {
        clerkDeletedAt: null,
        deletedAt: null,
        orgType: { in: [...organizationProfileClaimantTypes] },
      },
      disabledAt: null,
      role: { in: [...claimantRoles] },
      status: "active",
    },
    take: 100,
  });

  return memberships.map(({ dealerOrg, role }) => ({ ...dealerOrg, role }));
};

export const getOrganizationProfileClaimContext = async (
  input: { readonly clerkUserId: string; readonly directorySlug: string },
  client: DatabaseClient = database
) => {
  const entry = await client.organizationDirectoryEntry.findFirst({
    select: {
      claimStatus: true,
      displayName: true,
      id: true,
      orgType: true,
      slug: true,
    },
    where: {
      orgType: { in: ["dealer", "importer"] },
      slug: input.directorySlug,
      status: "published",
    },
  });
  if (!entry) {
    return null;
  }

  const account = await client.marketplaceAccount.findFirst({
    select: { id: true },
    where: {
      clerkUserId: input.clerkUserId,
      deletedAt: null,
      status: "active",
    },
  });
  const claim = account
    ? await client.organizationDirectoryClaimRequest.findFirst({
        orderBy: { submittedAt: "desc" },
        select: {
          claimantDealerOrg: { select: { displayName: true } },
          evidenceKind: true,
          id: true,
          reviewReasonCode: true,
          status: true,
          submittedAt: true,
          updatedAt: true,
        },
        where: {
          applicantAccountId: account.id,
          directoryEntryId: entry.id,
        },
      })
    : null;

  return { claim, entry };
};

export const submitOrganizationProfileClaim = (
  input: SubmitOrganizationProfileClaimInput,
  client: PrismaClient = database
) => {
  const parsedSubmission =
    organizationProfileClaimSubmissionSchema.safeParse(input);
  if (!parsedSubmission.success) {
    return Promise.reject(
      new OrganizationProfileClaimInputError(
        "Organization profile claim input is invalid"
      )
    );
  }
  const submission = parsedSubmission.data;

  return client.$transaction(async (tx) => {
    await assertCurrentClaimantActor(input.actor, tx);

    const entry = await tx.organizationDirectoryEntry.findFirst({
      select: { claimStatus: true, dealerOrgId: true, id: true },
      where: {
        orgType: { in: ["dealer", "importer"] },
        slug: submission.directorySlug,
        status: "published",
      },
    });
    if (!entry) {
      throw new OrganizationProfileClaimConflictError(
        "The directory profile is not available to claim"
      );
    }

    const existing = await tx.organizationDirectoryClaimRequest.findUnique({
      where: {
        applicantAccountId_requestKey: {
          applicantAccountId: input.actor.accountId,
          requestKey: submission.requestKey,
        },
      },
    });
    if (existing) {
      if (
        existing.claimantDealerOrgId !== input.actor.dealerOrgId ||
        existing.directoryEntryId !== entry.id ||
        !["pending", "in_review", "approved"].includes(existing.status)
      ) {
        throw new OrganizationProfileClaimConflictError(
          "The idempotency key belongs to another claim state"
        );
      }
      return existing;
    }

    if (entry.claimStatus !== "unclaimed" || entry.dealerOrgId) {
      throw new OrganizationProfileClaimConflictError(
        "The directory profile is not available to claim"
      );
    }

    const claim = await tx.organizationDirectoryClaimRequest.create({
      data: {
        applicantAccountId: input.actor.accountId,
        authorityRole: submission.authorityRole,
        businessEmail: submission.businessEmail?.toLowerCase(),
        claimantDealerOrgId: input.actor.dealerOrgId,
        directoryEntryId: entry.id,
        evidenceKind: submission.evidenceKind,
        evidenceSummary: submission.evidenceSummary,
        evidenceUrl: submission.evidenceUrl,
        requestKey: submission.requestKey,
      },
    });

    const projected = await tx.organizationDirectoryEntry.updateMany({
      data: { claimStatus: "pending" },
      where: {
        claimStatus: "unclaimed",
        dealerOrgId: null,
        id: entry.id,
      },
    });
    if (projected.count !== 1) {
      throw new OrganizationProfileClaimConflictError(
        "The directory profile claim state changed"
      );
    }

    await tx.auditLog.create({
      data: {
        action: "organization_directory.claim_submitted",
        actorAccountId: input.actor.accountId,
        actorType: "account",
        after: { status: "pending" },
        dealerOrgId: input.actor.dealerOrgId,
        entityId: claim.id,
        entityType: "OrganizationDirectoryClaimRequest",
        metadata: {
          directoryEntryId: entry.id,
          evidenceKind: submission.evidenceKind,
        },
        requestId: `directory-claim:${input.actor.accountId}:${submission.requestKey}`,
      },
    });

    return claim;
  });
};

export const listOrganizationProfileClaimReviewQueue = (
  input: {
    readonly authorization: TrustedDirectoryAdminAuthorization;
    readonly limit?: number;
  },
  client: DatabaseClient = database
) => {
  readTrustedDirectoryAdminAuthorization(input.authorization);
  return client.organizationDirectoryClaimRequest.findMany({
    include: {
      applicantAccount: { select: { clerkUserId: true } },
      claimantDealerOrg: {
        select: { displayName: true, id: true, verificationStatus: true },
      },
      directoryEntry: {
        select: { displayName: true, orgType: true, slug: true },
      },
    },
    orderBy: { submittedAt: "asc" },
    take: Math.min(Math.max(input.limit ?? 100, 1), 200),
    where: { status: { in: ["pending", "in_review"] } },
  });
};

export const getOrganizationProfileClaimForReview = (
  input: {
    readonly authorization: TrustedDirectoryAdminAuthorization;
    readonly claimId: string;
  },
  client: DatabaseClient = database
) => {
  readTrustedDirectoryAdminAuthorization(input.authorization);
  return client.organizationDirectoryClaimRequest.findUnique({
    include: {
      applicantAccount: { select: { clerkUserId: true } },
      claimantDealerOrg: {
        select: {
          clerkOrgId: true,
          displayName: true,
          id: true,
          kybStatus: true,
          verificationStatus: true,
        },
      },
      directoryEntry: {
        select: {
          claimStatus: true,
          displayName: true,
          id: true,
          orgType: true,
          slug: true,
        },
      },
    },
    where: { id: input.claimId },
  });
};

type ReviewAction = "start_review" | "approve" | "reject";
type ReviewClaimRow = Prisma.OrganizationDirectoryClaimRequestGetPayload<{
  include: { claimantDealerOrg: { select: { deletedAt: true } } };
}>;

const reviewStatusByAction = {
  approve: "approved",
  reject: "rejected",
  start_review: "in_review",
} as const;

const startClaimReview = async (
  tx: Prisma.TransactionClient,
  claim: ReviewClaimRow
) => {
  if (claim.status !== "pending") {
    throw new OrganizationProfileClaimConflictError(
      "The claim is already under review"
    );
  }
  const started = await tx.organizationDirectoryClaimRequest.updateMany({
    data: { status: "in_review", version: { increment: 1 } },
    where: { id: claim.id, status: "pending", version: claim.version },
  });
  if (started.count !== 1) {
    throw new OrganizationProfileClaimConflictError(
      "The claim review state changed"
    );
  }
};

const decideClaim = async (
  tx: Prisma.TransactionClient,
  claim: ReviewClaimRow,
  input: {
    readonly action: "approve" | "reject";
    readonly adminAccountId: string;
    readonly reviewNote?: string;
    readonly reviewReasonCode?: string;
  }
) => {
  const reviewReasonCode = input.reviewReasonCode?.trim();
  if (!reviewReasonCode) {
    throw new OrganizationProfileClaimConflictError(
      "A review reason is required"
    );
  }
  if (input.action === "approve" && claim.claimantDealerOrg.deletedAt) {
    throw new OrganizationProfileClaimConflictError(
      "The claimant organization is no longer active"
    );
  }
  if (input.action === "approve") {
    const membership = await tx.dealerMember.findFirst({
      select: { id: true },
      where: {
        account: { deletedAt: null, status: "active" },
        accountId: claim.applicantAccountId,
        clerkDeletedAt: null,
        dealerOrg: {
          deletedAt: null,
          orgType: { in: [...organizationProfileClaimantTypes] },
        },
        dealerOrgId: claim.claimantDealerOrgId,
        disabledAt: null,
        role: { in: [...claimantRoles] },
        status: "active",
      },
    });
    if (!membership) {
      throw new OrganizationProfileClaimConflictError(
        "The claimant no longer manages the organization"
      );
    }
  }

  const decided = await tx.organizationDirectoryClaimRequest.updateMany({
    data: {
      reviewerAccountId: input.adminAccountId,
      reviewedAt: new Date(),
      reviewNote: input.reviewNote?.trim(),
      reviewReasonCode,
      status: reviewStatusByAction[input.action],
      version: { increment: 1 },
    },
    where: { id: claim.id, status: claim.status, version: claim.version },
  });
  if (decided.count !== 1) {
    throw new OrganizationProfileClaimConflictError(
      "The claim decision lost a concurrency race"
    );
  }

  const projected = await tx.organizationDirectoryEntry.updateMany({
    data:
      input.action === "approve"
        ? { claimStatus: "claimed", dealerOrgId: claim.claimantDealerOrgId }
        : { claimStatus: "unclaimed" },
    where: {
      claimStatus: "pending",
      dealerOrgId: null,
      id: claim.directoryEntryId,
    },
  });
  if (projected.count !== 1) {
    throw new OrganizationProfileClaimConflictError(
      "The public claim projection changed before review completed"
    );
  }
};

export const reviewOrganizationProfileClaim = (
  input: {
    readonly action: ReviewAction;
    readonly authorization: TrustedDirectoryAdminAuthorization;
    readonly claimId: string;
    readonly expectedVersion: number;
    readonly reviewNote?: string;
    readonly reviewReasonCode?: string;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  const admin = readTrustedDirectoryAdminAuthorization(input.authorization);

  return client.$transaction(async (tx) => {
    const claim = await tx.organizationDirectoryClaimRequest.findFirst({
      include: {
        claimantDealerOrg: { select: { deletedAt: true } },
      },
      where: { id: input.claimId, version: input.expectedVersion },
    });
    if (!(claim && ["pending", "in_review"].includes(claim.status))) {
      throw new OrganizationProfileClaimConflictError(
        "The claim is stale or no longer reviewable"
      );
    }

    await (input.action === "start_review"
      ? startClaimReview(tx, claim)
      : decideClaim(tx, claim, {
          action: input.action,
          adminAccountId: admin.accountId,
          reviewNote: input.reviewNote,
          reviewReasonCode: input.reviewReasonCode,
        }));

    await tx.auditLog.create({
      data: {
        action: `organization_directory.claim_${input.action}`,
        actorAccountId: admin.accountId,
        actorType: "admin",
        after: { status: reviewStatusByAction[input.action] },
        dealerOrgId: claim.claimantDealerOrgId,
        entityId: claim.id,
        entityType: "OrganizationDirectoryClaimRequest",
        metadata: {
          directoryEntryId: claim.directoryEntryId,
          reviewReasonCode: input.reviewReasonCode,
        },
        requestId: input.requestId,
      },
    });

    return tx.organizationDirectoryClaimRequest.findUniqueOrThrow({
      where: { id: claim.id },
    });
  });
};
