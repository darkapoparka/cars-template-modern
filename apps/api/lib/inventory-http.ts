import { createHash } from "node:crypto";
import { database, type Prisma } from "@repo/database";
import {
  InventoryBatchTimestampError,
  InventoryIdempotencyConflictError,
  InventoryPayloadHashError,
  InventorySourceLeasedError,
  InventorySourceModeMismatchError,
  InventorySourceNotFoundError,
  InventorySourceUnavailableError,
  ingestPreparedInventoryBatch,
  recordInventoryIngressFailure,
} from "@repo/database/inventory-ingestion";
import {
  type PreparedInventoryBatch,
  prepareInventoryBatch,
} from "@repo/marketplace";
import { createRateLimiter, slidingWindow } from "@repo/rate-limit";
import {
  ReadOnlyEnvironmentInventoryCredentialProvider,
  verifyInventoryCredential,
} from "@repo/security/inventory-credentials";
import { inventoryCredentialProvider } from "@/lib/provider-adapters";

export const INVENTORY_MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;
export const INVENTORY_MAX_REQUESTS_PER_MINUTE = 30;

const DECIMAL_INTEGER_PATTERN = /^\d+$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,239}$/;
const SOURCE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{5,127}$/;
const LEADING_BYTE_ORDER_MARK_PATTERN = /^\uFEFF/;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;
const MAX_VERIFIABLE_INGRESS_BINDINGS = 5;

export type InventoryIngestionTrigger = "api" | "manual";

export class InventoryPayloadTooLargeError extends Error {}

export const isValidInventorySourceKey = (value: string) =>
  SOURCE_KEY_PATTERN.test(value);

export const inventoryErrorResponse = (error: string, status: number) =>
  Response.json(
    { error },
    {
      headers: NO_STORE_HEADERS,
      status,
    }
  );

interface InventoryRateLimitDependencies {
  readonly createLimiter?: () => {
    limit: (key: string) => Promise<{ success: boolean }>;
  };
  readonly nodeEnv?: string;
  readonly redisConfigured?: boolean;
}

export const enforceInventorySourceRateLimit = async (
  sourceKey: string,
  dependencies: InventoryRateLimitDependencies = {}
): Promise<Response | null> => {
  const nodeEnv = dependencies.nodeEnv ?? process.env.NODE_ENV;
  const redisConfigured =
    dependencies.redisConfigured ??
    Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    );

  if (nodeEnv !== "production" && !redisConfigured) {
    return null;
  }

  try {
    const limiter =
      dependencies.createLimiter?.() ??
      createRateLimiter({
        limiter: slidingWindow(INVENTORY_MAX_REQUESTS_PER_MINUTE, "1m"),
        prefix: "automarket_inventory_ingress",
      });
    const result = await limiter.limit(`source:${sourceKey}`);
    if (!result.success) {
      return Response.json(
        { error: "rate_limited" },
        {
          headers: { ...NO_STORE_HEADERS, "Retry-After": "60" },
          status: 429,
        }
      );
    }
    return null;
  } catch {
    return inventoryErrorResponse("inventory_rate_limit_unavailable", 503);
  }
};

export const inventoryIngressFailureResponse = async ({
  error,
  idempotencyKey,
  payloadByteSize,
  payloadSha256,
  sourceKey,
  status,
  trigger,
}: {
  error: string;
  idempotencyKey: string;
  payloadByteSize: number;
  payloadSha256: string;
  sourceKey: string;
  status: number;
  trigger: InventoryIngestionTrigger;
}) => {
  try {
    await recordInventoryIngressFailure({
      errorCode: error,
      idempotencyKey,
      payloadByteSize,
      payloadSha256,
      sourceKey,
      trigger,
    });
  } catch (cause) {
    if (cause instanceof InventoryIdempotencyConflictError) {
      return inventoryErrorResponse("idempotency_conflict", 409);
    }
    // The original stable ingress error takes precedence over metrics failure.
  }

  return inventoryErrorResponse(error, status);
};

export const getRequestMediaType = (request: Request) =>
  request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ??
  "";

export const authorizeInventorySourceRequest = async (
  request: Request,
  sourceKey: string
): Promise<Response | null> => {
  const now = new Date();
  let source: Prisma.InventorySourceGetPayload<{
    include: { credentialBindings: true };
  }> | null;
  try {
    source = await database.inventorySource.findFirst({
      include: {
        credentialBindings: {
          orderBy: { version: "desc" },
          take: MAX_VERIFIABLE_INGRESS_BINDINGS,
          where: {
            purpose: "ingress_bearer",
            OR: [
              { status: "active", revokedAt: null },
              {
                status: "retiring",
                revokedAt: null,
                retiringUntil: { gt: now },
              },
            ],
          },
        },
      },
      where: {
        deletedAt: null,
        sourceKey,
        status: { in: ["active", "degraded"] },
        supplierOrg: { is: { deletedAt: null } },
      },
    });
  } catch {
    return inventoryErrorResponse("inventory_authorization_unavailable", 503);
  }

  if (!source) {
    return inventoryErrorResponse("unauthorized", 401);
  }

  if (source.credentialBindings.length === 0) {
    return inventoryErrorResponse("source_credential_not_configured", 503);
  }
  const authorization = request.headers.get("authorization") ?? "";
  const candidate = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!candidate) {
    return inventoryErrorResponse("unauthorized", 401);
  }

  const scope = {
    dealerOrgId: source.supplierOrgId,
    inventorySourceId: source.id,
    purpose: "ingress_bearer" as const,
  };
  let resolvedBindingCount = 0;
  let authorized = false;
  for (const binding of source.credentialBindings) {
    try {
      const provider = binding.credentialReference.startsWith("env:")
        ? new ReadOnlyEnvironmentInventoryCredentialProvider(process.env, {
            [binding.credentialReference]: scope,
          })
        : inventoryCredentialProvider;
      const matches = await verifyInventoryCredential(provider, {
        candidate,
        credentialReference: binding.credentialReference,
        scope,
      });
      resolvedBindingCount += 1;
      if (matches) {
        authorized = true;
        break;
      }
    } catch {
      // A broken newest binding must not hide a valid overlapping rotation.
    }
  }
  if (!authorized) {
    return resolvedBindingCount === source.credentialBindings.length
      ? inventoryErrorResponse("unauthorized", 401)
      : inventoryErrorResponse("source_credential_not_configured", 503);
  }

  if (
    source.applyLeaseToken &&
    source.applyLeaseExpiresAt &&
    source.applyLeaseExpiresAt > now
  ) {
    return inventoryErrorResponse("inventory_source_leased", 409);
  }

  return null;
};

export const requireInventoryIdempotencyKey = (
  request: Request
): { idempotencyKey: string } | { response: Response } => {
  const header = request.headers.get("idempotency-key");
  const idempotencyKey = header?.trim() ?? "";

  if (!idempotencyKey) {
    return {
      response: inventoryErrorResponse("idempotency_key_required", 400),
    };
  }

  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return {
      response: inventoryErrorResponse("invalid_idempotency_key", 400),
    };
  }

  return { idempotencyKey };
};

export const readBoundedInventoryBody = async (
  request: Request,
  limit = INVENTORY_MAX_PAYLOAD_BYTES
): Promise<Uint8Array> => {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && DECIMAL_INTEGER_PATTERN.test(declaredLength)) {
    const parsedLength = Number(declaredLength);
    if (Number.isSafeInteger(parsedLength) && parsedLength > limit) {
      throw new InventoryPayloadTooLargeError();
    }
  }

  if (!request.body) {
    return new Uint8Array();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    byteLength += value.byteLength;
    if (byteLength > limit) {
      try {
        await reader.cancel();
      } catch {
        // The bounded read has already failed; cancellation is best effort.
      }
      throw new InventoryPayloadTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
};

export const decodeInventoryBody = (body: Uint8Array) =>
  new TextDecoder("utf-8", { fatal: true })
    .decode(body)
    .replace(LEADING_BYTE_ORDER_MARK_PATTERN, "");

const INVENTORY_PAYLOAD_HASH_HEADERS = [
  "x-automarket-batch-complete",
  "x-automarket-batch-id",
  "x-automarket-batch-mode",
  "x-automarket-batch-sequence",
  "x-automarket-generated-at",
] as const;

export const hashInventoryRequestPayload = ({
  body,
  mediaType,
  requestHeaders,
  trigger,
}: {
  body: Uint8Array;
  mediaType: string;
  requestHeaders: Headers;
  trigger: InventoryIngestionTrigger;
}) => {
  const hash = createHash("sha256");
  hash.update("automarket.inventory.http.v1\0");
  hash.update(`${trigger}\0${mediaType}\0`);
  for (const header of INVENTORY_PAYLOAD_HASH_HEADERS) {
    hash.update(`${header}:${requestHeaders.get(header)?.trim() ?? ""}\0`);
  }
  hash.update(body);
  return hash.digest("hex");
};

export const prepareInventoryEnvelope = (
  input: unknown
): PreparedInventoryBatch | null => {
  try {
    const preparedBatch = prepareInventoryBatch(input);
    const receivedCount =
      preparedBatch.records.length + preparedBatch.quarantinedRecords.length;

    return receivedCount > 0 ||
      (preparedBatch.batch.mode === "full_snapshot" &&
        preparedBatch.batch.complete)
      ? preparedBatch
      : null;
  } catch {
    return null;
  }
};

export const attachInventoryRawRecordProvenance = (
  preparedBatch: PreparedInventoryBatch,
  rawRecords: readonly unknown[]
): PreparedInventoryBatch => ({
  ...preparedBatch,
  preparedRecords: preparedBatch.preparedRecords.map((record) => ({
    ...record,
    raw: rawRecords[record.rowNumber - 1] ?? record.raw,
  })),
  quarantinedRecords: preparedBatch.quarantinedRecords.map((record) => ({
    ...record,
    raw: rawRecords[record.rowNumber - 1] ?? record.raw,
  })),
});

interface IngestPreparedInventoryInput {
  idempotencyKey: string;
  payloadByteSize: number;
  payloadSha256: string;
  preparedBatch: PreparedInventoryBatch;
  sourceKey: string;
  trigger: InventoryIngestionTrigger;
}

const getIngestionHttpStatus = (
  status: Awaited<ReturnType<typeof ingestPreparedInventoryBatch>>["status"]
) => {
  if (status === "in_progress") {
    return 202;
  }
  if (status === "failed_replay") {
    return 409;
  }

  return 200;
};

export const ingestPreparedInventory = async (
  input: IngestPreparedInventoryInput
): Promise<Response> => {
  try {
    const result = await ingestPreparedInventoryBatch(input);

    return Response.json(result, {
      headers: NO_STORE_HEADERS,
      status: getIngestionHttpStatus(result.status),
    });
  } catch (error) {
    if (error instanceof InventoryIdempotencyConflictError) {
      return inventoryErrorResponse("idempotency_conflict", 409);
    }
    if (error instanceof InventorySourceNotFoundError) {
      return inventoryErrorResponse("inventory_source_not_found", 404);
    }
    if (error instanceof InventorySourceModeMismatchError) {
      return inventoryErrorResponse("inventory_source_mode_mismatch", 409);
    }
    if (error instanceof InventorySourceLeasedError) {
      return inventoryErrorResponse("inventory_source_leased", 409);
    }
    if (error instanceof InventoryBatchTimestampError) {
      return inventoryErrorResponse("inventory_batch_timestamp_invalid", 422);
    }
    if (error instanceof InventoryPayloadHashError) {
      return inventoryErrorResponse("inventory_payload_hash_invalid", 422);
    }
    if (error instanceof InventorySourceUnavailableError) {
      return inventoryErrorResponse("inventory_source_unavailable", 409);
    }

    return inventoryErrorResponse("inventory_ingestion_failed", 500);
  }
};
