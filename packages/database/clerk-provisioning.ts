import "server-only";

import type {
  ClerkOrgProvisioningStatus,
  DealerOrgType,
  DealerRole,
  PrismaClient,
} from "./generated/client";
import { database } from "./index";

export class ClerkProvisioningConflictError extends Error {
  readonly code = "clerk_provisioning_conflict";
}

const ISO_COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

const normalizeCountryCode = (value: string) => {
  const normalized = value.trim().toUpperCase();
  if (!ISO_COUNTRY_CODE_PATTERN.test(normalized)) {
    throw new Error("A valid ISO-2 country code is required");
  }
  return normalized;
};

export const requestClerkOrganizationProvisioning = async (
  input: {
    readonly applicantAccountId: string;
    readonly countryCode: string;
    readonly displayName: string;
    readonly orgType: DealerOrgType;
    readonly requestKey: string;
  },
  client: PrismaClient = database
) =>
  client.clerkOrgProvisioning.upsert({
    create: {
      applicantAccountId: input.applicantAccountId,
      requestKey: input.requestKey,
      requestedCountryCode: normalizeCountryCode(input.countryCode),
      requestedDisplayName: input.displayName.trim(),
      requestedOrgType: input.orgType,
    },
    update: {},
    where: {
      applicantAccountId_requestKey: {
        applicantAccountId: input.applicantAccountId,
        requestKey: input.requestKey,
      },
    },
  });

export const markClerkOrganizationCreated = async (
  input: {
    readonly clerkOrgId: string;
    readonly provisioningId: string;
  },
  client: PrismaClient = database
) => {
  const result = await client.clerkOrgProvisioning.updateMany({
    data: {
      attemptCount: { increment: 1 },
      clerkCreatedAt: new Date(),
      clerkOrgId: input.clerkOrgId,
      errorCode: null,
      status: "clerk_created",
    },
    where: {
      id: input.provisioningId,
      status: { in: ["requested", "clerk_creating", "retry_scheduled"] },
    },
  });
  if (result.count !== 1) {
    throw new ClerkProvisioningConflictError(
      "Provisioning attempt changed or was not found"
    );
  }
};

export const projectClerkOrganizationProvisioning = async (
  input: {
    readonly clerkMembershipId: string;
    readonly clerkOrgId: string;
    readonly clerkSourceRole: string;
    readonly clerkUserId: string;
    readonly provisioningId: string;
    readonly recognizedRole: boolean;
    readonly role: DealerRole;
    readonly expectedAttemptCount?: number;
  },
  client: PrismaClient = database
) =>
  client.$transaction(async (tx) => {
    const provisioning = await tx.clerkOrgProvisioning.findFirst({
      include: { applicantAccount: true },
      where: {
        ...(input.expectedAttemptCount === undefined
          ? {}
          : { attemptCount: input.expectedAttemptCount }),
        clerkOrgId: input.clerkOrgId,
        id: input.provisioningId,
        status: { in: ["clerk_created", "projected", "reconciling"] },
      },
    });
    if (!provisioning) {
      throw new ClerkProvisioningConflictError(
        "Provisioning attempt is not ready for projection"
      );
    }
    if (provisioning.applicantAccount.clerkUserId !== input.clerkUserId) {
      throw new ClerkProvisioningConflictError(
        "Provisioning applicant does not match the Clerk owner"
      );
    }
    const stableSuffix = input.clerkOrgId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-8)
      .toLowerCase();
    const slugBase = provisioning.requestedDisplayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const organization = await tx.dealerOrg.upsert({
      create: {
        clerkLastSyncedAt: new Date(),
        clerkOrgId: input.clerkOrgId,
        countryCode: provisioning.requestedCountryCode,
        displayName: provisioning.requestedDisplayName,
        id: `dealer_${provisioning.id}`,
        orgType: provisioning.requestedOrgType,
        slug: `${slugBase || "organization"}-${stableSuffix}`,
        verificationStatus: "unverified",
      },
      update: {
        clerkLastSyncedAt: new Date(),
        deletedAt: null,
        displayName: provisioning.requestedDisplayName,
      },
      where: { clerkOrgId: input.clerkOrgId },
    });
    const memberStatus = input.recognizedRole ? "active" : "disabled";
    await tx.dealerMember.upsert({
      create: {
        accountId: provisioning.applicantAccountId,
        clerkLastSyncedAt: new Date(),
        clerkMembershipId: input.clerkMembershipId,
        clerkSourceRole: input.clerkSourceRole,
        dealerOrgId: organization.id,
        disabledAt: input.recognizedRole ? null : new Date(),
        id: `member_${input.clerkMembershipId}`,
        role: input.role,
        status: memberStatus,
      },
      update: {
        clerkLastSyncedAt: new Date(),
        clerkMembershipId: input.clerkMembershipId,
        clerkSourceRole: input.clerkSourceRole,
        disabledAt: input.recognizedRole ? null : new Date(),
        role: input.role,
        status: memberStatus,
      },
      where: {
        dealerOrgId_accountId: {
          accountId: provisioning.applicantAccountId,
          dealerOrgId: organization.id,
        },
      },
    });
    const completed = await tx.clerkOrgProvisioning.updateMany({
      data: {
        completedAt: new Date(),
        projectedAt: new Date(),
        status: "completed",
      },
      where: {
        id: provisioning.id,
        ...(input.expectedAttemptCount === undefined
          ? {}
          : {
              attemptCount: input.expectedAttemptCount,
              status: "reconciling" as const,
            }),
      },
    });
    if (completed.count !== 1) {
      throw new ClerkProvisioningConflictError(
        "Provisioning recovery claim was lost"
      );
    }
    return organization;
  });

export const scheduleClerkProvisioningRetry = (
  input: {
    readonly errorCode: string;
    readonly expectedAttemptCount?: number;
    readonly nextAttemptAt: Date;
    readonly provisioningId: string;
  },
  client: PrismaClient = database
) =>
  client.clerkOrgProvisioning.updateMany({
    data: {
      errorCode: input.errorCode,
      nextAttemptAt: input.nextAttemptAt,
      status: "retry_scheduled",
    },
    where: {
      id: input.provisioningId,
      ...(input.expectedAttemptCount === undefined
        ? {}
        : {
            attemptCount: input.expectedAttemptCount,
            status: "reconciling" as const,
          }),
    },
  });

export const listRecoverableClerkProvisioning = (
  limit = 100,
  client: PrismaClient = database,
  now = new Date()
) => {
  const staleReconcilingBefore = new Date(now.getTime() - 10 * 60_000);
  return client.clerkOrgProvisioning.findMany({
    include: { applicantAccount: { select: { clerkUserId: true } } },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: Math.min(Math.max(limit, 1), 500),
    where: {
      OR: [
        {
          status: { in: ["clerk_created", "retry_scheduled", "projected"] },
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        { status: "reconciling", updatedAt: { lte: staleReconcilingBefore } },
      ],
    },
  });
};

export const claimRecoverableClerkProvisioning = async (
  input: {
    readonly expectedStatus: ClerkOrgProvisioningStatus;
    readonly expectedUpdatedAt: Date;
    readonly provisioningId: string;
  },
  client: PrismaClient = database
) => {
  const claimed = await client.clerkOrgProvisioning.updateMany({
    data: {
      attemptCount: { increment: 1 },
      errorCode: null,
      nextAttemptAt: null,
      status: "reconciling",
    },
    where: {
      id: input.provisioningId,
      status: input.expectedStatus,
      updatedAt: input.expectedUpdatedAt,
    },
  });
  return claimed.count === 1
    ? client.clerkOrgProvisioning.findUnique({
        include: { applicantAccount: { select: { clerkUserId: true } } },
        where: { id: input.provisioningId },
      })
    : null;
};

export const recordRecoveredClerkOrganization = (
  input: {
    readonly clerkOrgId: string;
    readonly expectedAttemptCount: number;
    readonly provisioningId: string;
  },
  client: PrismaClient = database
) =>
  client.clerkOrgProvisioning.updateMany({
    data: { clerkCreatedAt: new Date(), clerkOrgId: input.clerkOrgId },
    where: {
      attemptCount: input.expectedAttemptCount,
      clerkOrgId: null,
      id: input.provisioningId,
      status: "reconciling",
    },
  });

export const recordClerkProvisioningManualReview = (
  input: {
    readonly errorCode: string;
    readonly expectedAttemptCount: number;
    readonly provisioningId: string;
  },
  client: PrismaClient = database
) =>
  client.clerkOrgProvisioning.updateMany({
    data: {
      errorCode: input.errorCode,
      nextAttemptAt: null,
      status: "validation_failed",
    },
    where: {
      attemptCount: input.expectedAttemptCount,
      id: input.provisioningId,
      status: "reconciling",
    },
  });
