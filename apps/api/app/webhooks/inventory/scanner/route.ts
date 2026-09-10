import {
  InventoryImportConflictError,
  markInventoryArtifactScanResult,
} from "@repo/database/inventory-imports";
import { z } from "zod";
import { env } from "@/env";
import {
  hashIdempotentWebhookPayload,
  processIdempotentWebhook,
} from "@/lib/idempotent-webhook";
import { inventoryArtifactScanner } from "@/lib/provider-adapters";
import { serviceJson } from "@/lib/service-auth";
import { readSignedCallback } from "@/lib/signed-callback";

const payloadSchema = z
  .object({
    artifactId: z.string().min(6).max(128),
    callbackToken: z.string().min(16).max(200),
    clean: z.boolean(),
    providerReference: z.string().min(1).max(240),
  })
  .strict();

export const runtime = "nodejs";
export const maxDuration = 30;

export const POST = async (request: Request): Promise<Response> => {
  if (inventoryArtifactScanner.name === "unconfigured") {
    return serviceJson({ error: "inventory_scanner_not_configured" }, 503);
  }
  const callback = await readSignedCallback(
    request,
    env.INVENTORY_SCANNER_CALLBACK_SECRET
  );
  if (!callback.ok) {
    return callback.response;
  }
  let json: unknown;
  try {
    json = JSON.parse(callback.body);
  } catch {
    return serviceJson({ error: "invalid_callback_payload" }, 422);
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return serviceJson({ error: "invalid_callback_payload" }, 422);
  }
  const payloadHash = hashIdempotentWebhookPayload(callback.body);
  try {
    const result = await processIdempotentWebhook({
      eventId: callback.eventId,
      payloadHash,
      process: () =>
        markInventoryArtifactScanResult({
          artifactId: parsed.data.artifactId,
          callbackToken: parsed.data.callbackToken,
          clean: parsed.data.clean,
          payloadHash,
          providerEventId: callback.eventId,
          providerName: inventoryArtifactScanner.name,
          providerReference: parsed.data.providerReference,
        }).then(() => undefined),
      scope: "inventory-scanner",
    });
    if (result === "conflict") {
      return serviceJson({ error: "idempotency_conflict" }, 409);
    }
    return result === "in_progress"
      ? serviceJson({ error: "callback_in_progress" }, 503, {
          "Retry-After": "5",
        })
      : serviceJson({ ok: true }, 200);
  } catch (error) {
    return error instanceof InventoryImportConflictError
      ? serviceJson({ error: "inventory_scanner_callback_conflict" }, 409)
      : serviceJson({ error: "inventory_scanner_callback_failed" }, 503, {
          "Retry-After": "10",
        });
  }
};
