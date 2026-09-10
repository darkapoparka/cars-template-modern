import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type {
  DealerRole,
  ExternalIdentitySyncStatus,
  Prisma,
  PrismaClient,
} from "./generated/client";
import { database } from "./index";
import {
  applyDealerMemberClerkEvent,
  suspendDealerOrganizationPublicState,
} from "./organizations";

export const hashExternalIdentityPayload = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const receiveExternalIdentitySyncEvent = async (
  input: {
    readonly aggregateId: string;
    readonly aggregateType: "organization" | "membership" | "user";
    readonly eventType: string;
    readonly payloadHash: string;
    readonly providerEventId: string;
    readonly providerOccurredAt: Date;
  },
  client: PrismaClient = database
) =>
  client.externalIdentitySyncEvent.upsert({
    create: {
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      eventType: input.eventType,
      payloadHash: input.payloadHash,
      provider: "clerk",
      providerEventId: input.providerEventId,
      providerOccurredAt: input.providerOccurredAt,
    },
    update: {},
    where: {
      provider_providerEventId: {
        provider: "clerk",
        providerEventId: input.providerEventId,
      },
    },
  });

export const applyDealerOrganizationSyncEvent = async (
  input: {
    readonly clerkOrgId: string;
    readonly displayName: string;
    readonly eventKind: "active" | "deleted";
    readonly providerEventId: string;
    readonly providerUpdatedAt: Date;
    readonly slug?: string | null;
    readonly completeInboxEvent?: boolean;
  },
  client: PrismaClient = database
) =>
  client.$transaction(async (tx) => {
    const completeInbox = (status: "applied" | "ignored_stale") =>
      input.completeInboxEvent === false
        ? Promise.resolve({ count: 0 })
        : tx.externalIdentitySyncEvent.updateMany({
            data: { appliedAt: new Date(), status },
            where: {
              provider: "clerk",
              providerEventId: input.providerEventId,
            },
          });
    const existing = await tx.dealerOrg.findUnique({
      where: { clerkOrgId: input.clerkOrgId },
    });
    if (
      existing?.clerkProviderUpdatedAt &&
      (existing.clerkProviderUpdatedAt > input.providerUpdatedAt ||
        (existing.clerkProviderUpdatedAt.getTime() ===
          input.providerUpdatedAt.getTime() &&
          (existing.clerkDeletedAt || input.eventKind !== "deleted")))
    ) {
      await completeInbox("ignored_stale");
      return { applied: false, organization: existing };
    }
    if (existing?.clerkDeletedAt && input.eventKind === "active") {
      await completeInbox("ignored_stale");
      return { applied: false, organization: existing };
    }

    const slugBase = (input.slug || input.displayName)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const stableSlug = `${slugBase || "organization"}-${input.clerkOrgId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-8)
      .toLowerCase()}`;
    const deletedAt =
      input.eventKind === "deleted" ? input.providerUpdatedAt : null;
    const organization = await tx.dealerOrg.upsert({
      create: {
        id: randomUUID(),
        clerkDeletedAt: deletedAt,
        clerkLastSyncedAt: new Date(),
        clerkOrgId: input.clerkOrgId,
        clerkProviderUpdatedAt: input.providerUpdatedAt,
        deletedAt,
        displayName: input.displayName.trim(),
        onboardingStatus:
          input.eventKind === "deleted" ? "suspended" : "registered",
        slug: stableSlug,
        verificationStatus: "unverified",
      },
      update: {
        clerkDeletedAt: deletedAt,
        clerkLastSyncedAt: new Date(),
        clerkProviderUpdatedAt: input.providerUpdatedAt,
        deletedAt,
        displayName: input.displayName.trim(),
        onboardingStatus:
          input.eventKind === "deleted" ? "suspended" : undefined,
        slug: stableSlug,
      },
      where: { clerkOrgId: input.clerkOrgId },
    });
    if (input.eventKind === "deleted") {
      await tx.dealerMember.updateMany({
        data: {
          clerkDeletedAt: input.providerUpdatedAt,
          disabledAt: input.providerUpdatedAt,
          status: "disabled",
        },
        where: { dealerOrgId: organization.id },
      });
      await tx.inventorySource.updateMany({
        data: {
          disabledAt: input.providerUpdatedAt,
          status: "disabled",
          statusReasonCode: "organization_deleted",
        },
        where: { deletedAt: null, supplierOrgId: organization.id },
      });
      await suspendDealerOrganizationPublicState(
        tx,
        organization.id,
        input.providerUpdatedAt
      );
    }
    await completeInbox("applied");
    return { applied: true, organization };
  });

export const applyDealerMembershipSyncEvent = async (
  input: {
    readonly clerkMembershipId: string;
    readonly clerkOrgId: string;
    readonly clerkSourceRole: string;
    readonly clerkUserId: string;
    readonly eventKind: "active" | "deleted";
    readonly providerEventId: string;
    readonly providerUpdatedAt: Date;
    readonly recognizedRole: boolean;
    readonly role: DealerRole;
    readonly completeInboxEvent?: boolean;
  },
  client: PrismaClient = database
) => {
  const result = await applyDealerMemberClerkEvent(
    {
      clerkMembershipId: input.clerkMembershipId,
      clerkOrgId: input.clerkOrgId,
      clerkSourceRole: input.clerkSourceRole,
      clerkUserId: input.clerkUserId,
      eventId: input.providerEventId,
      eventKind: input.eventKind,
      providerUpdatedAt: input.providerUpdatedAt,
      recognizedRole: input.recognizedRole,
      role: input.role,
    },
    client
  );
  if (input.completeInboxEvent !== false) {
    await client.externalIdentitySyncEvent.updateMany({
      data: {
        appliedAt: new Date(),
        status: result?.applied ? "applied" : "ignored_stale",
      },
      where: { provider: "clerk", providerEventId: input.providerEventId },
    });
  }
  return result;
};

export const applyDealerOrganizationAbsenceEvent = async (
  input: {
    readonly clerkOrgId: string;
    readonly providerEventId: string;
    readonly providerUpdatedAt: Date;
  },
  client: PrismaClient = database
) => {
  const organization = await client.dealerOrg.findUnique({
    select: { displayName: true, slug: true },
    where: { clerkOrgId: input.clerkOrgId },
  });
  if (!organization) {
    return { applied: false, organization: null };
  }
  return applyDealerOrganizationSyncEvent(
    {
      clerkOrgId: input.clerkOrgId,
      completeInboxEvent: false,
      displayName: organization.displayName,
      eventKind: "deleted",
      providerEventId: input.providerEventId,
      providerUpdatedAt: input.providerUpdatedAt,
      slug: organization.slug,
    },
    client
  );
};

export const applyDealerMembershipAbsenceEvent = async (
  input: {
    readonly clerkMembershipId: string;
    readonly providerEventId: string;
    readonly providerUpdatedAt: Date;
  },
  client: PrismaClient = database
) => {
  const existing = await client.dealerMember.findUnique({
    include: {
      account: { select: { clerkUserId: true } },
      dealerOrg: { select: { clerkOrgId: true } },
    },
    where: { clerkMembershipId: input.clerkMembershipId },
  });
  if (!existing) {
    return { applied: false, member: null };
  }
  return applyDealerMemberClerkEvent(
    {
      clerkMembershipId: input.clerkMembershipId,
      clerkOrgId: existing.dealerOrg.clerkOrgId,
      clerkSourceRole: existing.clerkSourceRole ?? "unknown",
      clerkUserId: existing.account.clerkUserId,
      eventId: input.providerEventId,
      eventKind: "deleted",
      providerUpdatedAt: input.providerUpdatedAt,
      recognizedRole: false,
      role: existing.role,
    },
    client
  );
};

export const disableMarketplaceAccountFromClerk = async (
  input: {
    readonly clerkUserId: string;
    readonly providerUpdatedAt: Date;
  },
  client: PrismaClient = database
) =>
  client.$transaction(async (tx) => {
    const account = await tx.marketplaceAccount.findUnique({
      where: { clerkUserId: input.clerkUserId },
    });
    if (!account) {
      return { count: 0 };
    }
    const sellerProfile = await tx.sellerProfile.findFirst({
      select: { id: true },
      where: { accountId: account.id, deletedAt: null },
    });
    await tx.dealerMember.updateMany({
      data: {
        clerkDeletedAt: input.providerUpdatedAt,
        disabledAt: input.providerUpdatedAt,
        status: "disabled",
      },
      where: { accountId: account.id },
    });
    await tx.conversationParticipant.updateMany({
      data: { leftAt: input.providerUpdatedAt },
      where: { accountId: account.id, leftAt: null },
    });
    if (sellerProfile) {
      await tx.sellerProfile.updateMany({
        data: {
          deletedAt: input.providerUpdatedAt,
          status: "deleted",
        },
        where: { id: sellerProfile.id, deletedAt: null },
      });
      await pauseActiveSellerListings(tx, {
        accountId: account.id,
        at: input.providerUpdatedAt,
        sellerProfileId: sellerProfile.id,
      });
    }
    return tx.marketplaceAccount.updateMany({
      data: {
        deletedAt: input.providerUpdatedAt,
        status: "deleted",
      },
      where: { id: account.id, deletedAt: null },
    });
  });

const pauseActiveSellerListings = async (
  tx: Prisma.TransactionClient,
  input: {
    readonly accountId: string;
    readonly at: Date;
    readonly sellerProfileId: string;
  }
) => {
  let lastListingId: string | undefined;
  while (true) {
    const listings = await tx.marketplaceListing.findMany({
      orderBy: { id: "asc" },
      select: { id: true },
      take: 500,
      where: {
        ...(lastListingId ? { id: { gt: lastListingId } } : {}),
        sellerProfileId: input.sellerProfileId,
        status: "active",
      },
    });
    if (listings.length === 0) {
      return;
    }
    const paused = await tx.marketplaceListing.updateManyAndReturn({
      data: {
        pausedAt: input.at,
        status: "paused",
        statusChangedAt: input.at,
        version: { increment: 1 },
      },
      select: { id: true },
      where: {
        id: { in: listings.map(({ id }) => id) },
        status: "active",
      },
    });
    if (paused.length > 0) {
      await tx.listingStatusEvent.createMany({
        data: paused.map(({ id }) => ({
          actorAccountId: input.accountId,
          fromStatus: "active" as const,
          listingId: id,
          reasonCode: "account_inactive",
          toStatus: "paused" as const,
        })),
      });
    }
    lastListingId = listings.at(-1)?.id;
    if (listings.length < 500) {
      return;
    }
  }
};

export const listPendingExternalIdentitySyncEvents = (
  limit = 100,
  client: PrismaClient = database,
  now = new Date()
) => {
  const staleApplyingBefore = new Date(now.getTime() - 10 * 60_000);
  return client.externalIdentitySyncEvent.findMany({
    orderBy: [{ providerOccurredAt: "asc" }, { id: "asc" }],
    take: Math.min(Math.max(limit, 1), 500),
    where: {
      OR: [
        {
          status: { in: ["received", "retry_scheduled", "failed"] },
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        { status: "applying", updatedAt: { lte: staleApplyingBefore } },
      ],
    },
  });
};

export const claimExternalIdentitySyncEvent = async (
  input: {
    readonly expectedStatus: ExternalIdentitySyncStatus;
    readonly expectedUpdatedAt: Date;
    readonly id: string;
  },
  client: PrismaClient = database
) => {
  const claimed = await client.externalIdentitySyncEvent.updateMany({
    data: {
      attemptCount: { increment: 1 },
      errorCode: null,
      nextAttemptAt: null,
      status: "applying",
    },
    where: {
      id: input.id,
      status: input.expectedStatus,
      updatedAt: input.expectedUpdatedAt,
    },
  });
  return claimed.count === 1
    ? client.externalIdentitySyncEvent.findUnique({ where: { id: input.id } })
    : null;
};

export const completeExternalIdentitySyncEvent = (
  input: {
    readonly attemptCount: number;
    readonly id: string;
    readonly status: "applied" | "ignored_stale";
  },
  client: PrismaClient = database
) =>
  client.externalIdentitySyncEvent.updateMany({
    data: { appliedAt: new Date(), errorCode: null, status: input.status },
    where: {
      attemptCount: input.attemptCount,
      id: input.id,
      status: "applying",
    },
  });

export const completeReceivedExternalIdentitySyncEvent = (
  providerEventId: string,
  client: PrismaClient = database
) =>
  client.externalIdentitySyncEvent.updateMany({
    data: { appliedAt: new Date(), errorCode: null, status: "applied" },
    where: {
      provider: "clerk",
      providerEventId,
      status: "received",
    },
  });

export const scheduleExternalIdentitySyncRetry = (
  input: {
    readonly attemptCount: number;
    readonly errorCode: string;
    readonly id: string;
    readonly nextAttemptAt: Date;
  },
  client: PrismaClient = database
) =>
  client.externalIdentitySyncEvent.updateMany({
    data: {
      errorCode: input.errorCode,
      nextAttemptAt: input.nextAttemptAt,
      status: "retry_scheduled",
    },
    where: {
      attemptCount: input.attemptCount,
      id: input.id,
      status: "applying",
    },
  });
