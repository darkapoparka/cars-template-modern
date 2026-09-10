import "server-only";

import {
  type OrganizationDirectoryProfileInput,
  type OrganizationImportServiceKind,
  organizationDirectoryProfileInputSchema,
  organizationImportServiceKinds,
} from "@repo/marketplace-domain";
import type {
  OrganizationBrandRelationshipType,
  Prisma,
  PrismaClient,
} from "./generated/client";
import { database } from "./index";
import {
  assertOrganizationActorRole,
  type DurableOrganizationActor,
} from "./organization-access";

const profileManagerRoles = ["owner", "manager"] as const;
type DatabaseClient = PrismaClient | Prisma.TransactionClient;
const importServiceKindSet: ReadonlySet<string> = new Set(
  organizationImportServiceKinds
);

export class OrganizationProfileConflictError extends Error {
  readonly code = "organization_profile_conflict";
}

const profileSelect = {
  brandRelationships: {
    orderBy: { brandName: "asc" as const },
    select: { brandName: true },
  },
  claimStatus: true,
  city: true,
  description: true,
  displayName: true,
  email: true,
  headquartersCountryCode: true,
  headline: true,
  id: true,
  logoUrl: true,
  phone: true,
  profileDraft: {
    select: {
      payload: true,
      updatedAt: true,
      version: true,
    },
  },
  profileImageUrl: true,
  publishedAt: true,
  region: true,
  services: true,
  slug: true,
  status: true,
  tradeLanes: {
    orderBy: [
      { originCountryCode: "asc" as const },
      { destinationCountryCode: "asc" as const },
    ],
    select: {
      destinationCountryCode: true,
      originCountryCode: true,
      serviceKinds: true,
      vehicleCategories: true,
    },
    where: { active: true },
  },
  websiteUrl: true,
} satisfies Prisma.OrganizationDirectoryEntrySelect;

type ProfileRow = Prisma.OrganizationDirectoryEntryGetPayload<{
  select: typeof profileSelect;
}>;

const optional = <T>(value: T | null | undefined) =>
  value === null || value === undefined ? undefined : value;

const isImportServiceKind = (
  value: string
): value is OrganizationImportServiceKind => importServiceKindSet.has(value);

const uniqueBrandNames = (row: ProfileRow) =>
  Array.from(
    new Map(
      row.brandRelationships.map(({ brandName }) => [
        brandName.trim().toLocaleLowerCase(),
        brandName.trim(),
      ])
    ).values()
  ).filter(Boolean);

const toPublishedProfile = (
  row: ProfileRow
): OrganizationDirectoryProfileInput =>
  organizationDirectoryProfileInputSchema.parse({
    brandNames: uniqueBrandNames(row),
    contact: {
      email: optional(row.email),
      phone: optional(row.phone),
      websiteUrl: optional(row.websiteUrl),
    },
    description: optional(row.description),
    displayName: row.displayName,
    headline: optional(row.headline),
    headquarters: {
      city: optional(row.city),
      countryCode: row.headquartersCountryCode ?? "BG",
      region: optional(row.region),
    },
    logoUrl: optional(row.logoUrl),
    profileImageUrl: optional(row.profileImageUrl),
    services: row.services.filter(isImportServiceKind),
    tradeLanes: row.tradeLanes.map((lane) => ({
      destinationCountryCode: lane.destinationCountryCode,
      originCountryCode: lane.originCountryCode,
      serviceKinds: lane.serviceKinds.filter(isImportServiceKind),
      vehicleCategories: lane.vehicleCategories,
    })),
  });

const parseDraft = (row: ProfileRow) => {
  if (!row.profileDraft) {
    return null;
  }

  const parsed = organizationDirectoryProfileInputSchema.safeParse(
    row.profileDraft.payload
  );
  if (!parsed.success) {
    throw new OrganizationProfileConflictError(
      "The saved public profile draft is invalid"
    );
  }

  return {
    profile: parsed.data,
    updatedAt: row.profileDraft.updatedAt,
    version: row.profileDraft.version,
  };
};

export const getDealerStudioPublicProfile = async (
  actor: DurableOrganizationActor,
  client: PrismaClient = database
) => {
  const [membership, row] = await Promise.all([
    client.dealerMember.findFirst({
      select: { role: true },
      where: {
        account: { deletedAt: null, status: "active" },
        accountId: actor.accountId,
        clerkDeletedAt: null,
        dealerOrg: { deletedAt: null },
        dealerOrgId: actor.dealerOrgId,
        disabledAt: null,
        status: "active",
      },
    }),
    client.organizationDirectoryEntry.findFirst({
      select: profileSelect,
      where: {
        claimStatus: "claimed",
        dealerOrgId: actor.dealerOrgId,
      },
    }),
  ]);
  if (!(membership && row)) {
    return null;
  }

  return {
    canManage: profileManagerRoles.includes(
      membership.role as (typeof profileManagerRoles)[number]
    ),
    claimStatus: row.claimStatus,
    draft: parseDraft(row),
    publishedAt: row.publishedAt,
    publishedProfile: toPublishedProfile(row),
    publicStatus: row.status,
    slug: row.slug,
  };
};

const requireManageableDirectoryEntry = async (
  actor: DurableOrganizationActor,
  client: DatabaseClient
) => {
  assertOrganizationActorRole(actor, profileManagerRoles);
  const entry = await client.organizationDirectoryEntry.findFirst({
    select: { id: true, orgType: true, slug: true, status: true },
    where: {
      claimStatus: "claimed",
      dealerOrg: {
        deletedAt: null,
        members: {
          some: {
            account: { deletedAt: null, status: "active" },
            accountId: actor.accountId,
            clerkDeletedAt: null,
            disabledAt: null,
            role: { in: [...profileManagerRoles] },
            status: "active",
          },
        },
      },
      dealerOrgId: actor.dealerOrgId,
    },
  });
  if (!entry) {
    throw new OrganizationProfileConflictError(
      "No claimed public profile belongs to this organization"
    );
  }
  return entry;
};

export const authorizeDealerStudioProfileMediaUpload = async (
  actor: DurableOrganizationActor,
  client: DatabaseClient = database
) => {
  const entry = await requireManageableDirectoryEntry(actor, client);
  return { directoryEntryId: entry.id, slug: entry.slug };
};

export const saveDealerStudioPublicProfileDraft = (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly expectedVersion?: number;
    readonly profile: OrganizationDirectoryProfileInput;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  const profile = organizationDirectoryProfileInputSchema.parse(input.profile);

  return client.$transaction(async (tx) => {
    const entry = await requireManageableDirectoryEntry(input.actor, tx);
    const existing = await tx.organizationDirectoryProfileDraft.findUnique({
      select: { id: true, version: true },
      where: { directoryEntryId: entry.id },
    });

    if (existing) {
      if (
        input.expectedVersion === undefined ||
        input.expectedVersion !== existing.version
      ) {
        throw new OrganizationProfileConflictError(
          "The public profile draft changed in another session"
        );
      }
      const updated = await tx.organizationDirectoryProfileDraft.updateMany({
        data: {
          payload: profile as unknown as Prisma.InputJsonValue,
          updatedByAccountId: input.actor.accountId,
          version: { increment: 1 },
        },
        where: { id: existing.id, version: existing.version },
      });
      if (updated.count !== 1) {
        throw new OrganizationProfileConflictError(
          "The public profile draft changed before it could be saved"
        );
      }
    } else {
      if (input.expectedVersion !== undefined) {
        throw new OrganizationProfileConflictError(
          "The expected public profile draft no longer exists"
        );
      }
      await tx.organizationDirectoryProfileDraft.create({
        data: {
          directoryEntryId: entry.id,
          payload: profile as unknown as Prisma.InputJsonValue,
          updatedByAccountId: input.actor.accountId,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        action: "organization_directory.profile_draft_saved",
        actorAccountId: input.actor.accountId,
        actorType: "account",
        dealerOrgId: input.actor.dealerOrgId,
        entityId: entry.id,
        entityType: "OrganizationDirectoryEntry",
        metadata: { slug: entry.slug },
        requestId: input.requestId,
      },
    });

    return tx.organizationDirectoryProfileDraft.findUniqueOrThrow({
      where: { directoryEntryId: entry.id },
    });
  });
};

const declarativeRelationshipType = (
  orgType: "dealer" | "distributor" | "importer" | "manufacturer"
): OrganizationBrandRelationshipType => {
  if (orgType === "importer" || orgType === "distributor") {
    return "imports";
  }
  if (orgType === "manufacturer") {
    return "manufacturer";
  }
  return "sells";
};

export const publishDealerStudioPublicProfile = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly expectedDraftVersion: number;
    readonly requestId: string;
  },
  client: PrismaClient = database
) =>
  client.$transaction(async (tx) => {
    const entry = await requireManageableDirectoryEntry(input.actor, tx);
    const draft = await tx.organizationDirectoryProfileDraft.findFirst({
      where: {
        directoryEntryId: entry.id,
        version: input.expectedDraftVersion,
      },
    });
    if (!draft) {
      throw new OrganizationProfileConflictError(
        "The public profile draft is stale or missing"
      );
    }
    const profile = organizationDirectoryProfileInputSchema.parse(
      draft.payload
    );
    const now = new Date();

    await tx.organizationDirectoryEntry.update({
      data: {
        city: profile.headquarters.city ?? null,
        description: profile.description ?? null,
        displayName: profile.displayName,
        email: profile.contact.email ?? null,
        headquartersCountryCode: profile.headquarters.countryCode,
        headline: profile.headline ?? null,
        logoUrl: profile.logoUrl ?? null,
        phone: profile.contact.phone ?? null,
        profileImageUrl: profile.profileImageUrl ?? null,
        publishedAt: now,
        region: profile.headquarters.region ?? null,
        services: profile.services,
        status: "published",
        websiteUrl: profile.contact.websiteUrl ?? null,
      },
      where: { id: entry.id },
    });

    await tx.organizationTradeLane.deleteMany({
      where: { directoryEntryId: entry.id },
    });
    if (profile.tradeLanes.length > 0) {
      await tx.organizationTradeLane.createMany({
        data: profile.tradeLanes.map((lane) => ({
          active: true,
          destinationCountryCode: lane.destinationCountryCode,
          directoryEntryId: entry.id,
          originCountryCode: lane.originCountryCode,
          serviceKinds: lane.serviceKinds,
          vehicleCategories: lane.vehicleCategories,
        })),
      });
    }

    await tx.organizationBrandRelationship.deleteMany({
      where: {
        directoryEntryId: entry.id,
        evidenceStatus: "self_reported",
      },
    });
    if (profile.brandNames.length > 0) {
      const relationshipType = declarativeRelationshipType(entry.orgType);
      await tx.organizationBrandRelationship.createMany({
        data: profile.brandNames.map((brandName) => ({
          brandName,
          directoryEntryId: entry.id,
          evidenceStatus: "self_reported",
          relationshipType,
        })),
        skipDuplicates: true,
      });
    }

    const deleted = await tx.organizationDirectoryProfileDraft.deleteMany({
      where: {
        directoryEntryId: entry.id,
        version: draft.version,
      },
    });
    if (deleted.count !== 1) {
      throw new OrganizationProfileConflictError(
        "The public profile draft changed while publishing"
      );
    }

    await tx.auditLog.create({
      data: {
        action: "organization_directory.profile_published",
        actorAccountId: input.actor.accountId,
        actorType: "account",
        after: { publishedAt: now.toISOString(), status: "published" },
        dealerOrgId: input.actor.dealerOrgId,
        entityId: entry.id,
        entityType: "OrganizationDirectoryEntry",
        metadata: { slug: entry.slug },
        requestId: input.requestId,
      },
    });

    return { publishedAt: now, slug: entry.slug };
  });
