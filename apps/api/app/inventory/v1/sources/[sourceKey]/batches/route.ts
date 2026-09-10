import {
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

interface InventoryBatchRouteContext {
  params: Promise<{ sourceKey: string }>;
}

export const POST = async (
  request: Request,
  context: InventoryBatchRouteContext
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
  if (mediaType !== "application/json") {
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
    trigger: "api",
  });

  let envelope: unknown;
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
      trigger: "api",
    });
  }

  const preparedBatch = prepareInventoryEnvelope(envelope);
  if (!preparedBatch) {
    return inventoryIngressFailureResponse({
      error: "invalid_inventory_envelope",
      idempotencyKey: idempotency.idempotencyKey,
      payloadByteSize: body.byteLength,
      payloadSha256,
      sourceKey,
      status: 422,
      trigger: "api",
    });
  }

  return ingestPreparedInventory({
    idempotencyKey: idempotency.idempotencyKey,
    payloadByteSize: body.byteLength,
    payloadSha256,
    preparedBatch,
    sourceKey,
    trigger: "api",
  });
};
