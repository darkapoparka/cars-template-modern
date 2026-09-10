import {
  convertInventoryCsvToImport,
  getInventoryCsvBatchMetadata,
} from "@/lib/inventory-csv";
import {
  attachInventoryRawRecordProvenance,
  authorizeInventorySourceRequest,
  decodeInventoryBody,
  enforceInventorySourceRateLimit,
  getRequestMediaType,
  hashInventoryRequestPayload,
  InventoryPayloadTooLargeError,
  ingestPreparedInventory,
  inventoryErrorResponse,
  inventoryIngressFailureResponse,
  isValidInventorySourceKey,
  prepareInventoryEnvelope,
  readBoundedInventoryBody,
  requireInventoryIdempotencyKey,
} from "@/lib/inventory-http";

export const runtime = "nodejs";
export const maxDuration = 60;

const CSV_MEDIA_TYPES = new Set(["application/csv", "text/csv"]);

interface InventoryImportRouteContext {
  params: Promise<{ sourceKey: string }>;
}

export const POST = async (
  request: Request,
  context: InventoryImportRouteContext
): Promise<Response> => {
  const { sourceKey } = await context.params;
  if (!isValidInventorySourceKey(sourceKey)) {
    return inventoryErrorResponse("invalid_source_key", 400);
  }
  const authorizationError = await authorizeInventorySourceRequest(
    request,
    sourceKey
  );
  if (authorizationError) {
    return authorizationError;
  }

  const rateLimitError = await enforceInventorySourceRateLimit(sourceKey);
  if (rateLimitError) {
    return rateLimitError;
  }

  const idempotency = requireInventoryIdempotencyKey(request);
  if ("response" in idempotency) {
    return idempotency.response;
  }

  const mediaType = getRequestMediaType(request);
  if (!(mediaType === "application/json" || CSV_MEDIA_TYPES.has(mediaType))) {
    return inventoryErrorResponse("unsupported_media_type", 415);
  }

  let body: Uint8Array;
  try {
    body = await readBoundedInventoryBody(request);
  } catch (error) {
    const tooLarge = error instanceof InventoryPayloadTooLargeError;
    return inventoryErrorResponse(
      tooLarge ? "payload_too_large" : "invalid_request_body",
      tooLarge ? 413 : 400
    );
  }
  const payloadSha256 = hashInventoryRequestPayload({
    body,
    mediaType,
    requestHeaders: request.headers,
    trigger: "manual",
  });

  let envelope: unknown;
  let rawCsvRecords: readonly unknown[] | undefined;
  if (mediaType === "application/json") {
    try {
      envelope = JSON.parse(decodeInventoryBody(body));
    } catch {
      return inventoryIngressFailureResponse({
        error: "invalid_json",
        idempotencyKey: idempotency.idempotencyKey,
        payloadByteSize: body.byteLength,
        payloadSha256,
        sourceKey,
        status: 400,
        trigger: "manual",
      });
    }
  } else {
    try {
      const csvImport = convertInventoryCsvToImport(
        decodeInventoryBody(body),
        getInventoryCsvBatchMetadata(
          request.headers,
          idempotency.idempotencyKey
        )
      );
      envelope = csvImport.envelope;
      rawCsvRecords = csvImport.rawRecords;
    } catch {
      return inventoryIngressFailureResponse({
        error: "invalid_csv",
        idempotencyKey: idempotency.idempotencyKey,
        payloadByteSize: body.byteLength,
        payloadSha256,
        sourceKey,
        status: 422,
        trigger: "manual",
      });
    }
  }

  let preparedBatch = prepareInventoryEnvelope(envelope);
  if (!preparedBatch) {
    return inventoryIngressFailureResponse({
      error: "invalid_inventory_envelope",
      idempotencyKey: idempotency.idempotencyKey,
      payloadByteSize: body.byteLength,
      payloadSha256,
      sourceKey,
      status: 422,
      trigger: "manual",
    });
  }
  if (rawCsvRecords) {
    preparedBatch = attachInventoryRawRecordProvenance(
      preparedBatch,
      rawCsvRecords
    );
  }

  return ingestPreparedInventory({
    idempotencyKey: idempotency.idempotencyKey,
    payloadByteSize: body.byteLength,
    payloadSha256,
    preparedBatch,
    sourceKey,
    trigger: "manual",
  });
};
