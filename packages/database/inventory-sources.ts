import "server-only";

import type {
  InventoryCredentialPurpose,
  InventorySourceKind,
  InventorySyncMode,
  Prisma,
  PrismaClient,
} from "./generated/client";
import { database } from "./index";
import {
  assertOrganizationActorRole,
  type DurableOrganizationActor,
} from "./organization-access";

const secretKeyPattern =
  /(?:secret|password|passwd|token|api[_-]?key|private[_-]?key|credential|bearer|authorization)/i;
const referencePattern =
  /^(?:inventory:(?:token|feed):[A-Za-z0-9._:/-]+|vault:[A-Za-z0-9._:/-]+|env:AUTOMARKET_INVENTORY_[A-Z0-9_]+)$/;

export class InventorySourceConflictError extends Error {
  readonly code = "inventory_source_conflict";
}

export const assertSafeInventorySourceConfig = (
  value: Prisma.InputJsonValue | null | undefined,
  path = "config"
): void => {
  if (value === null || value === undefined) {
    return;
  }
  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      assertSafeInventorySourceConfig(entry, `${path}[${index}]`);
    }
    return;
  }
  if (typeof value !== "object") {
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (secretKeyPattern.test(key)) {
      throw new Error(`Secret material is not allowed in ${path}.${key}`);
    }
    assertSafeInventorySourceConfig(
      nested as Prisma.InputJsonValue,
      `${path}.${key}`
    );
  }
};

export const assertCredentialReference = (reference: string): void => {
  if (!referencePattern.test(reference)) {
    throw new Error("Credential reference is outside the allowed namespaces");
  }
};

const requireSupplyCapability = async (
  tx: Prisma.TransactionClient,
  dealerOrgId: string,
  now: Date
) => {
  const capability = await tx.dealerOrgCapability.findFirst({
    select: { id: true },
    where: {
      capabilityKey: "inventory.supply",
      dealerOrgId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      revokedAt: null,
      status: "active",
      suspendedAt: null,
    },
  });
  if (!capability) {
    throw new InventorySourceConflictError(
      "A current inventory.supply capability is required"
    );
  }
};

const writeSourceAudit = (
  tx: Prisma.TransactionClient,
  input: {
    readonly action: string;
    readonly actor: DurableOrganizationActor;
    readonly entityId: string;
    readonly metadata?: Prisma.InputJsonValue;
    readonly requestId: string;
  }
) =>
  tx.auditLog.create({
    data: {
      action: input.action,
      actorAccountId: input.actor.accountId,
      actorType: "account",
      dealerOrgId: input.actor.dealerOrgId,
      entityId: input.entityId,
      entityType: "InventorySource",
      ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      requestId: input.requestId,
    },
  });

const pauseSourcePublications = async (
  tx: Prisma.TransactionClient,
  inventorySourceId: string,
  reasonCode: string,
  now: Date
) => {
  const publications = await tx.marketPublication.findMany({
    select: { id: true },
    where: { inventorySourceId, status: "published" },
  });
  const ids = publications.map(({ id }) => id);
  if (ids.length === 0) {
    return;
  }
  await tx.marketPublication.updateMany({
    data: {
      eligibilityDecision: "ineligible",
      eligibilityEvaluatedAt: now,
      eligibilityReasonCodes: [reasonCode],
      pausedAt: now,
      status: "paused",
      version: { increment: 1 },
    },
    where: { id: { in: ids }, status: "published" },
  });
  await tx.marketplaceListing.updateMany({
    data: {
      pausedAt: now,
      status: "paused",
      statusChangedAt: now,
      version: { increment: 1 },
    },
    where: { marketPublicationId: { in: ids }, status: "active" },
  });
};

export const createInventorySource = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly config?: Prisma.InputJsonValue | null;
    readonly kind: InventorySourceKind;
    readonly name: string;
    readonly providerKey?: string;
    readonly requestId: string;
    readonly syncMode: InventorySyncMode;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  assertSafeInventorySourceConfig(input.config);
  const now = new Date();

  return await client.$transaction(async (tx) => {
    await requireSupplyCapability(tx, input.actor.dealerOrgId, now);
    const source = await tx.inventorySource.create({
      data: {
        config: input.config ?? undefined,
        kind: input.kind,
        name: input.name.trim(),
        providerKey: input.providerKey?.trim() || "generic",
        status: "pending",
        supplierOrgId: input.actor.dealerOrgId,
        syncMode: input.syncMode,
      },
    });
    await writeSourceAudit(tx, {
      action: "source.create",
      actor: input.actor,
      entityId: source.id,
      metadata: {
        kind: source.kind,
        providerKey: source.providerKey,
        syncMode: source.syncMode,
      },
      requestId: input.requestId,
    });
    return source;
  });
};

export const updateInventorySourceConfig = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly config: Prisma.InputJsonValue;
    readonly expectedConfigVersion: number;
    readonly inventorySourceId: string;
    readonly name?: string;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  assertSafeInventorySourceConfig(input.config);

  return await client.$transaction(async (tx) => {
    const result = await tx.inventorySource.updateMany({
      data: {
        config: input.config,
        configVersion: { increment: 1 },
        name: input.name?.trim(),
      },
      where: {
        configVersion: input.expectedConfigVersion,
        deletedAt: null,
        id: input.inventorySourceId,
        status: { in: ["pending", "paused"] },
        supplierOrgId: input.actor.dealerOrgId,
      },
    });
    if (result.count !== 1) {
      throw new InventorySourceConflictError(
        "Source configuration changed or is not editable"
      );
    }
    await writeSourceAudit(tx, {
      action: "source.configure",
      actor: input.actor,
      entityId: input.inventorySourceId,
      metadata: { nextConfigVersion: input.expectedConfigVersion + 1 },
      requestId: input.requestId,
    });
    return tx.inventorySource.findUniqueOrThrow({
      where: { id: input.inventorySourceId },
    });
  });
};

export const activateInventorySource = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly inventorySourceId: string;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  const now = new Date();
  return await client.$transaction(async (tx) => {
    await requireSupplyCapability(tx, input.actor.dealerOrgId, now);
    const source = await tx.inventorySource.findFirst({
      include: {
        credentialBindings: {
          where: { status: "active" },
        },
      },
      where: {
        deletedAt: null,
        id: input.inventorySourceId,
        status: "pending",
        supplierOrgId: input.actor.dealerOrgId,
      },
    });
    if (!source) {
      throw new InventorySourceConflictError(
        "Source was not found or cannot be activated"
      );
    }
    if (source.kind !== "csv" && source.credentialBindings.length === 0) {
      throw new InventorySourceConflictError(
        "A healthy scoped credential binding is required"
      );
    }
    const updated = await tx.inventorySource.update({
      data: {
        activatedAt: now,
        status: "active",
        statusReasonCode: null,
      },
      where: { id: source.id },
    });
    await writeSourceAudit(tx, {
      action: "source.activate",
      actor: input.actor,
      entityId: source.id,
      requestId: input.requestId,
    });
    return updated;
  });
};

const transitionSourceToNonActive = async (
  input: {
    readonly action: "source.pause" | "source.disconnect";
    readonly actor: DurableOrganizationActor;
    readonly inventorySourceId: string;
    readonly reasonCode: string;
    readonly requestId: string;
  },
  client: PrismaClient
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  const now = new Date();
  return await client.$transaction(async (tx) => {
    const source = await tx.inventorySource.findFirst({
      where: {
        deletedAt: null,
        id: input.inventorySourceId,
        status: { not: "disabled" },
        supplierOrgId: input.actor.dealerOrgId,
      },
    });
    if (!source) {
      throw new InventorySourceConflictError("Source was not found");
    }
    const disconnect = input.action === "source.disconnect";
    const updated = await tx.inventorySource.update({
      data: {
        applyLeaseExpiresAt: null,
        applyLeaseSessionId: null,
        applyLeaseToken: null,
        disabledAt: disconnect ? now : undefined,
        pausedAt: disconnect ? source.pausedAt : now,
        status: disconnect ? "disabled" : "paused",
        statusReasonCode: input.reasonCode,
      },
      where: { id: source.id },
    });
    await pauseSourcePublications(
      tx,
      source.id,
      disconnect ? "source_disconnected" : "source_paused",
      now
    );
    if (disconnect) {
      await tx.inventorySourceCredentialBinding.updateMany({
        data: { revokedAt: now, status: "revoked" },
        where: {
          inventorySourceId: source.id,
          status: { in: ["pending", "active", "retiring"] },
        },
      });
      await tx.inventorySource.update({
        data: { credentialReference: null },
        where: { id: source.id },
      });
    }
    await writeSourceAudit(tx, {
      action: input.action,
      actor: input.actor,
      entityId: source.id,
      metadata: { reasonCode: input.reasonCode },
      requestId: input.requestId,
    });
    return updated;
  });
};

export const pauseInventorySource = (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly inventorySourceId: string;
    readonly reasonCode: string;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => transitionSourceToNonActive({ ...input, action: "source.pause" }, client);

export const disconnectInventorySource = (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly inventorySourceId: string;
    readonly reasonCode: string;
    readonly requestId: string;
  },
  client: PrismaClient = database
) =>
  transitionSourceToNonActive(
    { ...input, action: "source.disconnect" },
    client
  );

export const resumeInventorySource = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly inventorySourceId: string;
    readonly requestId: string;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  const now = new Date();
  return await client.$transaction(async (tx) => {
    await requireSupplyCapability(tx, input.actor.dealerOrgId, now);
    const result = await tx.inventorySource.updateMany({
      data: {
        pausedAt: null,
        status: "degraded",
        statusReasonCode: "awaiting_fresh_success",
      },
      where: {
        id: input.inventorySourceId,
        status: "paused",
        supplierOrgId: input.actor.dealerOrgId,
      },
    });
    if (result.count !== 1) {
      throw new InventorySourceConflictError(
        "Source was not found or cannot be resumed"
      );
    }
    await writeSourceAudit(tx, {
      action: "source.resume",
      actor: input.actor,
      entityId: input.inventorySourceId,
      requestId: input.requestId,
    });
    return tx.inventorySource.findUniqueOrThrow({
      where: { id: input.inventorySourceId },
    });
  });
};

export const attachInventoryCredentialBinding = async (
  input: {
    readonly actor: DurableOrganizationActor;
    readonly credentialReference: string;
    readonly inventorySourceId: string;
    readonly purpose: InventoryCredentialPurpose;
    readonly requestId: string;
    readonly retiringUntil?: Date;
  },
  client: PrismaClient = database
) => {
  assertOrganizationActorRole(input.actor, ["owner", "manager"]);
  assertCredentialReference(input.credentialReference);
  const now = new Date();
  return await client.$transaction(async (tx) => {
    const source = await tx.inventorySource.findFirst({
      where: {
        deletedAt: null,
        id: input.inventorySourceId,
        status: { in: ["pending", "paused"] },
        supplierOrgId: input.actor.dealerOrgId,
      },
    });
    if (!source || source.kind === "csv") {
      throw new InventorySourceConflictError(
        "Credential binding is unavailable for this source"
      );
    }
    const previous = await tx.inventorySourceCredentialBinding.findFirst({
      orderBy: { version: "desc" },
      where: {
        inventorySourceId: source.id,
        purpose: input.purpose,
        status: "active",
      },
    });
    if (previous && !(input.retiringUntil && input.retiringUntil > now)) {
      throw new InventorySourceConflictError(
        "Rotation requires a finite retiring overlap"
      );
    }
    if (previous) {
      await tx.inventorySourceCredentialBinding.update({
        data: {
          retiringUntil: input.retiringUntil,
          status: "retiring",
        },
        where: { id: previous.id },
      });
    }
    const latest = await tx.inventorySourceCredentialBinding.aggregate({
      _max: { version: true },
      where: {
        inventorySourceId: source.id,
        purpose: input.purpose,
      },
    });
    const binding = await tx.inventorySourceCredentialBinding.create({
      data: {
        activatedAt: now,
        credentialReference: input.credentialReference,
        dealerOrgId: input.actor.dealerOrgId,
        inventorySourceId: source.id,
        purpose: input.purpose,
        status: "active",
        verifiedAt: now,
        version: (latest._max.version ?? 0) + 1,
      },
    });
    await tx.inventorySource.update({
      data: {
        credentialHealthStatus: "active",
        credentialReference: input.credentialReference,
        credentialVerifiedAt: now,
      },
      where: { id: source.id },
    });
    await writeSourceAudit(tx, {
      action: previous ? "credential.rotate" : "credential.provision",
      actor: input.actor,
      entityId: source.id,
      metadata: { purpose: input.purpose, version: binding.version },
      requestId: input.requestId,
    });
    return binding;
  });
};

export const listOrganizationInventorySources = (
  dealerOrgId: string,
  client: PrismaClient = database
) =>
  client.inventorySource.findMany({
    include: {
      credentialBindings: {
        orderBy: { version: "desc" },
        select: {
          purpose: true,
          retiringUntil: true,
          status: true,
          verifiedAt: true,
          version: true,
        },
      },
      syncRuns: { orderBy: { startedAt: "desc" }, take: 1 },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    where: { deletedAt: null, supplierOrgId: dealerOrgId },
  });
