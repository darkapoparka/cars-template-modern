import {
  getIdempotencyStore,
  type IdempotencyStore,
} from "@repo/rate-limit/idempotency";

export type IdempotentWebhookResult =
  | "conflict"
  | "duplicate"
  | "in_progress"
  | "processed";

interface ProcessIdempotentWebhookOptions {
  eventId: string;
  payloadHash: string;
  process: () => Promise<void>;
  scope: string;
  store?: IdempotencyStore;
}

export const processIdempotentWebhook = async ({
  eventId,
  payloadHash,
  process,
  scope,
  store = getIdempotencyStore(),
}: ProcessIdempotentWebhookOptions): Promise<IdempotentWebhookResult> => {
  const claim = await store.begin(scope, eventId, payloadHash);

  if (claim.status === "conflict") {
    return "conflict";
  }

  if (claim.status === "completed") {
    return "duplicate";
  }

  if (claim.status === "in_progress") {
    return "in_progress";
  }

  try {
    await process();
  } catch (error) {
    await store.release(claim).catch(() => undefined);
    throw error;
  }

  await store.complete(claim);

  return "processed";
};

export const hashIdempotentWebhookPayload = (body: string): string =>
  createHash("sha256").update(body).digest("hex");

import { createHash } from "node:crypto";
