import {
  KybDocumentConflictError,
  recordKybDocumentScanResult,
} from "@repo/database/kyb-documents";
import { z } from "zod";
import { env } from "@/env";
import {
  hashIdempotentWebhookPayload,
  processIdempotentWebhook,
} from "@/lib/idempotent-webhook";
import { serviceJson } from "@/lib/service-auth";
import { readSignedCallback } from "@/lib/signed-callback";

const payloadSchema = z
  .object({
    accepted: z.boolean(),
    documentId: z.string().min(6).max(128),
  })
  .strict();

export const runtime = "nodejs";
export const maxDuration = 30;

export const POST = async (request: Request): Promise<Response> => {
  const callback = await readSignedCallback(
    request,
    env.KYB_SCANNER_CALLBACK_SECRET
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
      scope: "kyb-scanner",
      process: () =>
        recordKybDocumentScanResult({
          accepted: parsed.data.accepted,
          documentId: parsed.data.documentId,
          payloadHash,
          providerEventId: callback.eventId,
        }).then(() => undefined),
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
    return error instanceof KybDocumentConflictError
      ? serviceJson({ error: "kyb_scanner_callback_conflict" }, 409)
      : serviceJson({ error: "kyb_scanner_callback_failed" }, 503, {
          "Retry-After": "10",
        });
  }
};
