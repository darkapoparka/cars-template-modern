import { createHmac, timingSafeEqual } from "node:crypto";
import { serviceJson } from "@/lib/service-auth";
import {
  readBoundedWebhookBody,
  WebhookPayloadTooLargeError,
} from "@/lib/webhook-body";

const CALLBACK_MAX_BYTES = 64 * 1024;
const CALLBACK_MAX_AGE_SECONDS = 5 * 60;
const EVENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SIGNATURE_PATTERN = /^sha256=([a-f0-9]{64})$/;

export type SignedCallbackResult =
  | { readonly body: string; readonly eventId: string; readonly ok: true }
  | { readonly ok: false; readonly response: Response };

export const readSignedCallback = async (
  request: Request,
  secret: string | undefined,
  now = Date.now()
): Promise<SignedCallbackResult> => {
  if (!secret || secret.length < 32) {
    return {
      ok: false,
      response: serviceJson({ error: "callback_not_configured" }, 503),
    };
  }
  const eventId = request.headers.get("x-automarket-event-id")?.trim() ?? "";
  const timestamp = request.headers.get("x-automarket-timestamp")?.trim() ?? "";
  const signature = request.headers.get("x-automarket-signature")?.trim() ?? "";
  const signatureMatch = SIGNATURE_PATTERN.exec(signature);
  const timestampSeconds = Number(timestamp);
  if (
    !(
      EVENT_ID_PATTERN.test(eventId) && Number.isSafeInteger(timestampSeconds)
    ) ||
    Math.abs(Math.floor(now / 1000) - timestampSeconds) >
      CALLBACK_MAX_AGE_SECONDS ||
    !signatureMatch
  ) {
    return {
      ok: false,
      response: serviceJson({ error: "invalid_callback_headers" }, 400),
    };
  }
  let body: string;
  try {
    body = await readBoundedWebhookBody(request, CALLBACK_MAX_BYTES);
  } catch (error) {
    return {
      ok: false,
      response: serviceJson(
        {
          error:
            error instanceof WebhookPayloadTooLargeError
              ? "payload_too_large"
              : "invalid_callback_body",
        },
        error instanceof WebhookPayloadTooLargeError ? 413 : 400
      ),
    };
  }
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${eventId}.${body}`)
    .digest();
  const presented = Buffer.from(signatureMatch[1] ?? "", "hex");
  if (
    presented.length !== expected.length ||
    !timingSafeEqual(presented, expected)
  ) {
    return {
      ok: false,
      response: serviceJson({ error: "invalid_callback_signature" }, 401),
    };
  }
  return { body, eventId, ok: true };
};
