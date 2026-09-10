import "server-only";

import { randomUUID } from "node:crypto";
import { type DealerRole, Prisma, type PrismaClient } from "./generated/client";
import { database } from "./index";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;
const ORGANIZATION_SUSPENSION_BATCH_SIZE = 500;

const normalizeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

interface ClerkOrganizationInput {
  readonly clerkOrgId: string;
  readonly displayName: string;
  readonly slug?: string | null;
}

export const suspendDealerOrganizationPublicState = async (
  tx: Prisma.TransactionClient,
  dealerOrgId: string,
  now: Date
) => {
  await tx.marketPublication.updateMany({
    data: {
      eligibilityDecision: "ineligible",
      eligibilityEvaluatedAt: now,
      eligibilityReasonCodes: ["organization_inactive"],
      pausedAt: now,
      status: "paused",
      version: { increment: 1 },
    },
    where: { status: "published", supplierOrgId: dealerOrgId },
  });
  let lastListingId: string | undefined;
  while (true) {
    const candidates = await tx.marketplaceListing.findMany({
      orderBy: { id: "asc" },
      select: { id: true },
      take: ORGANIZATION_SUSPENSION_BATCH_SIZE,
      where: {
        dealerOrgId,
        ...(lastListingId ? { id: { gt: lastListingId } } : {}),
        status: "active",
      },
    });
    if (candidates.length === 0) {
      break;
    }
    const updatedListings = await tx.marketplaceListing.updateManyAndReturn({
      data: {
        pausedAt: now,
        status: "paused",
        statusChangedAt: now,
        version: { increment: 1 },
      },
      select: { id: true },
      where: {
        id: { in: candidates.map(({ id }) => id) },
        status: "active",
      },
    });
    if (updatedListings.length > 0) {
      await tx.listingStatusEvent.createMany({
        data: updatedListings.map((listing) => ({
          actorDealerOrgId: dealerOrgId,
          fromStatus: "active" as const,
          listingId: listing.id,
          reasonCode: "organization_inactive",
          toStatus: "paused" as const,
        })),
      });
    }
    lastListingId = candidates.at(-1)?.id;
    if (candidates.length < ORGANIZATION_SUSPENSION_BATCH_SIZE) {
      break;
    }
  }
};

export const upsertDealerOrgFromClerkOrganization = (
  input: ClerkOrganizationInput,
  client: DatabaseClient = database
) => {
  const slug = normalizeSlug(input.slug || input.displayName);

  return client.dealerOrg.upsert({
    create: {
      id: randomUUID(),
      clerkOrgId: input.clerkOrgId,
      displayName: input.displayName.trim(),
      onboardingStatus: "registered",
      slug: slug || `organization-${input.clerkOrgId.toLowerCase()}`,
      verificationStatus: "unverified",
    },
    update: {
      displayName: input.displayName.trim(),
      slug: slug || `organization-${input.clerkOrgId.toLowerCase()}`,
    },
    where: { clerkOrgId: input.clerkOrgId },
  });
};

export const markDealerOrgDeleted = async (
  clerkOrgId: string,
  client: PrismaClient = database
) =>
  client.$transaction(async (tx) => {
    const organization = await tx.dealerOrg.findUnique({
      select: { id: true },
      where: { clerkOrgId },
    });

    if (!organization) {
      return { count: 0 };
    }

    const now = new Date();
    const result = await tx.dealerOrg.updateMany({
      data: {
        deletedAt: now,
        onboardingStatus: "suspended",
      },
      where: { clerkOrgId, deletedAt: null },
    });

    await tx.inventorySource.updateMany({
      data: { status: "disabled" },
      where: { deletedAt: null, supplierOrgId: organization.id },
    });
    await tx.dealerMember.updateMany({
      data: { status: "disabled" },
      where: { dealerOrgId: organization.id },
    });
    await tx.conversationParticipant.updateMany({
      data: { leftAt: now },
      where: {
        dealerMember: { dealerOrgId: organization.id },
        leftAt: null,
      },
    });
    await suspendDealerOrganizationPublicState(tx, organization.id, now);

    return result;
  });

interface ClerkMembershipInput {
  readonly clerkMembershipId: string;
  readonly clerkOrgId: string;
  readonly clerkSourceRole: string;
  readonly clerkUserId: string;
  readonly eventId: string;
  readonly eventKind: "active" | "deleted";
  readonly providerUpdatedAt: Date;
  readonly recognizedRole: boolean;
  readonly role: DealerRole;
}

export const applyDealerMemberClerkEvent = (
  input: ClerkMembershipInput,
  client: PrismaClient = database
) => {
  if (
    !(input.clerkMembershipId.trim() && input.eventId.trim()) ||
    Number.isNaN(input.providerUpdatedAt.getTime())
  ) {
    throw new Error("Clerk membership event metadata is invalid");
  }
  return client.$transaction(async (tx) => {
    const { getOrCreateMarketplaceAccountIdentity } = await import(
      "./accounts"
    );
    const dealerOrg = await tx.dealerOrg.findFirst({
      select: { id: true },
      where: {
        clerkOrgId: input.clerkOrgId,
        ...(input.eventKind === "active" ? { deletedAt: null } : {}),
      },
    });
    if (!dealerOrg) {
      return null;
    }
    const account = await getOrCreateMarketplaceAccountIdentity(
      input.clerkUserId,
      tx
    );
    const status =
      input.eventKind === "deleted" || !input.recognizedRole
        ? "disabled"
        : "active";
    const deletedAt = status === "disabled" ? input.providerUpdatedAt : null;

    const applied = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      INSERT INTO "DealerMember" (
        "id",
        "dealerOrgId",
        "accountId",
        "clerkMembershipId",
        "clerkProviderUpdatedAt",
        "clerkLastEventId",
        "clerkDeletedAt",
        "clerkSourceRole",
        "clerkLastSyncedAt",
        "disabledAt",
        "role",
        "status",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()},
        ${dealerOrg.id},
        ${account.id},
        ${input.clerkMembershipId},
        ${input.providerUpdatedAt},
        ${input.eventId},
        ${deletedAt},
        ${input.clerkSourceRole},
        CURRENT_TIMESTAMP,
        ${deletedAt},
        ${input.role}::"DealerRole",
        ${status}::"DealerMemberStatus",
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("dealerOrgId", "accountId") DO UPDATE
      SET
        "clerkMembershipId" = EXCLUDED."clerkMembershipId",
        "clerkProviderUpdatedAt" = EXCLUDED."clerkProviderUpdatedAt",
        "clerkLastEventId" = EXCLUDED."clerkLastEventId",
        "clerkDeletedAt" = EXCLUDED."clerkDeletedAt",
        "clerkSourceRole" = EXCLUDED."clerkSourceRole",
        "clerkLastSyncedAt" = EXCLUDED."clerkLastSyncedAt",
        "disabledAt" = EXCLUDED."disabledAt",
        "role" = EXCLUDED."role",
        "status" = EXCLUDED."status",
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE
        "DealerMember"."clerkProviderUpdatedAt" IS NULL
        OR EXCLUDED."clerkProviderUpdatedAt" > "DealerMember"."clerkProviderUpdatedAt"
        OR (
          EXCLUDED."clerkProviderUpdatedAt" = "DealerMember"."clerkProviderUpdatedAt"
          AND EXCLUDED."clerkDeletedAt" IS NOT NULL
          AND "DealerMember"."clerkDeletedAt" IS NULL
        )
      RETURNING "id"
    `);

    const member = await tx.dealerMember.findUniqueOrThrow({
      where: {
        dealerOrgId_accountId: {
          accountId: account.id,
          dealerOrgId: dealerOrg.id,
        },
      },
    });

    if (applied.length === 1) {
      await tx.conversationParticipant.updateMany({
        data: { leftAt: status === "active" ? null : input.providerUpdatedAt },
        where: {
          dealerMemberId: member.id,
          ...(status === "active" ? {} : { leftAt: null }),
        },
      });
    }

    return { applied: applied.length === 1, member };
  });
};
