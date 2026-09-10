import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  evaluatePublicationEligibility,
  getCanonicalVehicleKey,
  getIsoCountryName,
  type InventoryRecord,
  type InventoryUpsertRecord,
  MAX_SOURCE_CLOCK_SKEW_MS,
  type PreparedInventoryBatch,
  type QuarantinedInventoryRecord,
  requiredSupplierCapabilities,
  shouldReconcileMissingRecord,
} from "@repo/marketplace-domain";
import { buildInventoryCsvNormalizedDigest } from "@repo/marketplace-domain/inventory-csv";
import {
  type InventoryOffer,
  type InventorySyncRun,
  type InventorySyncTrigger,
  type Market,
  type MarketPublication,
  type PriceCurrency,
  Prisma,
  type PrismaClient,
} from "./generated/client";
import { database } from "./index";
import {
  getInventoryFreshnessWindow,
  hasEqualBatchTimestampConflict,
  hasSameTimestampPayloadConflict,
} from "./inventory-ordering";

const MAX_INT = 2_147_483_647n;
const ABANDONED_RUN_MINUTES = 10;
const INGESTION_TRANSACTION_TIMEOUT_MS = 45_000;
const RECONCILIATION_BATCH_LIMIT = 25;
const RAW_PAYLOAD_PURGE_BATCH_LIMIT = 100;
const RAW_PAYLOAD_RETENTION_DAYS = 30;
const PUBLICATION_POLICY_VERSION = "supplier-network-m1-v1";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const sourceContextInclude = {
  rightsGrants: true,
  supplierOrg: {
    include: {
      capabilities: true,
      marketPermissions: {
        include: { market: true },
      },
      supplierTrust: {
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  },
} satisfies Prisma.InventorySourceInclude;

type SourceContext = Prisma.InventorySourceGetPayload<{
  include: typeof sourceContextInclude;
}>;

const authorityPublicationInclude = {
  inventoryRightsGrant: true,
  market: true,
  marketPermission: true,
  supplierOffer: {
    include: {
      inventorySource: true,
      supplierOrg: {
        include: {
          capabilities: true,
          supplierTrust: {
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  },
} satisfies Prisma.MarketPublicationInclude;

type AuthorityPublication = Prisma.MarketPublicationGetPayload<{
  include: typeof authorityPublicationInclude;
}>;

interface IngestionCounters {
  changedCount: number;
  missingCount: number;
  projectedCount: number;
  rejectedCount: number;
  unchangedCount: number;
  unpublishedCount: number;
}

export interface InventoryIngestionRequest {
  idempotencyKey: string;
  importContext?: {
    readonly attemptOrdinal: number;
    readonly attemptLeaseToken: string;
    readonly chunkIndex: number;
    readonly importSessionId: string;
    readonly leaseToken: string;
    readonly snapshotToken: string;
  };
  payloadByteSize: number;
  payloadSha256: string;
  preparedBatch: PreparedInventoryBatch;
  sourceKey: string;
  trigger: InventorySyncTrigger;
}

export interface InventoryIngressFailureRequest {
  errorCode: string;
  idempotencyKey: string;
  payloadByteSize: number;
  payloadSha256: string;
  sourceKey: string;
  trigger: InventorySyncTrigger;
}

export interface InventoryIngestionResult extends IngestionCounters {
  duplicate: boolean;
  runId: string;
  status:
    | "completed"
    | "completed_with_issues"
    | "duplicate"
    | "failed_replay"
    | "in_progress";
}

export class InventorySourceNotFoundError extends Error {}
export class InventorySourceUnavailableError extends Error {}
export class InventorySourceLeasedError extends Error {}
export class InventorySourceModeMismatchError extends Error {}
export class InventoryIdempotencyConflictError extends Error {}
export class InventoryBatchTimestampError extends Error {}
export class InventoryPayloadHashError extends Error {}

const isUniqueConstraintError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "P2002";

const toDuplicateIngestionResult = (
  run: InventorySyncRun
): InventoryIngestionResult => {
  const status = (() => {
    if (run.status === "failed") {
      return "failed_replay" as const;
    }
    if (
      run.status === "queued" ||
      run.status === "receiving" ||
      run.status === "validating" ||
      run.status === "applying"
    ) {
      return "in_progress" as const;
    }
    return "duplicate" as const;
  })();

  return {
    changedCount: run.changedCount,
    duplicate: true,
    missingCount: run.missingCount,
    projectedCount: run.projectedCount,
    rejectedCount: run.rejectedCount,
    runId: run.id,
    status,
    unchangedCount: run.unchangedCount,
    unpublishedCount: run.unpublishedCount,
  };
};

const stableJsonValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(stableJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableJsonValue(entry)])
    );
  }

  return value;
};

export const stableInventoryJson = (value: unknown) =>
  JSON.stringify(stableJsonValue(value));

export const hashInventoryPayload = (value: unknown) =>
  createHash("sha256").update(stableInventoryJson(value)).digest("hex");

const toInputJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;

const toRawInputJson = (value: unknown): Prisma.InputJsonValue => {
  const serialized = JSON.stringify(value ?? null);

  if (serialized.includes("\\u0000") || serialized.includes("\0")) {
    return {
      data: Buffer.from(serialized, "utf8").toString("base64"),
      encoding: "json-utf8-base64",
    };
  }

  return JSON.parse(serialized) as Prisma.InputJsonValue;
};

const addMinutes = (value: Date, minutes: number) =>
  new Date(value.getTime() + minutes * 60 * 1000);

const addDays = (value: Date, days: number) =>
  new Date(value.getTime() + days * 24 * 60 * 60 * 1000);

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toDisplayCurrency = (currencyCode: string): PriceCurrency | null =>
  currencyCode === "BGN" || currencyCode === "EUR" ? currencyCode : null;

const toDisplayAmount = (amountMinor: bigint) =>
  amountMinor <= MAX_INT ? Number(amountMinor) : null;

const getLatestSupplierTrustStatus = (source: SourceContext, now: Date) => {
  const review = source.supplierOrg.supplierTrust[0];

  if (!review) {
    return "unverified" as const;
  }

  if (review.expiresAt && review.expiresAt <= now) {
    return "unverified" as const;
  }

  return review.status;
};

const getCurrentOrganizationKybStatus = (source: SourceContext, now: Date) => {
  if (
    source.supplierOrg.kybStatus === "verified" &&
    source.supplierOrg.kybExpiresAt &&
    source.supplierOrg.kybExpiresAt <= now
  ) {
    return "expired" as const;
  }

  return source.supplierOrg.kybStatus;
};

const pauseListingForOffer = async (
  tx: Prisma.TransactionClient,
  inventoryOfferId: string,
  reasonCode: string,
  now: Date
) => {
  const listing = await tx.marketplaceListing.findUnique({
    select: { dealerOrgId: true, id: true, status: true },
    where: { inventoryOfferId },
  });

  if (!listing || listing.status !== "active") {
    return false;
  }

  await tx.marketplaceListing.update({
    data: {
      pausedAt: now,
      status: "paused",
      statusChangedAt: now,
      version: { increment: 1 },
    },
    where: { id: listing.id },
  });
  await tx.listingStatusEvent.create({
    data: {
      actorDealerOrgId: listing.dealerOrgId,
      fromStatus: "active",
      listingId: listing.id,
      reasonCode,
      toStatus: "paused",
    },
  });

  return true;
};

const pauseOfferPublications = async (
  tx: Prisma.TransactionClient,
  offerId: string,
  reasonCode: string,
  now: Date
) => {
  await tx.marketPublication.updateMany({
    data: {
      eligibilityDecision: "ineligible",
      eligibilityEvaluatedAt: now,
      eligibilityReasonCodes: [reasonCode],
      pausedAt: now,
      status: "paused",
      version: { increment: 1 },
    },
    where: { supplierOfferId: offerId, status: "published" },
  });

  return pauseListingForOffer(tx, offerId, reasonCode, now);
};

const refreshListingAfterPublicationPause = async (
  tx: Prisma.TransactionClient,
  offerId: string,
  reasonCode: string,
  now: Date
) => {
  const publishedPublications = await tx.marketPublication.findMany({
    include: { market: true },
    orderBy: { market: { code: "asc" } },
    where: {
      channel: "public_marketplace",
      status: "published",
      supplierOfferId: offerId,
    },
  });

  if (publishedPublications.length === 0) {
    return pauseListingForOffer(tx, offerId, reasonCode, now);
  }

  const listing = await tx.marketplaceListing.findUnique({
    where: { inventoryOfferId: offerId },
  });
  const primaryPublication = publishedPublications.at(0);
  if (!(listing && primaryPublication)) {
    return false;
  }

  const deliveryCountryCodes = publishedPublications
    .map((publication) => publication.market.countryCode)
    .filter((countryCode): countryCode is string => Boolean(countryCode));
  const requiresQuote = deliveryCountryCodes.some(
    (countryCode) => countryCode !== listing.originCountryCode
  );

  await tx.marketplaceListing.update({
    data: {
      deliveryCountryCodes: Array.from(new Set(deliveryCountryCodes)),
      landedCostStatus: requiresQuote ? "quote_required" : "not_calculated",
      marketPublicationId: primaryPublication.id,
      projectedAt: now,
      projectionVersion: { increment: 1 },
    },
    where: { id: listing.id },
  });

  return false;
};

const appendRevision = async (
  tx: Prisma.TransactionClient,
  input: {
    inventorySourceId: string;
    normalizationVersion: string;
    normalizedPayload: unknown;
    payloadHash: string;
    rawPayload: unknown;
    revision: number;
    sourceRecordId: string;
    sourceUpdatedAt?: Date;
    sourceVersion?: string;
    syncRunId: string;
    validationErrors?: unknown;
    validationState: "valid" | "invalid" | "quarantined";
  },
  now: Date
) =>
  tx.sourceInventoryRevision.create({
    data: {
      inventorySourceId: input.inventorySourceId,
      normalizationVersion: input.normalizationVersion,
      normalizedPayload: toInputJson(input.normalizedPayload),
      payloadHash: input.payloadHash,
      rawPayload: toRawInputJson(input.rawPayload),
      rawPayloadExpiresAt: addDays(now, RAW_PAYLOAD_RETENTION_DAYS),
      receivedAt: now,
      revision: input.revision,
      sourceRecordId: input.sourceRecordId,
      sourceUpdatedAt: input.sourceUpdatedAt,
      sourceVersion: input.sourceVersion,
      syncRunId: input.syncRunId,
      validationErrors:
        input.validationErrors === undefined
          ? undefined
          : toInputJson(input.validationErrors),
      validationState: input.validationState,
    },
  });

const getQuarantineExternalRecordKey = (
  externalId: string | undefined,
  runId: string,
  rowNumber: number
) => {
  const candidate = externalId?.slice(0, 240);

  return candidate && !candidate.includes("\0")
    ? candidate
    : `quarantine:${runId}:${rowNumber}`;
};

const quarantineRecord = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  runId: string,
  input: QuarantinedInventoryRecord,
  now: Date,
  suspendLastGood = false
) => {
  const externalRecordKey = getQuarantineExternalRecordKey(
    input.externalId,
    runId,
    input.rowNumber
  );
  const payloadHash = hashInventoryPayload(input.raw);
  const existing = await tx.sourceInventoryRecord.findUnique({
    include: {
      offer: true,
      revisions: { orderBy: { revision: "desc" }, take: 1 },
    },
    where: {
      inventorySourceId_externalRecordKey: {
        externalRecordKey,
        inventorySourceId: source.id,
      },
    },
  });
  const nextRevision = existing ? existing.currentRevision + 1 : 1;
  const shouldAppendRevision =
    !existing || existing.revisions[0]?.payloadHash !== payloadHash;
  const sourceRecord = existing
    ? await tx.sourceInventoryRecord.update({
        data: {
          currentRevision: shouldAppendRevision
            ? nextRevision
            : existing.currentRevision,
          lastSeenAt: now,
          lastSeenSyncRunId: runId,
          quarantinedAt: now,
        },
        where: { id: existing.id },
      })
    : await tx.sourceInventoryRecord.create({
        data: {
          currentRevision: 1,
          externalRecordKey,
          firstSeenAt: now,
          inventorySourceId: source.id,
          lastSeenAt: now,
          lastSeenSyncRunId: runId,
          quarantinedAt: now,
          status: "quarantined",
          supplierOrgId: source.supplierOrgId,
        },
      });

  if (shouldAppendRevision) {
    await appendRevision(
      tx,
      {
        inventorySourceId: source.id,
        normalizationVersion: "automarket.inventory.v1",
        normalizedPayload: {},
        payloadHash,
        rawPayload: input.raw,
        revision: nextRevision,
        sourceRecordId: sourceRecord.id,
        syncRunId: runId,
        validationErrors: input.issues,
        validationState: "invalid",
      },
      now
    );
  }

  await tx.inventorySyncIssue.createMany({
    data: input.issues.map((issue) => ({
      errorCode: "record_validation_failed",
      externalRecordKey,
      fieldPath: issue.path || undefined,
      inventorySourceId: source.id,
      message: issue.message,
      rowNumber: input.rowNumber,
      severity: "blocking" as const,
      sourceRecordId: sourceRecord.id,
      syncRunId: runId,
    })),
  });

  let unpublished = false;

  if (suspendLastGood && existing?.offer) {
    await tx.inventoryOffer.update({
      data: { status: "quarantined", version: { increment: 1 } },
      where: { id: existing.offer.id },
    });
    unpublished = await pauseOfferPublications(
      tx,
      existing.offer.id,
      "required_data_missing",
      now
    );
  }

  return unpublished;
};

const processWithdrawal = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  runId: string,
  record: Extract<InventoryRecord, { operation: "withdraw" }>,
  rawRecord: unknown,
  now: Date,
  confirmationAt: Date
) => {
  const payloadHash = hashInventoryPayload(rawRecord);
  const existing = await tx.sourceInventoryRecord.findUnique({
    include: { offer: true },
    where: {
      inventorySourceId_externalRecordKey: {
        externalRecordKey: record.externalId,
        inventorySourceId: source.id,
      },
    },
  });
  const sourceUpdatedAt = new Date(record.sourceUpdatedAt);

  if (existing?.sourceUpdatedAt && sourceUpdatedAt < existing.sourceUpdatedAt) {
    await tx.sourceInventoryRecord.update({
      data: {
        lastSeenAt: now,
        lastSeenSyncRunId: runId,
      },
      where: { id: existing.id },
    });
    await tx.inventorySyncIssue.create({
      data: {
        errorCode: "source_update_out_of_order",
        externalRecordKey: record.externalId,
        inventorySourceId: source.id,
        message: "An older source withdrawal was ignored.",
        severity: "warning",
        sourceRecordId: existing.id,
        syncRunId: runId,
      },
    });
    return {
      changed: false,
      rejected: false,
      unpublished: false,
    };
  }

  if (
    existing &&
    hasSameTimestampPayloadConflict({
      existingPayloadHash: existing.payloadHash,
      existingSourceUpdatedAt: existing.sourceUpdatedAt,
      incomingPayloadHash: payloadHash,
      incomingSourceUpdatedAt: sourceUpdatedAt,
    })
  ) {
    const unpublished = await quarantineRecord(
      tx,
      source,
      runId,
      {
        externalId: record.externalId,
        issues: [
          {
            message:
              "The same source timestamp arrived with different content.",
            path: "sourceUpdatedAt",
          },
        ],
        raw: rawRecord,
        rowNumber: 0,
      },
      now,
      true
    );
    return { changed: false, rejected: true, unpublished };
  }

  if (
    existing?.sourceVersion &&
    record.sourceVersion === existing.sourceVersion &&
    existing.payloadHash !== payloadHash
  ) {
    const unpublished = await quarantineRecord(
      tx,
      source,
      runId,
      {
        externalId: record.externalId,
        issues: [
          {
            message: "The same source version arrived with different content.",
            path: "sourceVersion",
          },
        ],
        raw: rawRecord,
        rowNumber: 0,
      },
      now,
      true
    );
    return { changed: false, rejected: true, unpublished };
  }

  if (
    record.externalOfferId &&
    existing?.offer &&
    record.externalOfferId !== existing.offer.externalOfferKey
  ) {
    const unpublished = await quarantineRecord(
      tx,
      source,
      runId,
      {
        externalId: record.externalId,
        issues: [
          {
            message: "The withdrawal referenced a different external offer.",
            path: "externalOfferId",
          },
        ],
        raw: rawRecord,
        rowNumber: 0,
      },
      now,
      true
    );
    return { changed: false, rejected: true, unpublished };
  }

  const recordChanged = !existing || existing.payloadHash !== payloadHash;
  const nextRevision = existing ? existing.currentRevision + 1 : 1;
  const sourceRecord = existing
    ? await tx.sourceInventoryRecord.update({
        data: {
          currentRevision:
            existing.payloadHash === payloadHash
              ? existing.currentRevision
              : nextRevision,
          lastConfirmedAt: confirmationAt,
          lastSeenAt: now,
          lastSeenSyncRunId: runId,
          payloadHash,
          sourceUpdatedAt,
          sourceVersion: record.sourceVersion,
          status: "tombstoned",
          tombstonedAt: now,
        },
        where: { id: existing.id },
      })
    : await tx.sourceInventoryRecord.create({
        data: {
          currentRevision: 1,
          externalRecordKey: record.externalId,
          firstSeenAt: now,
          inventorySourceId: source.id,
          lastConfirmedAt: confirmationAt,
          lastSeenAt: now,
          lastSeenSyncRunId: runId,
          payloadHash,
          sourceUpdatedAt,
          sourceVersion: record.sourceVersion,
          status: "tombstoned",
          supplierOrgId: source.supplierOrgId,
          tombstonedAt: now,
        },
      });

  if (recordChanged) {
    await appendRevision(
      tx,
      {
        inventorySourceId: source.id,
        normalizationVersion: "automarket.inventory.v1",
        normalizedPayload: record,
        payloadHash,
        rawPayload: rawRecord,
        revision: nextRevision,
        sourceRecordId: sourceRecord.id,
        sourceUpdatedAt,
        sourceVersion: record.sourceVersion,
        syncRunId: runId,
        validationState: "valid",
      },
      now
    );
  }

  if (existing?.offer) {
    await tx.inventoryOffer.update({
      data: {
        status: "withdrawn",
        version: { increment: 1 },
        withdrawnAt: now,
      },
      where: { id: existing.offer.id },
    });
    await tx.marketPublication.updateMany({
      data: {
        eligibilityDecision: "ineligible",
        eligibilityEvaluatedAt: now,
        eligibilityReasonCodes: ["offer_unavailable"],
        status: "withdrawn",
        version: { increment: 1 },
        withdrawnAt: now,
      },
      where: { supplierOfferId: existing.offer.id },
    });
    const unpublished = await pauseListingForOffer(
      tx,
      existing.offer.id,
      "source_withdrawal",
      now
    );
    return { changed: recordChanged, rejected: false, unpublished };
  }

  return { changed: recordChanged, rejected: false, unpublished: false };
};

const findInventoryRight = (
  source: SourceContext,
  record: InventoryUpsertRecord,
  marketId: string,
  now: Date
) =>
  source.rightsGrants.find(
    (grant) =>
      grant.category === record.vehicle.category &&
      grant.status === "active" &&
      grant.validFrom <= now &&
      (!grant.validUntil || grant.validUntil > now) &&
      (!grant.marketId || grant.marketId === marketId) &&
      (!grant.makeNormalized ||
        grant.makeNormalized === record.vehicle.make.trim().toLowerCase())
  ) ?? null;

const getMarketMedia = (
  record: InventoryUpsertRecord,
  market: Market,
  now: Date
) =>
  record.offer.media.filter(
    (item) =>
      item.rights.status === "authorized" &&
      (item.rights.territoryCountryCodes.length === 0 ||
        !market.countryCode ||
        item.rights.territoryCountryCodes.includes(market.countryCode)) &&
      (!item.rights.expiresAt || new Date(item.rights.expiresAt) > now)
  );

const getCapabilityStatuses = (source: SourceContext) =>
  Object.fromEntries(
    source.supplierOrg.capabilities.map((capability) => [
      capability.capabilityKey,
      { expiresAt: capability.expiresAt, status: capability.status },
    ])
  );

const getEarliestDate = (values: Array<Date | null | undefined>) =>
  values
    .filter((value): value is Date => Boolean(value))
    .sort((left, right) => left.getTime() - right.getTime())
    .at(0);

const findMarketPermission = (
  source: SourceContext,
  record: InventoryUpsertRecord,
  marketId: string,
  now: Date
) =>
  source.supplierOrg.marketPermissions.find(
    (permission) =>
      permission.marketId === marketId &&
      permission.category === record.vehicle.category &&
      permission.permissionKey === "inventory.publish" &&
      permission.validFrom <= now
  ) ?? null;

const getPublicationStatus = (isEligible: boolean, wasPublished: boolean) => {
  if (isEligible) {
    return "published" as const;
  }

  return wasPublished ? ("paused" as const) : ("pending_eligibility" as const);
};

interface OfferMarketEvaluationContext {
  capabilityStatuses: ReturnType<typeof getCapabilityStatuses>;
  currentKybStatus: ReturnType<typeof getCurrentOrganizationKybStatus>;
  now: Date;
  offer: InventoryOffer;
  record: InventoryUpsertRecord;
  source: SourceContext;
  supplierTrustStatus: ReturnType<typeof getLatestSupplierTrustStatus>;
  tx: Prisma.TransactionClient;
  vehicleIdentityStatus: "canonical" | "disputed" | "merged" | "provisional";
}

const evaluateOfferMarket = async (
  context: OfferMarketEvaluationContext,
  market: Market
) => {
  const {
    capabilityStatuses,
    currentKybStatus,
    now,
    offer,
    record,
    source,
    supplierTrustStatus,
    tx,
    vehicleIdentityStatus,
  } = context;
  const marketPermission = findMarketPermission(source, record, market.id, now);
  const inventoryRight = findInventoryRight(source, record, market.id, now);
  const marketMedia = getMarketMedia(record, market, now);
  const displayCurrency = toDisplayCurrency(
    record.offer.nativePrice.currencyCode
  );
  const displayAmount = toDisplayAmount(offer.priceAmountMinor);
  const eligibility = evaluatePublicationEligibility({
    capabilityStatuses,
    displayCurrencySupported: Boolean(
      displayCurrency && displayAmount !== null
    ),
    inventoryRight: inventoryRight
      ? {
          expiresAt: inventoryRight.validUntil,
          status: inventoryRight.status,
        }
      : null,
    marketPermission: marketPermission
      ? {
          expiresAt: marketPermission.validUntil,
          status: marketPermission.status,
        }
      : null,
    mediaRights: { status: source.mediaRightsStatus },
    moderationHold: false,
    now,
    offer: { freshUntil: offer.freshUntil, status: offer.status },
    organization: {
      active:
        !source.supplierOrg.deletedAt &&
        source.supplierOrg.onboardingStatus === "approved",
      kybStatus: currentKybStatus,
      supplierTrustStatus,
    },
    requiredDataComplete: marketMedia.length > 0,
    sourceStatus: source.status,
    vehicleIdentityStatus,
  });
  const existingPublication = await tx.marketPublication.findUnique({
    where: {
      supplierOfferId_marketId_channel: {
        channel: "public_marketplace",
        marketId: market.id,
        supplierOfferId: offer.id,
      },
    },
  });
  const isEligible = eligibility.decision === "eligible";
  const supplierTrustReview = source.supplierOrg.supplierTrust[0];
  const eligibilityExpiresAt = getEarliestDate([
    offer.freshUntil,
    currentKybStatus === "verified"
      ? source.supplierOrg.kybExpiresAt
      : undefined,
    supplierTrustStatus === "verified"
      ? supplierTrustReview?.expiresAt
      : undefined,
    ...source.supplierOrg.capabilities
      .filter((capability) =>
        requiredSupplierCapabilities.includes(
          capability.capabilityKey as (typeof requiredSupplierCapabilities)[number]
        )
      )
      .map((capability) => capability.expiresAt),
    inventoryRight?.validUntil,
    marketPermission?.validUntil,
    ...marketMedia.map((item) =>
      item.rights.expiresAt ? new Date(item.rights.expiresAt) : undefined
    ),
  ]);
  const landedCostStatus =
    market.countryCode &&
    market.countryCode !== record.offer.physicalLocation.countryCode
      ? ("quote_required" as const)
      : ("not_calculated" as const);
  const inputSnapshot = {
    capabilityStatuses,
    displayAmount,
    displayCurrency,
    eligibilityExpiresAt,
    inventoryRight: inventoryRight
      ? {
          id: inventoryRight.id,
          marketId: inventoryRight.marketId,
          status: inventoryRight.status,
          validFrom: inventoryRight.validFrom,
          validUntil: inventoryRight.validUntil,
        }
      : null,
    market: {
      countryCode: market.countryCode,
      id: market.id,
      status: market.status,
    },
    marketMedia: marketMedia.map((item) => ({
      rights: item.rights,
      url: item.url,
    })),
    marketPermission: marketPermission
      ? {
          id: marketPermission.id,
          status: marketPermission.status,
          validFrom: marketPermission.validFrom,
          validUntil: marketPermission.validUntil,
        }
      : null,
    offer: {
      freshUntil: offer.freshUntil,
      priceAmountMinor: offer.priceAmountMinor.toString(),
      priceCurrencyCode: offer.priceCurrencyCode,
      priceCurrencyExponent: offer.priceCurrencyExponent,
      status: offer.status,
      version: offer.version,
    },
    organization: {
      deletedAt: source.supplierOrg.deletedAt,
      kybExpiresAt: source.supplierOrg.kybExpiresAt,
      kybStatus: currentKybStatus,
      onboardingStatus: source.supplierOrg.onboardingStatus,
      supplierTrustExpiresAt: supplierTrustReview?.expiresAt,
      supplierTrustReviewId: supplierTrustReview?.id,
      supplierTrustStatus,
    },
    source: {
      id: source.id,
      mediaRightsStatus: source.mediaRightsStatus,
      status: source.status,
    },
    vehicleIdentityStatus,
  };
  const eligibilityInputHash = hashInventoryPayload(inputSnapshot);
  const publication = await tx.marketPublication.upsert({
    create: {
      channel: "public_marketplace",
      displayPriceAmountMinor: displayAmount,
      displayPriceCurrency: displayCurrency,
      eligibilityDecision: eligibility.decision,
      eligibilityEvaluatedAt: now,
      eligibilityExpiresAt,
      eligibilityInputHash,
      eligibilityPolicyVersion: PUBLICATION_POLICY_VERSION,
      eligibilityReasonCodes: eligibility.reasonCodes,
      freshUntil: offer.freshUntil,
      inventorySourceId: source.id,
      landedCostStatus,
      marketId: market.id,
      marketPermissionId: marketPermission?.id,
      inventoryRightsGrantId: inventoryRight?.id,
      nativePriceAmountMinor: offer.priceAmountMinor,
      nativePriceCurrencyCode: offer.priceCurrencyCode,
      nativePriceCurrencyExponent: offer.priceCurrencyExponent,
      offerVersion: offer.version,
      priceConversionStatus: displayCurrency ? "native" : "unavailable",
      publishedAt: isEligible ? now : undefined,
      status: getPublicationStatus(isEligible, false),
      supplierOfferId: offer.id,
      supplierOrgId: source.supplierOrgId,
    },
    update: {
      displayPriceAmountMinor: displayAmount,
      displayPriceCurrency: displayCurrency,
      eligibilityDecision: eligibility.decision,
      eligibilityEvaluatedAt: now,
      eligibilityExpiresAt,
      eligibilityInputHash,
      eligibilityPolicyVersion: PUBLICATION_POLICY_VERSION,
      eligibilityReasonCodes: eligibility.reasonCodes,
      freshUntil: offer.freshUntil,
      inventorySourceId: source.id,
      landedCostStatus,
      marketPermissionId: marketPermission?.id ?? null,
      inventoryRightsGrantId: inventoryRight?.id ?? null,
      nativePriceAmountMinor: offer.priceAmountMinor,
      nativePriceCurrencyCode: offer.priceCurrencyCode,
      nativePriceCurrencyExponent: offer.priceCurrencyExponent,
      offerVersion: offer.version,
      pausedAt: isEligible ? null : (existingPublication?.pausedAt ?? now),
      priceConversionStatus: displayCurrency ? "native" : "unavailable",
      publishedAt: isEligible
        ? (existingPublication?.publishedAt ?? now)
        : existingPublication?.publishedAt,
      status: getPublicationStatus(
        isEligible,
        existingPublication?.status === "published"
      ),
      version: { increment: 1 },
      withdrawnAt: isEligible ? null : existingPublication?.withdrawnAt,
    },
    where: {
      supplierOfferId_marketId_channel: {
        channel: "public_marketplace",
        marketId: market.id,
        supplierOfferId: offer.id,
      },
    },
  });

  await tx.publicationEligibilityEvaluation.upsert({
    create: {
      decision: eligibility.decision,
      expiresAt: eligibilityExpiresAt,
      inputHash: eligibilityInputHash,
      inputSnapshot: toInputJson(inputSnapshot),
      marketPublicationId: publication.id,
      policyVersion: PUBLICATION_POLICY_VERSION,
      reasonCodes: eligibility.reasonCodes,
    },
    update: {},
    where: {
      marketPublicationId_policyVersion_inputHash: {
        inputHash: eligibilityInputHash,
        marketPublicationId: publication.id,
        policyVersion: PUBLICATION_POLICY_VERSION,
      },
    },
  });

  return {
    inventoryRightsGrantId: inventoryRight?.id,
    isEligible,
    market,
    publication,
  };
};

const evaluateOfferMarkets = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  offer: InventoryOffer,
  record: InventoryUpsertRecord,
  now: Date,
  vehicleIdentityStatus: "canonical" | "disputed" | "merged" | "provisional"
) => {
  const markets = await tx.market.findMany({
    where: {
      code: { in: record.offer.destinationMarketCodes },
      status: "active",
    },
  });
  const activeMarketIds = markets.map((market) => market.id);
  await tx.marketPublication.updateMany({
    data: {
      eligibilityDecision: "ineligible",
      eligibilityEvaluatedAt: now,
      eligibilityReasonCodes: ["market_not_active_or_requested"],
      pausedAt: now,
      status: "paused",
      version: { increment: 1 },
    },
    where: {
      channel: "public_marketplace",
      marketId:
        activeMarketIds.length > 0 ? { notIn: activeMarketIds } : undefined,
      status: "published",
      supplierOfferId: offer.id,
    },
  });
  const capabilityStatuses = getCapabilityStatuses(source);
  const currentKybStatus = getCurrentOrganizationKybStatus(source, now);
  const supplierTrustStatus = getLatestSupplierTrustStatus(source, now);
  const eligible: Array<{
    inventoryRightsGrantId?: string;
    market: Market;
    publication: MarketPublication;
  }> = [];
  let inventoryRightsGrantId: string | undefined;
  const context: OfferMarketEvaluationContext = {
    capabilityStatuses,
    currentKybStatus,
    now,
    offer,
    record,
    source,
    supplierTrustStatus,
    tx,
    vehicleIdentityStatus,
  };

  for (const market of markets) {
    const result = await evaluateOfferMarket(context, market);
    inventoryRightsGrantId ??= result.inventoryRightsGrantId;

    if (result.isEligible) {
      eligible.push({
        inventoryRightsGrantId: result.inventoryRightsGrantId,
        market: result.market,
        publication: result.publication,
      });
    }
  }

  return {
    eligible,
    inventoryRightsGrantId,
    supplierKybStatus: currentKybStatus,
    supplierTrustStatus,
  };
};

const syncListingImages = async (
  tx: Prisma.TransactionClient,
  listingId: string,
  record: InventoryUpsertRecord,
  media: InventoryUpsertRecord["offer"]["media"]
) => {
  const images = media
    .sort((left, right) => left.position - right.position)
    .map((item, position) => ({
      alt: item.alt || record.offer.title,
      listingId,
      position,
      storageProvider: "external",
      url: item.url,
    }));

  await tx.marketplaceListingImage.deleteMany({ where: { listingId } });
  if (images.length > 0) {
    await tx.marketplaceListingImage.createMany({ data: images });
  }
};

const projectPublicListing = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  offer: InventoryOffer,
  record: InventoryUpsertRecord,
  marketResult: Awaited<ReturnType<typeof evaluateOfferMarkets>>,
  canonicalVehicleId: string,
  now: Date
) => {
  const primaryEligiblePublication = marketResult.eligible.at(0);

  if (!primaryEligiblePublication) {
    const unpublished = await pauseListingForOffer(
      tx,
      offer.id,
      "publication_ineligible",
      now
    );
    return { projected: false, unpublished };
  }

  const displayCurrency = toDisplayCurrency(offer.priceCurrencyCode);
  const displayAmount = toDisplayAmount(offer.priceAmountMinor);
  if (!(displayCurrency && displayAmount !== null)) {
    return { projected: false, unpublished: false };
  }

  const deliveryCountryCodes = Array.from(
    new Set(
      marketResult.eligible
        .map(({ market }) => market.countryCode)
        .filter((value): value is string => Boolean(value))
    )
  );
  const projectionMedia = record.offer.media.filter((item) => {
    if (item.rights.status !== "authorized") {
      return false;
    }
    if (item.rights.expiresAt && new Date(item.rights.expiresAt) <= now) {
      return false;
    }
    if (item.rights.territoryCountryCodes.length === 0) {
      return true;
    }
    if (deliveryCountryCodes.length === 0) {
      return false;
    }
    return deliveryCountryCodes.every((countryCode) =>
      item.rights.territoryCountryCodes.includes(countryCode)
    );
  });

  if (projectionMedia.length === 0) {
    const publicationIds = marketResult.eligible.map(
      ({ publication }) => publication.id
    );
    await tx.marketPublication.updateMany({
      data: {
        eligibilityDecision: "ineligible",
        eligibilityEvaluatedAt: now,
        eligibilityReasonCodes: ["media_rights_invalid"],
        pausedAt: now,
        status: "paused",
        version: { increment: 1 },
      },
      where: { id: { in: publicationIds } },
    });
    const unpublished = await pauseListingForOffer(
      tx,
      offer.id,
      "media_rights_invalid",
      now
    );
    return { projected: false, unpublished };
  }
  const primaryPublication = primaryEligiblePublication.publication;
  const existing = await tx.marketplaceListing.findUnique({
    include: {
      statusEvents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    where: { inventoryOfferId: offer.id },
  });
  const reversiblePauseReasons = new Set([
    "authorization_expired",
    "authorization_revoked",
    "media_rights_invalid",
    "offer_stale",
    "offer_unavailable",
    "publication_ineligible",
    "source_withdrawal",
  ]);
  const canReactivate = Boolean(
    existing?.status === "paused" &&
      existing.statusEvents[0]?.reasonCode &&
      reversiblePauseReasons.has(existing.statusEvents[0].reasonCode)
  );
  const baseSlug = slugify(record.offer.title) || "vehicle";
  const slug = `${baseSlug}-${offer.id.slice(-8)}`;
  const landedCostStatus = marketResult.eligible.some(
    ({ market }) =>
      market.countryCode &&
      market.countryCode !== record.offer.physicalLocation.countryCode
  )
    ? ("quote_required" as const)
    : ("not_calculated" as const);
  const projectionInputHash = hashInventoryPayload({
    deliveryCountryCodes,
    offerId: offer.id,
    offerVersion: offer.version,
    publicationIds: marketResult.eligible.map(
      ({ publication }) => publication.id
    ),
  });
  const commonData = {
    badges: ["used"],
    bodyType: record.vehicle.bodyType,
    canonicalVehicleId,
    category: record.vehicle.category,
    colorExterior: record.vehicle.colorExterior,
    dealerOrgId: source.supplierOrgId,
    deliveryCountryCodes,
    description: record.offer.description,
    documentCount: 0,
    freshUntil: offer.freshUntil,
    fuelType: record.vehicle.fuelType,
    inventoryOfferId: offer.id,
    landedCostStatus,
    locationCity: record.offer.physicalLocation.city,
    locationCountry: getIsoCountryName(
      record.offer.physicalLocation.countryCode
    ),
    locationRegion: record.offer.physicalLocation.region,
    make: record.vehicle.make,
    marketPublicationId: primaryPublication.id,
    mileageUnit: record.offer.mileage.unit,
    mileageValue: record.offer.mileage.value,
    model: record.vehicle.model,
    nativePriceAmountMinor: offer.priceAmountMinor,
    nativePriceCurrencyCode: offer.priceCurrencyCode,
    nativePriceCurrencyExponent: offer.priceCurrencyExponent,
    originCountryCode: record.offer.physicalLocation.countryCode,
    priceAmountMinor: displayAmount,
    priceConversionStatus: "native" as const,
    priceCurrency: displayCurrency,
    priceType: "fixed" as const,
    projectedAt: now,
    projectionInputHash,
    sellerCity: source.supplierOrg.city ?? record.offer.physicalLocation.city,
    sellerDisplayName: source.supplierOrg.displayName,
    sellerId: source.supplierOrgId,
    sellerType: "dealer" as const,
    sellerVerificationStatus: source.supplierOrg.verificationStatus,
    sourceDisplayName: source.name,
    sourceExternalReference: record.externalId,
    sourceKind: source.kind,
    sourceLastConfirmedAt: offer.lastConfirmedAt,
    sourceUpdatedAt: new Date(record.sourceUpdatedAt),
    submittedAt: existing?.submittedAt ?? now,
    supplierKybStatus: marketResult.supplierKybStatus,
    supplierOrgType: source.supplierOrg.orgType,
    supplierTrustStatus: marketResult.supplierTrustStatus,
    title: record.offer.title,
    transmission: record.vehicle.transmission,
    derivative: record.vehicle.derivative,
    trim: record.vehicle.trim,
    vin: record.vehicle.vin,
    vinLast4: record.vehicle.vin?.slice(-4),
    year: record.vehicle.year,
  };
  const listing = existing
    ? await tx.marketplaceListing.update({
        data: {
          ...commonData,
          pausedAt: canReactivate ? null : existing.pausedAt,
          projectionVersion: { increment: 1 },
          publishedAt: existing.publishedAt ?? now,
          status: canReactivate ? "active" : existing.status,
          statusChangedAt: canReactivate ? now : existing.statusChangedAt,
          version: { increment: 1 },
        },
        where: { id: existing.id },
      })
    : await tx.marketplaceListing.create({
        data: {
          ...commonData,
          projectionVersion: 1,
          publishedAt: now,
          slug,
          status: "active",
          statusChangedAt: now,
        },
      });

  await syncListingImages(tx, listing.id, record, projectionMedia);

  if (existing && canReactivate) {
    await tx.listingStatusEvent.create({
      data: {
        actorDealerOrgId: source.supplierOrgId,
        fromStatus: existing.status,
        listingId: existing.id,
        reasonCode: "inventory_projection_reactivated",
        toStatus: "active",
      },
    });
  }

  if (listing.status !== "active") {
    await tx.marketPublication.updateMany({
      data: {
        eligibilityDecision: "ineligible",
        eligibilityEvaluatedAt: now,
        eligibilityReasonCodes: ["moderation_hold"],
        pausedAt: now,
        status: "paused",
        version: { increment: 1 },
      },
      where: {
        id: {
          in: marketResult.eligible.map(({ publication }) => publication.id),
        },
      },
    });
    return { projected: false, unpublished: false };
  }

  return { projected: true, unpublished: false };
};

const quarantineRecordConflict = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  runId: string,
  record: InventoryUpsertRecord,
  rawRecord: unknown,
  message: string,
  path: string,
  now: Date
) =>
  quarantineRecord(
    tx,
    source,
    runId,
    {
      externalId: record.externalId,
      issues: [{ message, path }],
      raw: rawRecord,
      rowNumber: 0,
    },
    now,
    true
  );

const isOutOfOrderSourceMutation = (
  existingSourceUpdatedAt: Date | null | undefined,
  incomingSourceUpdatedAt: Date
) =>
  Boolean(
    existingSourceUpdatedAt && incomingSourceUpdatedAt < existingSourceUpdatedAt
  );

const hasSourceVersionConflict = (
  existing: { payloadHash: string | null; sourceVersion: string | null },
  incomingSourceVersion: string | undefined,
  incomingPayloadHash: string
) =>
  Boolean(
    existing.sourceVersion &&
      incomingSourceVersion === existing.sourceVersion &&
      existing.payloadHash !== incomingPayloadHash
  );

const getSourceMutationConflict = (
  existing: {
    payloadHash: string | null;
    sourceUpdatedAt: Date | null;
    sourceVersion: string | null;
  },
  incoming: {
    payloadHash: string;
    sourceUpdatedAt: Date;
    sourceVersion: string | undefined;
  }
) => {
  if (
    hasSameTimestampPayloadConflict({
      existingPayloadHash: existing.payloadHash,
      existingSourceUpdatedAt: existing.sourceUpdatedAt,
      incomingPayloadHash: incoming.payloadHash,
      incomingSourceUpdatedAt: incoming.sourceUpdatedAt,
    })
  ) {
    return {
      message: "The same source timestamp arrived with different content.",
      path: "sourceUpdatedAt",
    };
  }
  if (
    hasSourceVersionConflict(
      existing,
      incoming.sourceVersion,
      incoming.payloadHash
    )
  ) {
    return {
      message: "The same source version arrived with different content.",
      path: "sourceVersion",
    };
  }
  return null;
};

const hasImmutableVinConflict = (
  existingVin: string | null | undefined,
  incomingVin: string | undefined
) => Boolean(existingVin && existingVin !== (incomingVin ?? null));

const normalizeIdentityValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const hasCanonicalIdentityConflict = (
  existing: {
    category: string;
    identityStatus: string;
    make: string;
    model: string;
    year: number;
  },
  record: InventoryUpsertRecord
) =>
  existing.identityStatus === "disputed" ||
  existing.identityStatus === "merged" ||
  existing.category !== record.vehicle.category ||
  existing.year !== record.vehicle.year ||
  normalizeIdentityValue(existing.make) !==
    normalizeIdentityValue(record.vehicle.make) ||
  normalizeIdentityValue(existing.model) !==
    normalizeIdentityValue(record.vehicle.model);

const pauseCanonicalVehiclePublications = async (
  tx: Prisma.TransactionClient,
  canonicalVehicleId: string,
  now: Date
) => {
  const offers = await tx.inventoryOffer.findMany({
    select: { id: true },
    where: { canonicalVehicleId },
  });
  let unpublished = false;

  for (const offer of offers) {
    unpublished =
      (await pauseOfferPublications(
        tx,
        offer.id,
        "vehicle_identity_disputed",
        now
      )) || unpublished;
  }

  return unpublished;
};

const quarantineExternalOfferOwnershipConflict = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  runId: string,
  record: InventoryUpsertRecord,
  rawRecord: unknown,
  currentSourceRecordId: string | undefined,
  now: Date
) => {
  const owner = await tx.inventoryOffer.findUnique({
    select: { sourceRecordId: true },
    where: {
      inventorySourceId_externalOfferKey: {
        externalOfferKey: record.offer.externalOfferId,
        inventorySourceId: source.id,
      },
    },
  });
  if (!owner || owner.sourceRecordId === currentSourceRecordId) {
    return null;
  }

  const unpublished = await quarantineRecordConflict(
    tx,
    source,
    runId,
    record,
    rawRecord,
    "The external offer ID is already owned by another source record.",
    "offer.externalOfferId",
    now
  );
  return {
    changed: false,
    projected: false,
    rejected: true,
    unpublished,
  };
};

const processUpsert = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  runId: string,
  record: InventoryUpsertRecord,
  rawRecord: unknown,
  now: Date,
  confirmationAt: Date
) => {
  const payloadHash = hashInventoryPayload(rawRecord);
  const sourceUpdatedAt = new Date(record.sourceUpdatedAt);
  const existing = await tx.sourceInventoryRecord.findUnique({
    include: {
      canonicalVehicle: true,
      offer: true,
      revisions: { orderBy: { revision: "desc" }, take: 1 },
    },
    where: {
      inventorySourceId_externalRecordKey: {
        externalRecordKey: record.externalId,
        inventorySourceId: source.id,
      },
    },
  });

  if (
    existing &&
    isOutOfOrderSourceMutation(existing.sourceUpdatedAt, sourceUpdatedAt)
  ) {
    await tx.sourceInventoryRecord.update({
      data: {
        lastSeenAt: now,
        lastSeenSyncRunId: runId,
      },
      where: { id: existing.id },
    });
    await tx.inventorySyncIssue.create({
      data: {
        errorCode: "source_update_out_of_order",
        externalRecordKey: record.externalId,
        inventorySourceId: source.id,
        message: "An older source update was ignored.",
        severity: "warning",
        sourceRecordId: existing.id,
        syncRunId: runId,
      },
    });
    return {
      changed: false,
      projected: false,
      rejected: false,
      unpublished: false,
    };
  }

  const sourceMutationConflict = existing
    ? getSourceMutationConflict(existing, {
        payloadHash,
        sourceUpdatedAt,
        sourceVersion: record.sourceVersion,
      })
    : null;
  if (sourceMutationConflict) {
    const unpublished = await quarantineRecordConflict(
      tx,
      source,
      runId,
      record,
      rawRecord,
      sourceMutationConflict.message,
      sourceMutationConflict.path,
      now
    );
    return {
      changed: false,
      projected: false,
      rejected: true,
      unpublished,
    };
  }

  if (
    hasImmutableVinConflict(
      existing?.canonicalVehicle?.vinNormalized,
      record.vehicle.vin
    )
  ) {
    const unpublished = await quarantineRecordConflict(
      tx,
      source,
      runId,
      record,
      rawRecord,
      "A source update attempted to replace an immutable VIN.",
      "vehicle.vin",
      now
    );
    return {
      changed: false,
      projected: false,
      rejected: true,
      unpublished,
    };
  }

  const offerOwnershipConflict = await quarantineExternalOfferOwnershipConflict(
    tx,
    source,
    runId,
    record,
    rawRecord,
    existing?.id,
    now
  );
  if (offerOwnershipConflict) {
    return offerOwnershipConflict;
  }

  const canonicalKey = getCanonicalVehicleKey(source.sourceKey, record);
  const existingCanonicalVehicle = await tx.canonicalVehicle.findUnique({
    where: { canonicalKey },
  });

  if (
    existingCanonicalVehicle &&
    hasCanonicalIdentityConflict(existingCanonicalVehicle, record)
  ) {
    await tx.canonicalVehicle.update({
      data: { identityStatus: "disputed" },
      where: { id: existingCanonicalVehicle.id },
    });
    await quarantineRecordConflict(
      tx,
      source,
      runId,
      record,
      rawRecord,
      "A VIN-matched canonical vehicle has conflicting identity fields.",
      "vehicle",
      now
    );
    const unpublished = await pauseCanonicalVehiclePublications(
      tx,
      existingCanonicalVehicle.id,
      now
    );
    return {
      changed: false,
      projected: false,
      rejected: true,
      unpublished,
    };
  }

  const contentChanged = !existing || existing.payloadHash !== payloadHash;
  const shouldAppendRevision =
    !existing ||
    existing.revisions[0]?.payloadHash !== payloadHash ||
    existing.revisions[0]?.validationState !== "valid";
  const recordChanged = contentChanged || Boolean(existing?.quarantinedAt);
  const nextRevision = existing ? existing.currentRevision + 1 : 1;
  const sourceRecord = existing
    ? await tx.sourceInventoryRecord.update({
        data: {
          consecutiveMissingRuns: 0,
          currentRevision: shouldAppendRevision
            ? nextRevision
            : existing.currentRevision,
          lastConfirmedAt: confirmationAt,
          lastSeenAt: now,
          lastSeenSyncRunId: runId,
          missingSinceAt: null,
          normalizationVersion: "automarket.inventory.v1",
          payloadHash,
          quarantinedAt: null,
          sourceUpdatedAt,
          sourceVersion: record.sourceVersion,
          status: "normalized",
          tombstonedAt: null,
        },
        where: { id: existing.id },
      })
    : await tx.sourceInventoryRecord.create({
        data: {
          currentRevision: 1,
          externalRecordKey: record.externalId,
          firstSeenAt: now,
          inventorySourceId: source.id,
          lastConfirmedAt: confirmationAt,
          lastSeenAt: now,
          lastSeenSyncRunId: runId,
          normalizationVersion: "automarket.inventory.v1",
          payloadHash,
          sourceUpdatedAt,
          sourceVersion: record.sourceVersion,
          status: "normalized",
          supplierOrgId: source.supplierOrgId,
        },
      });

  if (shouldAppendRevision) {
    await appendRevision(
      tx,
      {
        inventorySourceId: source.id,
        normalizationVersion: "automarket.inventory.v1",
        normalizedPayload: record,
        payloadHash,
        rawPayload: rawRecord,
        revision: nextRevision,
        sourceRecordId: sourceRecord.id,
        sourceUpdatedAt,
        sourceVersion: record.sourceVersion,
        syncRunId: runId,
        validationState: "valid",
      },
      now
    );
  }

  const canonicalVehicle = await tx.canonicalVehicle.upsert({
    create: {
      bodyType: record.vehicle.bodyType,
      canonicalKey,
      category: record.vehicle.category,
      colorExterior: record.vehicle.colorExterior,
      derivative: record.vehicle.derivative,
      fuelType: record.vehicle.fuelType,
      identityStatus: record.vehicle.vin ? "canonical" : "provisional",
      make: record.vehicle.make,
      model: record.vehicle.model,
      transmission: record.vehicle.transmission,
      trim: record.vehicle.trim,
      vinLast4: record.vehicle.vin?.slice(-4),
      vinNormalized: record.vehicle.vin,
      year: record.vehicle.year,
    },
    update: {
      bodyType: record.vehicle.bodyType,
      canonicalRevision: { increment: contentChanged ? 1 : 0 },
      colorExterior: record.vehicle.colorExterior,
      derivative: record.vehicle.derivative,
      fuelType: record.vehicle.fuelType,
      make: record.vehicle.make,
      model: record.vehicle.model,
      transmission: record.vehicle.transmission,
      trim: record.vehicle.trim,
      vinLast4: record.vehicle.vin?.slice(-4),
      vinNormalized: record.vehicle.vin,
      year: record.vehicle.year,
    },
    where: { canonicalKey },
  });

  await tx.sourceInventoryRecord.update({
    data: { canonicalVehicleId: canonicalVehicle.id },
    where: { id: sourceRecord.id },
  });

  const freshUntil = addMinutes(confirmationAt, source.staleAfterMinutes);
  const priceAmountMinor = BigInt(record.offer.nativePrice.amountMinor);
  const offer = await tx.inventoryOffer.upsert({
    create: {
      canonicalVehicleId: canonicalVehicle.id,
      description: record.offer.description,
      externalOfferKey: record.offer.externalOfferId,
      firstSeenAt: now,
      freshUntil,
      inventorySourceId: source.id,
      lastConfirmedAt: confirmationAt,
      lastSeenAt: now,
      localizedContent: toInputJson({
        en: {
          description: record.offer.description,
          title: record.offer.title,
        },
      }),
      media: toInputJson(record.offer.media),
      mileageUnit: record.offer.mileage.unit,
      mileageValue: record.offer.mileage.value,
      physicalCity: record.offer.physicalLocation.city,
      physicalCountry: getIsoCountryName(
        record.offer.physicalLocation.countryCode
      ),
      physicalCountryCode: record.offer.physicalLocation.countryCode,
      physicalRegion: record.offer.physicalLocation.region,
      priceAmountMinor,
      priceCurrencyCode: record.offer.nativePrice.currencyCode,
      priceCurrencyExponent: record.offer.nativePrice.exponent,
      sourceRecordId: sourceRecord.id,
      sourceUpdatedAt,
      status: record.offer.status,
      stockNumber: record.offer.stockNumber,
      supplierOrgId: source.supplierOrgId,
      taxTreatment: record.offer.taxTreatment,
      title: record.offer.title,
    },
    update: {
      canonicalVehicleId: canonicalVehicle.id,
      description: record.offer.description,
      freshUntil,
      lastConfirmedAt: confirmationAt,
      lastSeenAt: now,
      localizedContent: toInputJson({
        en: {
          description: record.offer.description,
          title: record.offer.title,
        },
      }),
      media: toInputJson(record.offer.media),
      mileageUnit: record.offer.mileage.unit,
      mileageValue: record.offer.mileage.value,
      physicalCity: record.offer.physicalLocation.city,
      physicalCountry: getIsoCountryName(
        record.offer.physicalLocation.countryCode
      ),
      physicalCountryCode: record.offer.physicalLocation.countryCode,
      physicalRegion: record.offer.physicalLocation.region,
      priceAmountMinor,
      priceCurrencyCode: record.offer.nativePrice.currencyCode,
      priceCurrencyExponent: record.offer.nativePrice.exponent,
      sourceUpdatedAt,
      staleAt: null,
      status: record.offer.status,
      stockNumber: record.offer.stockNumber,
      taxTreatment: record.offer.taxTreatment,
      title: record.offer.title,
      version: { increment: contentChanged ? 1 : 0 },
      withdrawnAt: null,
    },
    where: { sourceRecordId: sourceRecord.id },
  });
  const marketResult = await evaluateOfferMarkets(
    tx,
    source,
    offer,
    record,
    now,
    canonicalVehicle.identityStatus
  );

  await tx.inventoryOffer.update({
    data: {
      inventoryRightsGrantId: marketResult.inventoryRightsGrantId ?? null,
    },
    where: { id: offer.id },
  });

  const projection = await projectPublicListing(
    tx,
    source,
    offer,
    record,
    marketResult,
    canonicalVehicle.id,
    now
  );

  return {
    changed: recordChanged,
    projected: projection.projected,
    rejected: false,
    unpublished: projection.unpublished,
  };
};

const reconcileSnapshotAbsence = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  marker:
    | { readonly kind: "run"; readonly runId: string }
    | { readonly kind: "snapshot"; readonly snapshotToken: string },
  now: Date
) => {
  const batchSize = 250;
  let unpublishedCount = 0;
  let heldCount = 0;
  let missingCount = 0;
  let wouldUnpublishCount = 0;
  let lastRecordId: string | undefined;

  while (true) {
    const missingRecords = await tx.sourceInventoryRecord.findMany({
      orderBy: { id: "asc" },
      select: {
        consecutiveMissingRuns: true,
        id: true,
        lastSeenAt: true,
        missingSinceAt: true,
        offer: { select: { id: true } },
      },
      take: batchSize,
      where: {
        inventorySourceId: source.id,
        ...(lastRecordId ? { id: { gt: lastRecordId } } : {}),
        OR:
          marker.kind === "run"
            ? [
                { lastSeenSyncRunId: null },
                { lastSeenSyncRunId: { not: marker.runId } },
              ]
            : [
                { lastSeenSnapshotToken: null },
                { lastSeenSnapshotToken: { not: marker.snapshotToken } },
              ],
        status: "normalized",
      },
    });
    if (missingRecords.length === 0) {
      break;
    }

    const withdrawnRecords = missingRecords.filter((record) =>
      shouldReconcileMissingRecord({
        complete: true,
        consecutiveMissingRuns: record.consecutiveMissingRuns,
        lastSeenAt: record.lastSeenAt,
        missingGraceRuns: source.missingGraceRuns,
        mode: "full_snapshot",
        now,
        runStatus: "completed",
      })
    );
    const recordIds = missingRecords.map(({ id }) => id);
    await tx.sourceInventoryRecord.updateMany({
      data: {
        consecutiveMissingRuns: { increment: 1 },
      },
      where: { id: { in: recordIds }, status: "normalized" },
    });
    const firstMissingRecordIds = missingRecords
      .filter(({ missingSinceAt }) => missingSinceAt === null)
      .map(({ id }) => id);
    if (firstMissingRecordIds.length > 0) {
      await tx.sourceInventoryRecord.updateMany({
        data: { missingSinceAt: now },
        where: {
          id: { in: firstMissingRecordIds },
          missingSinceAt: null,
          status: "normalized",
        },
      });
    }
    const withdrawnRecordIds = withdrawnRecords.map(({ id }) => id);
    if (withdrawnRecordIds.length > 0) {
      await tx.sourceInventoryRecord.updateMany({
        data: { status: "missing" },
        where: { id: { in: withdrawnRecordIds }, status: "normalized" },
      });
    }

    const withdrawnOfferIds = Array.from(
      new Set(
        withdrawnRecords.flatMap(({ offer }) => (offer ? [offer.id] : []))
      )
    );
    if (withdrawnOfferIds.length > 0) {
      await tx.inventoryOffer.updateMany({
        data: {
          staleAt: now,
          status: "stale",
          version: { increment: 1 },
        },
        where: { id: { in: withdrawnOfferIds } },
      });
      await tx.marketPublication.updateMany({
        data: {
          eligibilityDecision: "ineligible",
          eligibilityEvaluatedAt: now,
          eligibilityReasonCodes: ["offer_unavailable"],
          pausedAt: now,
          status: "paused",
          version: { increment: 1 },
        },
        where: {
          status: "published",
          supplierOfferId: { in: withdrawnOfferIds },
        },
      });
      const pausedListings = await tx.marketplaceListing.updateManyAndReturn({
        data: {
          pausedAt: now,
          status: "paused",
          statusChangedAt: now,
          version: { increment: 1 },
        },
        select: { dealerOrgId: true, id: true },
        where: {
          inventoryOfferId: { in: withdrawnOfferIds },
          status: "active",
        },
      });
      if (pausedListings.length > 0) {
        await tx.listingStatusEvent.createMany({
          data: pausedListings.map((listing) => ({
            actorDealerOrgId: listing.dealerOrgId,
            fromStatus: "active" as const,
            listingId: listing.id,
            reasonCode: "offer_unavailable",
            toStatus: "paused" as const,
          })),
        });
      }
      unpublishedCount += pausedListings.length;
      wouldUnpublishCount += pausedListings.length;
    }

    heldCount += missingRecords.length - withdrawnRecords.length;
    missingCount += missingRecords.length;
    lastRecordId = missingRecords.at(-1)?.id;
    if (missingRecords.length < batchSize) {
      break;
    }
  }

  return {
    heldCount,
    missingCount,
    unpublishedCount,
    wouldUnpublishCount,
  };
};

export const reconcileInventoryImportSnapshotAbsence = async (
  tx: Prisma.TransactionClient,
  input: {
    readonly importSessionId: string;
    readonly inventorySourceId: string;
    readonly leaseToken: string;
    readonly now: Date;
    readonly snapshotToken: string;
  }
) => {
  const session = await tx.inventoryImportSession.findFirst({
    include: { inventorySource: true },
    where: {
      absenceReconciledAt: null,
      completeSnapshot: true,
      fullSnapshotAcknowledgedAt: { not: null },
      id: input.importSessionId,
      inventorySourceId: input.inventorySourceId,
      mode: "full_snapshot",
      quarantinedRowCount: 0,
      snapshotToken: input.snapshotToken,
      status: "applying",
    },
  });
  if (
    !session ||
    session.applyDataRevision !== session.inventorySource.dataRevision ||
    session.inventorySource.applyLeaseSessionId !== session.id ||
    session.inventorySource.applyLeaseToken !== input.leaseToken ||
    !session.inventorySource.applyLeaseExpiresAt ||
    session.inventorySource.applyLeaseExpiresAt <= input.now
  ) {
    throw new InventorySourceLeasedError(
      "Inventory import absence reconciliation authority is stale"
    );
  }
  const fenced = await tx.inventoryImportSession.updateMany({
    data: { absenceReconciledAt: input.now },
    where: {
      absenceReconciledAt: null,
      id: session.id,
      status: "applying",
      version: session.version,
    },
  });
  if (fenced.count !== 1) {
    throw new InventorySourceLeasedError(
      "Inventory import absence reconciliation already ran"
    );
  }
  const source = await tx.inventorySource.findUniqueOrThrow({
    include: sourceContextInclude,
    where: { id: input.inventorySourceId },
  });
  assertSourceCanIngest(source, "full_snapshot");
  return reconcileSnapshotAbsence(
    tx,
    source,
    { kind: "snapshot", snapshotToken: input.snapshotToken },
    input.now
  );
};

export const getInventorySourceAuthorizationContext = async (
  sourceKey: string,
  client: PrismaClient = database
) => {
  const source = await client.inventorySource.findFirst({
    select: {
      credentialReference: true,
      id: true,
      sourceKey: true,
      status: true,
      supplierOrgId: true,
    },
    where: { deletedAt: null, sourceKey },
  });

  return source;
};

export const recordInventoryIngressFailure = async (
  input: InventoryIngressFailureRequest,
  client: PrismaClient = database
) => {
  if (!SHA256_PATTERN.test(input.payloadSha256)) {
    throw new InventoryPayloadHashError(
      "Inventory payloadSha256 must be a lowercase SHA-256 digest"
    );
  }
  const source = await client.inventorySource.findFirst({
    select: { id: true, syncMode: true },
    where: {
      deletedAt: null,
      sourceKey: input.sourceKey,
      status: { in: ["active", "degraded"] },
      supplierOrg: { is: { deletedAt: null } },
    },
  });
  if (!source) {
    return null;
  }

  const existing = await client.inventorySyncRun.findUnique({
    select: { id: true, payloadSha256: true },
    where: {
      inventorySourceId_idempotencyKey: {
        idempotencyKey: input.idempotencyKey,
        inventorySourceId: source.id,
      },
    },
  });
  if (existing) {
    if (existing.payloadSha256 !== input.payloadSha256) {
      throw new InventoryIdempotencyConflictError(
        "The idempotency key was reused with different content"
      );
    }
    return { runId: existing.id, status: "failed" as const };
  }

  const now = new Date();
  try {
    return await client.$transaction(async (tx) => {
      const run = await tx.inventorySyncRun.create({
        data: {
          attemptCount: 1,
          completedAt: now,
          errorCode: input.errorCode.slice(0, 120),
          errorCount: 1,
          errorMessage:
            "The authenticated request failed before inventory application.",
          externalBatchId: `ingress:${input.idempotencyKey}`,
          idempotencyKey: input.idempotencyKey,
          inventorySourceId: source.id,
          mode: source.syncMode,
          payloadByteSize: input.payloadByteSize,
          payloadSha256: input.payloadSha256,
          schemaVersion: "unparsed",
          sourceGeneratedAt: now,
          status: "failed",
          trigger: input.trigger,
        },
      });
      await tx.inventorySyncIssue.create({
        data: {
          errorCode: input.errorCode.slice(0, 120),
          inventorySourceId: source.id,
          message: "The authenticated payload failed ingress validation.",
          severity: "blocking",
          syncRunId: run.id,
        },
      });
      await tx.inventorySource.updateMany({
        data: {
          consecutiveFailureCount: { increment: 1 },
          lastAttemptAt: now,
          status: "degraded",
        },
        where: {
          deletedAt: null,
          id: source.id,
          status: { in: ["active", "degraded"] },
          supplierOrg: { is: { deletedAt: null } },
        },
      });

      return { runId: run.id, status: "failed" as const };
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    const concurrent = await client.inventorySyncRun.findUnique({
      select: { id: true, payloadSha256: true },
      where: {
        inventorySourceId_idempotencyKey: {
          idempotencyKey: input.idempotencyKey,
          inventorySourceId: source.id,
        },
      },
    });
    if (!concurrent) {
      return null;
    }
    if (concurrent.payloadSha256 !== input.payloadSha256) {
      throw new InventoryIdempotencyConflictError(
        "The idempotency key was reused with different content"
      );
    }
    return { runId: concurrent.id, status: "failed" as const };
  }
};

const createEmptyCounters = (): IngestionCounters => ({
  changedCount: 0,
  missingCount: 0,
  projectedCount: 0,
  rejectedCount: 0,
  unchangedCount: 0,
  unpublishedCount: 0,
});

const assertSourceCanIngest = (
  source: SourceContext,
  mode: PreparedInventoryBatch["batch"]["mode"]
) => {
  if (
    source.deletedAt ||
    !(source.status === "active" || source.status === "degraded")
  ) {
    throw new InventorySourceUnavailableError("Inventory source is not active");
  }
  if (source.syncMode !== mode) {
    throw new InventorySourceModeMismatchError(
      "The batch mode does not match the inventory source configuration"
    );
  }
};

const processPreparedBatchRecords = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  runId: string,
  batch: PreparedInventoryBatch,
  now: Date,
  confirmationAt: Date
) => {
  const next = createEmptyCounters();

  for (const quarantined of batch.quarantinedRecords) {
    await quarantineRecord(tx, source, runId, quarantined, now);
    next.rejectedCount += 1;
  }

  for (const preparedRecord of batch.preparedRecords) {
    const record = preparedRecord.normalized;
    const result =
      record.operation === "withdraw"
        ? await processWithdrawal(
            tx,
            source,
            runId,
            record,
            preparedRecord.raw,
            now,
            confirmationAt
          )
        : await processUpsert(
            tx,
            source,
            runId,
            record,
            preparedRecord.raw,
            now,
            confirmationAt
          );

    next.changedCount += Number(result.changed);
    next.unchangedCount += Number(!(result.changed || result.rejected));
    next.rejectedCount += Number(result.rejected);
    next.unpublishedCount += Number(result.unpublished);
    next.projectedCount += Number("projected" in result && result.projected);
  }

  return next;
};

const rejectOutOfOrderBatch = async (
  tx: Prisma.TransactionClient,
  sourceId: string,
  runId: string,
  receivedCount: number,
  now: Date
) => {
  const ignored = createEmptyCounters();
  ignored.rejectedCount = receivedCount;

  await tx.inventorySyncIssue.create({
    data: {
      errorCode: "batch_out_of_order",
      inventorySourceId: sourceId,
      message: "An older inventory batch was ignored.",
      severity: "blocking",
      syncRunId: runId,
    },
  });
  await tx.inventorySyncRun.update({
    data: {
      ...ignored,
      completedAt: now,
      errorCount: 1,
      status: "completed_with_issues",
    },
    where: { id: runId },
  });

  return { ...ignored, status: "completed_with_issues" as const };
};

const validateBatchOrderingAndFreshness = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  input: InventoryIngestionRequest,
  runId: string,
  receivedCount: number,
  now: Date
) => {
  const sourceGeneratedAt = new Date(input.preparedBatch.batch.generatedAt);
  if (
    source.lastAppliedBatchGeneratedAt &&
    sourceGeneratedAt < source.lastAppliedBatchGeneratedAt
  ) {
    return {
      kind: "rejected" as const,
      rejection: await rejectOutOfOrderBatch(
        tx,
        source.id,
        runId,
        receivedCount,
        now
      ),
    };
  }

  const freshnessWindow = getInventoryFreshnessWindow({
    receivedAt: now,
    sourceGeneratedAt,
    staleAfterMinutes: source.staleAfterMinutes,
  });
  if (freshnessWindow.expiredAtReceipt) {
    throw new InventoryBatchTimestampError(
      "Batch generatedAt is too old to confirm current inventory freshness"
    );
  }

  if (
    source.lastAppliedBatchGeneratedAt &&
    sourceGeneratedAt.getTime() ===
      source.lastAppliedBatchGeneratedAt.getTime() &&
    !input.importContext
  ) {
    const lastAppliedRun = await tx.inventorySyncRun.findFirst({
      orderBy: [{ completedAt: "desc" }, { id: "desc" }],
      select: { payloadSha256: true },
      where: {
        id: { not: runId },
        inventorySourceId: source.id,
        sourceGeneratedAt,
        status: { in: ["completed", "completed_with_issues"] },
      },
    });
    if (
      hasEqualBatchTimestampConflict({
        incomingPayloadHash: input.payloadSha256,
        incomingSourceGeneratedAt: sourceGeneratedAt,
        lastAppliedPayloadHash: lastAppliedRun?.payloadSha256,
        lastAppliedSourceGeneratedAt: source.lastAppliedBatchGeneratedAt,
      })
    ) {
      return {
        kind: "rejected" as const,
        rejection: await rejectOutOfOrderBatch(
          tx,
          source.id,
          runId,
          receivedCount,
          now
        ),
      };
    }
  }

  return {
    confirmationAt: freshnessWindow.confirmationAt,
    kind: "accepted" as const,
    sourceGeneratedAt,
  };
};

export interface DerivedInventoryImportPreviewImpact {
  readonly changedCount: number;
  readonly heldCount: number;
  readonly issues: readonly {
    readonly fieldPath: string | null;
    readonly issueCode: string;
    readonly rowNumber: number | null;
    readonly safeMessage: string;
    readonly severity: "blocking" | "error" | "warning";
  }[];
  readonly missingCount: number;
  readonly projectedPublicationCount: number;
  readonly rejectedCount: number;
  readonly unchangedCount: number;
  readonly wouldUnpublishCount: number;
}

export const deriveInventoryImportPreviewImpact = async (
  tx: Prisma.TransactionClient,
  input: {
    readonly inventorySourceId: string;
    readonly now: Date;
    readonly payloadSha256: string;
    readonly preparedBatch: PreparedInventoryBatch;
  }
): Promise<DerivedInventoryImportPreviewImpact> => {
  if (!SHA256_PATTERN.test(input.payloadSha256)) {
    throw new InventoryPayloadHashError(
      "Inventory preview payload hash must be a lowercase SHA-256 digest"
    );
  }
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.inventorySourceId}))`;
  await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "InventorySource"
    WHERE "id" = ${input.inventorySourceId}
    FOR UPDATE
  `);
  const source = await tx.inventorySource.findUniqueOrThrow({
    include: sourceContextInclude,
    where: { id: input.inventorySourceId },
  });
  assertSourceCanIngest(source, input.preparedBatch.batch.mode);
  if (
    source.applyLeaseToken ||
    source.applyLeaseExpiresAt ||
    source.applyLeaseSessionId
  ) {
    throw new InventorySourceLeasedError(
      "Inventory source is leased and cannot be previewed"
    );
  }

  await tx.$executeRawUnsafe("SAVEPOINT automarket_inventory_preview");
  try {
    const receivedCount =
      input.preparedBatch.records.length +
      input.preparedBatch.quarantinedRecords.length;
    const run = await tx.inventorySyncRun.create({
      data: {
        externalBatchId: `preview:${randomUUID()}`,
        idempotencyKey: `preview:${randomUUID()}`,
        inventorySourceId: source.id,
        mode: input.preparedBatch.batch.mode,
        payloadByteSize: 0,
        payloadSha256: input.payloadSha256,
        receivedCount,
        schemaVersion: input.preparedBatch.schemaVersion,
        snapshotToken: input.preparedBatch.batch.sequence,
        sourceGeneratedAt: new Date(input.preparedBatch.batch.generatedAt),
        status: "validating",
        trigger: "upload",
      },
    });
    const request: InventoryIngestionRequest = {
      idempotencyKey: run.idempotencyKey,
      payloadByteSize: 0,
      payloadSha256: input.payloadSha256,
      preparedBatch: input.preparedBatch,
      sourceKey: source.sourceKey,
      trigger: "upload",
    };
    const ordering = await validateBatchOrderingAndFreshness(
      tx,
      source,
      request,
      run.id,
      receivedCount,
      input.now
    );
    let counters = createEmptyCounters();
    let heldCount = 0;
    let wouldUnpublishCount = 0;
    if (ordering.kind === "rejected") {
      counters = ordering.rejection;
    } else {
      const chunks = Array.from(
        {
          length: Math.max(
            Math.ceil(input.preparedBatch.preparedRecords.length / 100),
            1
          ),
        },
        (_, index) =>
          input.preparedBatch.preparedRecords.slice(
            index * 100,
            (index + 1) * 100
          )
      );
      for (const [index, preparedRecords] of chunks.entries()) {
        const next = await processPreparedBatchRecords(
          tx,
          source,
          run.id,
          {
            batch: input.preparedBatch.batch,
            preparedRecords,
            quarantinedRecords:
              index === 0 ? input.preparedBatch.quarantinedRecords : [],
            records: preparedRecords.map(({ normalized }) => normalized),
            schemaVersion: input.preparedBatch.schemaVersion,
          },
          input.now,
          ordering.confirmationAt
        );
        counters.changedCount += next.changedCount;
        counters.projectedCount += next.projectedCount;
        counters.rejectedCount += next.rejectedCount;
        counters.unchangedCount += next.unchangedCount;
        counters.unpublishedCount += next.unpublishedCount;
      }
      if (
        input.preparedBatch.batch.mode === "full_snapshot" &&
        input.preparedBatch.batch.complete &&
        counters.rejectedCount === 0
      ) {
        const reconciliation = await reconcileSnapshotAbsence(
          tx,
          source,
          { kind: "run", runId: run.id },
          input.now
        );
        counters.missingCount = reconciliation.missingCount;
        counters.unpublishedCount += reconciliation.unpublishedCount;
        heldCount = reconciliation.heldCount;
        wouldUnpublishCount = reconciliation.wouldUnpublishCount;
      }
    }
    const issues = await tx.inventorySyncIssue.findMany({
      orderBy: [{ rowNumber: "asc" }, { id: "asc" }],
      select: {
        errorCode: true,
        fieldPath: true,
        message: true,
        rowNumber: true,
        severity: true,
      },
      where: { syncRunId: run.id },
    });
    const result: DerivedInventoryImportPreviewImpact = {
      changedCount: counters.changedCount,
      heldCount,
      issues: issues.map((issue) => ({
        fieldPath: issue.fieldPath,
        issueCode: issue.errorCode,
        rowNumber: issue.rowNumber,
        safeMessage: issue.message.slice(0, 240),
        severity: issue.severity,
      })),
      missingCount: counters.missingCount,
      projectedPublicationCount: counters.projectedCount,
      rejectedCount: counters.rejectedCount,
      unchangedCount: counters.unchangedCount,
      wouldUnpublishCount,
    };
    await tx.$executeRawUnsafe(
      "ROLLBACK TO SAVEPOINT automarket_inventory_preview"
    );
    await tx.$executeRawUnsafe(
      "RELEASE SAVEPOINT automarket_inventory_preview"
    );
    return result;
  } catch (error) {
    await tx
      .$executeRawUnsafe("ROLLBACK TO SAVEPOINT automarket_inventory_preview")
      .catch(() => undefined);
    await tx
      .$executeRawUnsafe("RELEASE SAVEPOINT automarket_inventory_preview")
      .catch(() => undefined);
    throw error;
  }
};

type InventoryImportContext = NonNullable<
  InventoryIngestionRequest["importContext"]
>;

const assertInventoryIngestionLease = (
  source: SourceContext,
  importContext: InventoryImportContext | undefined,
  now: Date
) => {
  const leaseMetadata = [
    Boolean(source.applyLeaseToken),
    Boolean(source.applyLeaseExpiresAt),
    Boolean(source.applyLeaseSessionId),
  ];
  if (new Set(leaseMetadata).size !== 1) {
    throw new InventorySourceLeasedError(
      "Inventory source lease metadata is incomplete"
    );
  }

  const leaseIsCurrent = Boolean(
    source.applyLeaseToken &&
      source.applyLeaseExpiresAt &&
      source.applyLeaseExpiresAt > now
  );
  if (!leaseIsCurrent) {
    if (importContext) {
      throw new InventorySourceLeasedError(
        "Inventory import apply lease is absent or expired"
      );
    }
    return;
  }
  if (importContext?.leaseToken !== source.applyLeaseToken) {
    throw new InventorySourceLeasedError(
      "Inventory source is leased for an import apply"
    );
  }
  if (importContext.importSessionId !== source.applyLeaseSessionId) {
    throw new InventorySourceLeasedError(
      "Inventory source lease belongs to another import session"
    );
  }
};

const assertInventoryImportAttemptAuthority = async (
  tx: Prisma.TransactionClient,
  source: SourceContext,
  input: InventoryIngestionRequest,
  importContext: InventoryImportContext,
  now: Date
) => {
  const session = await tx.inventoryImportSession.findFirst({
    include: {
      chunks: {
        include: {
          attempts: { where: { ordinal: importContext.attemptOrdinal } },
        },
        where: { chunkIndex: importContext.chunkIndex },
      },
    },
    where: {
      applyDataRevision: source.dataRevision,
      expiresAt: { gt: now },
      id: importContext.importSessionId,
      inventorySourceId: source.id,
      snapshotToken: importContext.snapshotToken,
      sourceConfigVersion: source.configVersion,
      status: "applying",
    },
  });
  const chunk = session?.chunks[0];
  const attempt = chunk?.attempts[0];
  const capability = await tx.dealerOrgCapability.findFirst({
    select: { id: true },
    where: {
      capabilityKey: "inventory.supply",
      dealerOrgId: source.supplierOrgId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      revokedAt: null,
      status: "active",
      suspendedAt: null,
    },
  });
  if (
    !(session && chunk && attempt && capability) ||
    chunk.currentAttemptOrdinal !== importContext.attemptOrdinal ||
    chunk.recordCount !== input.preparedBatch.records.length ||
    chunk.normalizedDigest !==
      buildInventoryCsvNormalizedDigest(input.preparedBatch.records) ||
    chunk.status !== "applying" ||
    attempt.idempotencyKey !== input.idempotencyKey ||
    attempt.leaseExpiresAt <= now ||
    attempt.leaseToken !== importContext.attemptLeaseToken ||
    attempt.status !== "applying" ||
    input.preparedBatch.quarantinedRecords.length > 0 ||
    input.preparedBatch.batch.mode !== session.mode ||
    new Date(input.preparedBatch.batch.generatedAt).getTime() !==
      session.sourceGeneratedAt.getTime()
  ) {
    throw new InventorySourceLeasedError(
      "Inventory import attempt authority is stale or invalid"
    );
  }
};

const applyInventoryRun = async (
  tx: Prisma.TransactionClient,
  input: InventoryIngestionRequest,
  sourceId: string,
  runId: string,
  receivedCount: number,
  now: Date
) => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${sourceId}))`;
  await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "InventorySource"
    WHERE "id" = ${sourceId}
    FOR UPDATE
  `);
  const source = await tx.inventorySource.findUniqueOrThrow({
    include: sourceContextInclude,
    where: { id: sourceId },
  });
  assertSourceCanIngest(source, input.preparedBatch.batch.mode);
  assertInventoryIngestionLease(source, input.importContext, now);
  if (input.importContext) {
    await assertInventoryImportAttemptAuthority(
      tx,
      source,
      input,
      input.importContext,
      now
    );
  }
  const ordering = await validateBatchOrderingAndFreshness(
    tx,
    source,
    input,
    runId,
    receivedCount,
    now
  );
  if (ordering.kind === "rejected") {
    return ordering.rejection;
  }
  const { confirmationAt, sourceGeneratedAt } = ordering;

  await tx.inventorySyncRun.update({
    data: { attemptCount: { increment: 1 }, status: "applying" },
    where: { id: runId },
  });
  const next = await processPreparedBatchRecords(
    tx,
    source,
    runId,
    input.preparedBatch,
    now,
    confirmationAt
  );
  if (input.importContext) {
    await tx.sourceInventoryRecord.updateMany({
      data: { lastSeenSnapshotToken: input.importContext.snapshotToken },
      where: {
        inventorySourceId: source.id,
        lastSeenSyncRunId: runId,
      },
    });
  }

  if (
    input.preparedBatch.batch.mode === "full_snapshot" &&
    input.preparedBatch.batch.complete &&
    next.rejectedCount === 0
  ) {
    const reconciliation = await reconcileSnapshotAbsence(
      tx,
      source,
      { kind: "run", runId },
      now
    );
    next.missingCount = reconciliation.missingCount;
    next.unpublishedCount += reconciliation.unpublishedCount;
  }

  const status =
    next.rejectedCount > 0
      ? ("completed_with_issues" as const)
      : ("completed" as const);
  await tx.inventorySyncRun.update({
    data: {
      ...next,
      completedAt: now,
      errorCount: next.rejectedCount,
      status,
    },
    where: { id: runId },
  });
  const isCompleteSnapshot =
    input.preparedBatch.batch.mode === "full_snapshot" &&
    input.preparedBatch.batch.complete &&
    next.rejectedCount === 0;
  const appliedRecordCount = next.changedCount + next.unchangedCount;
  const isSuccessfulEmptySnapshot = isCompleteSnapshot && receivedCount === 0;
  if (input.importContext) {
    // Import chunks deliberately defer source health, ordering cursors,
    // data revision, and absence reconciliation to one fenced finalizer.
  } else if (appliedRecordCount > 0 || isSuccessfulEmptySnapshot) {
    const updatedSource = await tx.inventorySource.updateMany({
      data: {
        consecutiveFailureCount: 0,
        dataRevision: { increment: 1 },
        lastAppliedBatchGeneratedAt: sourceGeneratedAt,
        lastCompleteSnapshotAt: isCompleteSnapshot
          ? now
          : source.lastCompleteSnapshotAt,
        lastSuccessfulSyncAt: now,
        nextExpectedSyncAt: addMinutes(now, source.expectedIntervalMinutes),
        status: source.status === "degraded" ? "active" : source.status,
      },
      where: {
        deletedAt: null,
        id: source.id,
        status: { in: ["active", "degraded"] },
        supplierOrg: { is: { deletedAt: null } },
      },
    });
    if (updatedSource.count === 0) {
      throw new InventorySourceUnavailableError(
        "Inventory source authorization changed while the batch was applying"
      );
    }
  } else {
    await tx.inventorySource.updateMany({
      data: {
        consecutiveFailureCount: { increment: 1 },
        status: "degraded",
      },
      where: {
        deletedAt: null,
        id: source.id,
        status: { in: ["active", "degraded"] },
        supplierOrg: { is: { deletedAt: null } },
      },
    });
  }

  return { ...next, status };
};

const getIngestionSource = async (
  client: PrismaClient,
  input: InventoryIngestionRequest
) => {
  const source = await client.inventorySource.findUnique({
    include: sourceContextInclude,
    where: { sourceKey: input.sourceKey },
  });

  if (!source) {
    throw new InventorySourceNotFoundError("Inventory source was not found");
  }
  assertSourceCanIngest(source, input.preparedBatch.batch.mode);
  return source;
};

const assertReplayMatches = (
  run: Pick<
    InventorySyncRun,
    | "importAttemptOrdinal"
    | "importChunkIndex"
    | "importSessionId"
    | "payloadSha256"
    | "snapshotToken"
  >,
  input: InventoryIngestionRequest,
  payloadSha256: string
) => {
  if (
    run.payloadSha256 !== payloadSha256 ||
    run.importSessionId !== (input.importContext?.importSessionId ?? null) ||
    run.importChunkIndex !== (input.importContext?.chunkIndex ?? null) ||
    run.importAttemptOrdinal !==
      (input.importContext?.attemptOrdinal ?? null) ||
    (input.importContext !== undefined &&
      run.snapshotToken !== input.importContext.snapshotToken)
  ) {
    throw new InventoryIdempotencyConflictError(
      "The idempotency key or external batch ID was reused with different content"
    );
  }
};

const resolveOrCreateInventoryRun = async (
  client: PrismaClient,
  source: SourceContext,
  input: InventoryIngestionRequest,
  payloadSha256: string,
  receivedCount: number
) => {
  const existingByKey = await client.inventorySyncRun.findUnique({
    where: {
      inventorySourceId_idempotencyKey: {
        idempotencyKey: input.idempotencyKey,
        inventorySourceId: source.id,
      },
    },
  });
  const existingByBatch = await client.inventorySyncRun.findFirst({
    where: {
      externalBatchId: input.preparedBatch.batch.id,
      inventorySourceId: source.id,
    },
  });
  const existing = existingByKey ?? existingByBatch;

  if (existing) {
    assertReplayMatches(existing, input, payloadSha256);
    return {
      kind: "replay" as const,
      replay: toDuplicateIngestionResult(existing),
    };
  }

  try {
    const run = await client.inventorySyncRun.create({
      data: {
        externalBatchId: input.preparedBatch.batch.id,
        idempotencyKey: input.idempotencyKey,
        inventorySourceId: source.id,
        importAttemptOrdinal: input.importContext?.attemptOrdinal,
        importChunkIndex: input.importContext?.chunkIndex,
        importSessionId: input.importContext?.importSessionId,
        mode: input.preparedBatch.batch.mode,
        payloadByteSize: input.payloadByteSize,
        payloadSha256,
        receivedCount,
        schemaVersion: input.preparedBatch.schemaVersion,
        snapshotToken:
          input.importContext?.snapshotToken ??
          input.preparedBatch.batch.sequence,
        sourceGeneratedAt: new Date(input.preparedBatch.batch.generatedAt),
        status: "validating",
        trigger: input.trigger,
      },
    });
    return { kind: "run" as const, run };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const concurrentRun = await client.inventorySyncRun.findFirst({
      where: {
        inventorySourceId: source.id,
        OR: [
          { idempotencyKey: input.idempotencyKey },
          { externalBatchId: input.preparedBatch.batch.id },
        ],
      },
    });

    if (!concurrentRun) {
      throw error;
    }
    assertReplayMatches(concurrentRun, input, payloadSha256);
    return {
      kind: "replay" as const,
      replay: toDuplicateIngestionResult(concurrentRun),
    };
  }
};

export const ingestPreparedInventoryBatch = async (
  input: InventoryIngestionRequest,
  client: PrismaClient = database
): Promise<InventoryIngestionResult> => {
  const now = new Date();
  if (input.importContext && input.preparedBatch.batch.complete) {
    throw new InventorySourceModeMismatchError(
      "Import chunks cannot perform absence reconciliation"
    );
  }
  const sourceGeneratedAt = new Date(input.preparedBatch.batch.generatedAt);
  if (sourceGeneratedAt.getTime() > now.getTime() + MAX_SOURCE_CLOCK_SKEW_MS) {
    throw new InventoryBatchTimestampError(
      "Batch generatedAt exceeds the allowed clock skew"
    );
  }
  if (!SHA256_PATTERN.test(input.payloadSha256)) {
    throw new InventoryPayloadHashError(
      "Inventory payloadSha256 must be a lowercase SHA-256 digest"
    );
  }
  if (
    !Number.isSafeInteger(input.payloadByteSize) ||
    input.payloadByteSize < 0
  ) {
    throw new InventoryPayloadHashError(
      "Inventory payloadByteSize must be a non-negative safe integer"
    );
  }
  const source = await getIngestionSource(client, input);
  const payloadSha256 = input.payloadSha256;
  const receivedCount =
    input.preparedBatch.records.length +
    input.preparedBatch.quarantinedRecords.length;
  const resolvedRun = await resolveOrCreateInventoryRun(
    client,
    source,
    input,
    payloadSha256,
    receivedCount
  );
  if (resolvedRun.kind === "replay") {
    return resolvedRun.replay;
  }
  const { run } = resolvedRun;

  if (!input.importContext) {
    await client.inventorySource.update({
      data: { lastAttemptAt: now },
      where: { id: source.id },
    });
  }

  try {
    const counters = await client.$transaction(
      (tx) =>
        applyInventoryRun(tx, input, source.id, run.id, receivedCount, now),
      {
        isolationLevel: "Serializable",
        maxWait: 5000,
        timeout: INGESTION_TRANSACTION_TIMEOUT_MS,
      }
    );

    return {
      ...counters,
      duplicate: false,
      runId: run.id,
    };
  } catch (error) {
    await client.inventorySyncRun.update({
      data: {
        completedAt: new Date(),
        errorCode:
          error instanceof InventorySourceLeasedError
            ? "inventory_source_leased"
            : "inventory_processing_failed",
        errorMessage:
          error instanceof Error
            ? error.message.slice(0, 1000)
            : "Unknown error",
        status: "failed",
      },
      where: { id: run.id },
    });
    if (!(error instanceof InventorySourceLeasedError || input.importContext)) {
      await client.inventorySource.updateMany({
        data: {
          consecutiveFailureCount: { increment: 1 },
          status: "degraded",
        },
        where: {
          deletedAt: null,
          id: source.id,
          status: { in: ["active", "degraded"] },
          supplierOrg: { is: { deletedAt: null } },
        },
      });
    }
    throw error;
  }
};

const isAuthorizationCurrent = (
  status: string | null | undefined,
  expiresAt: Date | null | undefined,
  now: Date
) => status === "active" && (!expiresAt || expiresAt > now);

const hasCurrentRequiredCapabilities = (
  publication: AuthorityPublication,
  now: Date
) =>
  requiredSupplierCapabilities.every((capabilityKey) => {
    const capability = publication.supplierOffer.supplierOrg.capabilities.find(
      (item) => item.capabilityKey === capabilityKey
    );

    return isAuthorizationCurrent(
      capability?.status,
      capability?.expiresAt,
      now
    );
  });

const hasCurrentSupplierTrust = (
  publication: AuthorityPublication,
  now: Date
) => {
  const trust = publication.supplierOffer.supplierOrg.supplierTrust[0];
  return (
    trust?.status === "verified" && (!trust.expiresAt || trust.expiresAt > now)
  );
};

const isPublicationAuthorityCurrent = (
  publication: AuthorityPublication,
  now: Date
) => {
  const { inventorySource, supplierOrg } = publication.supplierOffer;
  if (
    supplierOrg.deletedAt ||
    supplierOrg.onboardingStatus !== "approved" ||
    supplierOrg.kybStatus !== "verified" ||
    (supplierOrg.kybExpiresAt && supplierOrg.kybExpiresAt <= now)
  ) {
    return false;
  }
  if (
    inventorySource.deletedAt ||
    !(
      inventorySource.status === "active" ||
      inventorySource.status === "degraded"
    ) ||
    inventorySource.mediaRightsStatus !== "active"
  ) {
    return false;
  }
  if (
    publication.supplierOffer.status !== "available" ||
    publication.supplierOffer.freshUntil <= now ||
    publication.market.status !== "active"
  ) {
    return false;
  }
  if (
    !publication.marketPermission ||
    publication.marketPermission.validFrom > now ||
    !isAuthorizationCurrent(
      publication.marketPermission.status,
      publication.marketPermission.validUntil,
      now
    )
  ) {
    return false;
  }
  if (
    !publication.inventoryRightsGrant ||
    publication.inventoryRightsGrant.inventorySourceId !==
      publication.supplierOffer.inventorySourceId ||
    (publication.inventoryRightsGrant.marketId &&
      publication.inventoryRightsGrant.marketId !== publication.marketId) ||
    publication.inventoryRightsGrant.validFrom > now ||
    !isAuthorizationCurrent(
      publication.inventoryRightsGrant.status,
      publication.inventoryRightsGrant.validUntil,
      now
    )
  ) {
    return false;
  }

  return (
    hasCurrentRequiredCapabilities(publication, now) &&
    hasCurrentSupplierTrust(publication, now)
  );
};

export const findCurrentPublicMarketplacePublicationForInquiry = async (
  tx: Prisma.TransactionClient,
  input: {
    destinationCountryCode: string;
    now?: Date;
    supplierOfferId: string;
  }
) => {
  const now = input.now ?? new Date();
  const publications = await tx.marketPublication.findMany({
    include: authorityPublicationInclude,
    orderBy: { id: "asc" },
    where: {
      channel: "public_marketplace",
      eligibilityDecision: "eligible",
      freshUntil: { gt: now },
      market: {
        is: {
          countryCode: input.destinationCountryCode,
          status: "active",
        },
      },
      OR: [
        { eligibilityExpiresAt: null },
        { eligibilityExpiresAt: { gt: now } },
      ],
      status: "published",
      supplierOfferId: input.supplierOfferId,
    },
  });

  return (
    publications.find((publication) =>
      isPublicationAuthorityCurrent(publication, now)
    ) ?? null
  );
};

export const reconcileStaleInventory = async (
  now = new Date(),
  client: PrismaClient = database
) => {
  const abandonedRuns = await client.inventorySyncRun.updateMany({
    data: {
      completedAt: now,
      errorCode: "inventory_run_abandoned",
      errorMessage:
        "The ingestion worker did not finish within its execution window.",
      status: "failed",
    },
    where: {
      startedAt: { lte: addMinutes(now, -ABANDONED_RUN_MINUTES) },
      status: { in: ["queued", "receiving", "validating", "applying"] },
    },
  });
  const staleOfferCandidates = await client.inventoryOffer.findMany({
    orderBy: [{ freshUntil: "asc" }, { id: "asc" }],
    select: { id: true },
    take: RECONCILIATION_BATCH_LIMIT + 1,
    where: {
      freshUntil: { lte: now },
      status: "available",
    },
  });
  const staleOfferBacklog =
    staleOfferCandidates.length > RECONCILIATION_BATCH_LIMIT;
  const staleOffers = staleOfferCandidates.slice(0, RECONCILIATION_BATCH_LIMIT);
  let unpublishedCount = 0;
  let staleOfferCount = 0;

  for (const offer of staleOffers) {
    const unpublished = await client.$transaction(async (tx) => {
      const updated = await tx.inventoryOffer.updateMany({
        data: {
          staleAt: now,
          status: "stale",
          version: { increment: 1 },
        },
        where: {
          freshUntil: { lte: now },
          id: offer.id,
          status: "available",
        },
      });
      if (updated.count === 0) {
        return false;
      }
      staleOfferCount += 1;
      return pauseOfferPublications(tx, offer.id, "offer_stale", now);
    });
    unpublishedCount += Number(unpublished);
  }

  const expiredPublicationCandidates = await client.marketPublication.findMany({
    orderBy: [{ eligibilityExpiresAt: "asc" }, { id: "asc" }],
    select: { id: true, supplierOfferId: true },
    take: RECONCILIATION_BATCH_LIMIT + 1,
    where: {
      eligibilityExpiresAt: { lte: now },
      status: "published",
    },
  });
  const expiredPublicationBacklog =
    expiredPublicationCandidates.length > RECONCILIATION_BATCH_LIMIT;
  const expiredPublications = expiredPublicationCandidates.slice(
    0,
    RECONCILIATION_BATCH_LIMIT
  );
  let expiredPublicationCount = 0;

  for (const publication of expiredPublications) {
    const unpublished = await client.$transaction(async (tx) => {
      const updated = await tx.marketPublication.updateMany({
        data: {
          eligibilityDecision: "ineligible",
          eligibilityEvaluatedAt: now,
          eligibilityReasonCodes: ["authorization_expired"],
          expiredAt: now,
          status: "expired",
          version: { increment: 1 },
        },
        where: {
          eligibilityExpiresAt: { lte: now },
          id: publication.id,
          status: "published",
        },
      });
      if (updated.count === 0) {
        return false;
      }
      expiredPublicationCount += 1;
      return refreshListingAfterPublicationPause(
        tx,
        publication.supplierOfferId,
        "authorization_expired",
        now
      );
    });
    unpublishedCount += Number(unpublished);
  }

  const authorityPublicationCandidates =
    await client.marketPublication.findMany({
      include: authorityPublicationInclude,
      orderBy: [{ eligibilityEvaluatedAt: "asc" }, { id: "asc" }],
      take: RECONCILIATION_BATCH_LIMIT + 1,
      where: { status: "published" },
    });
  const authorityPublicationBacklog =
    authorityPublicationCandidates.length > RECONCILIATION_BATCH_LIMIT;
  const authorityPublications = authorityPublicationCandidates.slice(
    0,
    RECONCILIATION_BATCH_LIMIT
  );
  const revokedPublications = authorityPublications.filter(
    (publication) => !isPublicationAuthorityCurrent(publication, now)
  );
  const currentPublicationIds = authorityPublications
    .filter((publication) => isPublicationAuthorityCurrent(publication, now))
    .map((publication) => publication.id);
  if (currentPublicationIds.length > 0) {
    await client.marketPublication.updateMany({
      data: { eligibilityEvaluatedAt: now },
      where: { id: { in: currentPublicationIds }, status: "published" },
    });
  }
  let revokedPublicationCount = 0;

  for (const publication of revokedPublications) {
    const unpublished = await client.$transaction(async (tx) => {
      const updated = await tx.marketPublication.updateMany({
        data: {
          eligibilityDecision: "ineligible",
          eligibilityEvaluatedAt: now,
          eligibilityReasonCodes: ["authorization_revoked"],
          pausedAt: now,
          status: "paused",
          version: { increment: 1 },
        },
        where: { id: publication.id, status: "published" },
      });
      if (updated.count === 0) {
        return false;
      }
      revokedPublicationCount += 1;
      return refreshListingAfterPublicationPause(
        tx,
        publication.supplierOfferId,
        "authorization_revoked",
        now
      );
    });
    unpublishedCount += Number(unpublished);
  }

  const degradedSources = await client.inventorySource.updateMany({
    data: { status: "degraded" },
    where: {
      deletedAt: null,
      nextExpectedSyncAt: { lte: now },
      status: "active",
    },
  });

  const expiredRawPayloadCandidates =
    await client.sourceInventoryRevision.findMany({
      orderBy: [{ rawPayloadExpiresAt: "asc" }, { id: "asc" }],
      select: { id: true },
      take: RAW_PAYLOAD_PURGE_BATCH_LIMIT + 1,
      where: {
        rawPayloadExpiresAt: { lte: now },
        rawPayloadPurgedAt: null,
      },
    });
  const rawPayloadBacklog =
    expiredRawPayloadCandidates.length > RAW_PAYLOAD_PURGE_BATCH_LIMIT;
  const expiredRawPayloadIds = expiredRawPayloadCandidates
    .slice(0, RAW_PAYLOAD_PURGE_BATCH_LIMIT)
    .map(({ id }) => id);
  const rawPayloadPurge =
    expiredRawPayloadIds.length === 0
      ? { count: 0 }
      : await client.sourceInventoryRevision.updateMany({
          data: {
            rawPayload: Prisma.DbNull,
            rawPayloadPurgedAt: now,
          },
          where: {
            id: { in: expiredRawPayloadIds },
            rawPayloadPurgedAt: null,
          },
        });

  return {
    abandonedRunCount: abandonedRuns.count,
    backlog: {
      authorityPublications: authorityPublicationBacklog,
      expiredPublications: expiredPublicationBacklog,
      rawPayloadRevisions: rawPayloadBacklog,
      staleOffers: staleOfferBacklog,
    },
    degradedSourceCount: degradedSources.count,
    expiredPublicationCount,
    revokedPublicationCount,
    rawPayloadPurgedCount: rawPayloadPurge.count,
    staleOfferCount,
    unpublishedCount,
  };
};
