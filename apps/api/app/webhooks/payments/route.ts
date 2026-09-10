import { analytics } from "@repo/analytics/server";
import { clerkClient } from "@repo/auth/server";
import { log } from "@repo/observability/log";
import type { Stripe } from "@repo/payments";
import { getStripe } from "@repo/payments";
import { RateLimitConfigurationError } from "@repo/rate-limit";
import { env } from "@/env";
import { flushAnalyticsBestEffort } from "@/lib/analytics";
import { apiAdapterCapabilities } from "@/lib/capabilities";
import {
  hashIdempotentWebhookPayload,
  processIdempotentWebhook,
} from "@/lib/idempotent-webhook";
import { serviceJson } from "@/lib/service-auth";
import {
  readBoundedWebhookBody,
  WebhookPayloadTooLargeError,
} from "@/lib/webhook-body";

const getUserFromCustomerId = async (customerId: string) => {
  const clerk = await clerkClient();
  const users = await clerk.users.getUserList();

  return users.data.find(
    (currentUser) => currentUser.privateMetadata.stripeCustomerId === customerId
  );
};

const handleCheckoutSessionCompleted = async (
  data: Stripe.Checkout.Session,
  eventId: string
) => {
  if (!data.customer) {
    return;
  }

  const customerId =
    typeof data.customer === "string" ? data.customer : data.customer.id;
  const user = await getUserFromCustomerId(customerId);

  if (!user) {
    return;
  }

  analytics?.capture({
    distinctId: user.id,
    event: "User Subscribed",
    properties: { $insert_id: eventId },
  });
};

const handleSubscriptionScheduleCanceled = async (
  data: Stripe.SubscriptionSchedule,
  eventId: string
) => {
  if (!data.customer) {
    return;
  }

  const customerId =
    typeof data.customer === "string" ? data.customer : data.customer.id;
  const user = await getUserFromCustomerId(customerId);

  if (!user) {
    return;
  }

  analytics?.capture({
    distinctId: user.id,
    event: "User Unsubscribed",
    properties: { $insert_id: eventId },
  });
};

const processEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      await handleCheckoutSessionCompleted(event.data.object, event.id);
      break;
    }
    case "subscription_schedule.canceled": {
      await handleSubscriptionScheduleCanceled(event.data.object, event.id);
      break;
    }
    default: {
      log.info("Unhandled Stripe webhook event", {
        eventId: event.id,
        eventType: event.type,
        provider: "stripe",
      });
    }
  }

  flushAnalyticsBestEffort();
};

export const POST = async (request: Request): Promise<Response> => {
  if (!apiAdapterCapabilities.billingProjection) {
    return serviceJson({ error: "billing_projection_unavailable" }, 503);
  }

  const stripe = getStripe();
  if (!(stripe && env.STRIPE_WEBHOOK_SECRET)) {
    return serviceJson({ error: "webhook_not_configured" }, 503);
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return serviceJson({ error: "invalid_webhook_headers" }, 400);
  }

  let body: string;
  try {
    body = await readBoundedWebhookBody(request);
  } catch (error) {
    return serviceJson(
      {
        error:
          error instanceof WebhookPayloadTooLargeError
            ? "payload_too_large"
            : "invalid_webhook_body",
      },
      error instanceof WebhookPayloadTooLargeError ? 413 : 400
    );
  }
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    log.warn("Stripe webhook signature rejected", { provider: "stripe" });
    return serviceJson({ error: "invalid_webhook_signature" }, 400);
  }

  log.info("Webhook received", {
    eventId: event.id,
    eventType: event.type,
    provider: "stripe",
  });

  try {
    const result = await processIdempotentWebhook({
      eventId: event.id,
      payloadHash: hashIdempotentWebhookPayload(body),
      process: () => processEvent(event),
      scope: "stripe",
    });

    if (result === "in_progress") {
      return serviceJson({ error: "webhook_in_progress" }, 503, {
        "Retry-After": "5",
      });
    }
    if (result === "conflict") {
      return serviceJson({ error: "idempotency_conflict" }, 409);
    }

    return serviceJson({ ok: true });
  } catch (error) {
    if (error instanceof RateLimitConfigurationError) {
      log.error("Stripe webhook idempotency is not configured", {
        eventId: event.id,
        eventType: event.type,
        provider: "stripe",
      });
      return serviceJson({ error: "webhook_idempotency_not_configured" }, 503);
    }

    log.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      provider: "stripe",
    });
    return serviceJson({ error: "webhook_processing_failed" }, 500);
  }
};
