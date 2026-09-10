import {
  OrganizationVerificationConflictError,
  recordKybProviderCheckResult,
} from "@repo/database/organization-verification";
import { z } from "zod";
import { env } from "@/env";
import {
  hashIdempotentWebhookPayload,
  processIdempotentWebhook,
} from "@/lib/idempotent-webhook";
import { serviceJson } from "@/lib/service-auth";
import { readSignedCallback } from "@/lib/signed-callback";

const payloadSchema = z.object({
  checkId: z.string().min(6).max(128),
  normalizedResultCode: z.string().regex(/^[a-z0-9_]{2,64}$/),
  riskLevel: z.enum(["low", "medium", "high", "unknown"]),
  status: z.enum(["passed", "failed", "review_required", "unavailable"]),
});

export const runtime = "nodejs";
export const maxDuration = 30;

export const POST = async (request: Request): Promise<Response> => {
  const callback = await readSignedCallback(
    request,
    env.KYB_PROVIDER_CALLBACK_SECRET
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
      scope: "kyb-provider",
      process: async () => {
        await recordKybProviderCheckResult({
          ...parsed.data,
          payloadHash,
          providerEventId: callback.eventId,
        });
      },
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
    return error instanceof OrganizationVerificationConflictError
      ? serviceJson({ error: "kyb_provider_callback_conflict" }, 409)
      : serviceJson({ error: "kyb_provider_callback_failed" }, 503, {
          "Retry-After": "10",
        });
  }
};
