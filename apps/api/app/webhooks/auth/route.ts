import { analytics } from "@repo/analytics/server";
import { mapClerkOrganizationRole } from "@repo/auth/organization-roles";
import type {
  DeletedObjectJSON,
  OrganizationJSON,
  OrganizationMembershipJSON,
  UserJSON,
  WebhookEvent,
} from "@repo/auth/server";
import {
  applyDealerMembershipSyncEvent,
  applyDealerOrganizationSyncEvent,
  completeReceivedExternalIdentitySyncEvent,
  disableMarketplaceAccountFromClerk,
  hashExternalIdentityPayload,
  receiveExternalIdentitySyncEvent,
} from "@repo/database/auth-sync";
import { log } from "@repo/observability/log";
import { RateLimitConfigurationError } from "@repo/rate-limit";
import { Webhook } from "svix";
import { env } from "@/env";
import { flushAnalyticsBestEffort } from "@/lib/analytics";
import {
  hashIdempotentWebhookPayload,
  processIdempotentWebhook,
} from "@/lib/idempotent-webhook";
import { serviceJson } from "@/lib/service-auth";
import {
  readBoundedWebhookBody,
  WebhookPayloadTooLargeError,
} from "@/lib/webhook-body";

const eventProperties = (eventId: string) => ({
  $insert_id: eventId,
});

const toDealerOrganizationInput = (data: OrganizationJSON) => ({
  clerkOrgId: data.id,
  displayName: data.name,
  slug: data.slug,
});

const providerDate = (value: unknown, fallback = Date.now()): Date => {
  const date = new Date(
    typeof value === "number" || typeof value === "string" ? value : fallback
  );
  return Number.isNaN(date.getTime()) ? new Date(fallback) : date;
};

const getAggregateType = (
  eventType: WebhookEvent["type"]
): "membership" | "organization" | "user" => {
  if (eventType.startsWith("organizationMembership.")) {
    return "membership";
  }

  if (eventType.startsWith("organization.")) {
    return "organization";
  }

  return "user";
};

const getEventIdentity = (event: WebhookEvent) => {
  const data = event.data as {
    id?: string | null;
    organization?: { id?: string | null };
    updated_at?: unknown;
    created_at?: unknown;
  };
  return {
    aggregateId: data.id ?? data.organization?.id ?? "unknown",
    aggregateType: getAggregateType(event.type),
    providerOccurredAt: providerDate(data.updated_at ?? data.created_at),
  } as const;
};

const getOrganizationCreatorId = (data: OrganizationJSON) => {
  const createdBy = (data as OrganizationJSON & { created_by?: unknown })
    .created_by;

  return typeof createdBy === "string" && createdBy ? createdBy : null;
};

const requireMembershipUserId = (data: OrganizationMembershipJSON) => {
  const userId = data.public_user_data?.user_id;
  if (!userId) {
    throw new Error("Clerk organization membership has no user ID");
  }

  return userId;
};

const handleUserCreated = (data: UserJSON, eventId: string) => {
  analytics?.identify({
    distinctId: data.id,
    properties: {
      createdAt: new Date(data.created_at),
    },
  });

  analytics?.capture({
    distinctId: data.id,
    event: "User Created",
    properties: eventProperties(eventId),
  });
};

const handleUserUpdated = (data: UserJSON, eventId: string) => {
  analytics?.identify({
    distinctId: data.id,
    properties: {
      updatedAt: new Date(),
    },
  });

  analytics?.capture({
    distinctId: data.id,
    event: "User Updated",
    properties: eventProperties(eventId),
  });
};

const handleUserDeleted = (data: DeletedObjectJSON, eventId: string) => {
  if (!data.id) {
    return;
  }

  analytics?.identify({
    distinctId: data.id,
    properties: {
      deletedAt: new Date(),
    },
  });

  analytics?.capture({
    distinctId: data.id,
    event: "User Deleted",
    properties: eventProperties(eventId),
  });
};

const handleOrganizationCreated = async (
  data: OrganizationJSON,
  eventId: string
) => {
  const input = toDealerOrganizationInput(data);
  await applyDealerOrganizationSyncEvent({
    ...input,
    eventKind: "active",
    providerEventId: eventId,
    providerUpdatedAt: providerDate(
      (data as OrganizationJSON & { updated_at?: unknown }).updated_at
    ),
  });
  const createdBy = getOrganizationCreatorId(data);

  analytics?.groupIdentify({
    distinctId: createdBy ?? data.id,
    groupKey: data.id,
    groupType: "company",
  });

  if (createdBy) {
    analytics?.capture({
      distinctId: createdBy,
      event: "Organization Created",
      properties: eventProperties(eventId),
    });
  }
};

const handleOrganizationUpdated = async (
  data: OrganizationJSON,
  eventId: string
) => {
  const input = toDealerOrganizationInput(data);
  await applyDealerOrganizationSyncEvent({
    ...input,
    eventKind: "active",
    providerEventId: eventId,
    providerUpdatedAt: providerDate(
      (data as OrganizationJSON & { updated_at?: unknown }).updated_at
    ),
  });
  const createdBy = getOrganizationCreatorId(data);

  analytics?.groupIdentify({
    distinctId: createdBy ?? data.id,
    groupKey: data.id,
    groupType: "company",
  });

  if (createdBy) {
    analytics?.capture({
      distinctId: createdBy,
      event: "Organization Updated",
      properties: eventProperties(eventId),
    });
  }
};

const handleOrganizationDeleted = async (
  data: DeletedObjectJSON,
  eventId: string
) => {
  if (!data.id) {
    throw new Error("Clerk organization deletion has no organization ID");
  }

  await applyDealerOrganizationSyncEvent({
    clerkOrgId: data.id,
    displayName: "Deleted organization",
    eventKind: "deleted",
    providerEventId: eventId,
    providerUpdatedAt: providerDate(
      (data as DeletedObjectJSON & { deleted_at?: unknown }).deleted_at
    ),
  });
};

const handleOrganizationMembershipUpserted = async (
  data: OrganizationMembershipJSON,
  eventId: string,
  analyticsEvent: "Organization Member Created" | "Organization Member Updated"
) => {
  const userId = requireMembershipUserId(data);
  const mappedRole = mapClerkOrganizationRole(data.role);

  // Clerk does not guarantee organization and membership webhook ordering.
  await applyDealerOrganizationSyncEvent({
    ...toDealerOrganizationInput(data.organization),
    eventKind: "active",
    providerEventId: `${eventId}:organization`,
    providerUpdatedAt: providerDate(data.updated_at),
  });
  await applyDealerMembershipSyncEvent({
    clerkMembershipId: data.id,
    clerkOrgId: data.organization.id,
    clerkUserId: userId,
    providerEventId: eventId,
    eventKind: "active",
    clerkSourceRole: mappedRole.clerkRole,
    recognizedRole: mappedRole.recognized,
    role: mappedRole.durableRole,
    providerUpdatedAt: new Date(data.updated_at),
  });

  analytics?.groupIdentify({
    distinctId: userId,
    groupKey: data.organization.id,
    groupType: "company",
  });

  analytics?.capture({
    distinctId: userId,
    event: analyticsEvent,
    properties: eventProperties(eventId),
  });
};

const handleOrganizationMembershipDeleted = async (
  data: OrganizationMembershipJSON,
  eventId: string
) => {
  const userId = requireMembershipUserId(data);
  const mappedRole = mapClerkOrganizationRole(data.role);

  // A delete can arrive before the corresponding organization webhook.
  await applyDealerOrganizationSyncEvent({
    ...toDealerOrganizationInput(data.organization),
    eventKind: "active",
    providerEventId: `${eventId}:organization`,
    providerUpdatedAt: providerDate(data.updated_at),
  });
  await applyDealerMembershipSyncEvent({
    clerkMembershipId: data.id,
    clerkOrgId: data.organization.id,
    clerkUserId: userId,
    providerEventId: eventId,
    eventKind: "deleted",
    clerkSourceRole: mappedRole.clerkRole,
    recognizedRole: mappedRole.recognized,
    role: mappedRole.durableRole,
    providerUpdatedAt: new Date(data.updated_at),
  });

  analytics?.capture({
    distinctId: userId,
    event: "Organization Member Deleted",
    properties: eventProperties(eventId),
  });
};

const processEvent = async (
  event: WebhookEvent,
  eventId: string,
  body: string
) => {
  const identity = getEventIdentity(event);
  await receiveExternalIdentitySyncEvent({
    ...identity,
    eventType: event.type,
    payloadHash: hashExternalIdentityPayload(body),
    providerEventId: eventId,
  });
  switch (event.type) {
    case "user.created": {
      handleUserCreated(event.data, eventId);
      break;
    }
    case "user.updated": {
      handleUserUpdated(event.data, eventId);
      break;
    }
    case "user.deleted": {
      handleUserDeleted(event.data, eventId);
      if (event.data.id) {
        await disableMarketplaceAccountFromClerk({
          clerkUserId: event.data.id,
          providerUpdatedAt: identity.providerOccurredAt,
        });
      }
      break;
    }
    case "organization.created": {
      await handleOrganizationCreated(event.data, eventId);
      break;
    }
    case "organization.updated": {
      await handleOrganizationUpdated(event.data, eventId);
      break;
    }
    case "organization.deleted": {
      await handleOrganizationDeleted(event.data, eventId);
      break;
    }
    case "organizationMembership.created": {
      await handleOrganizationMembershipUpserted(
        event.data,
        eventId,
        "Organization Member Created"
      );
      break;
    }
    case "organizationMembership.updated": {
      await handleOrganizationMembershipUpserted(
        event.data,
        eventId,
        "Organization Member Updated"
      );
      break;
    }
    case "organizationMembership.deleted": {
      await handleOrganizationMembershipDeleted(event.data, eventId);
      break;
    }
    default: {
      log.info("Unhandled Clerk webhook event", {
        eventId,
        eventType: event.type,
        provider: "clerk",
      });
    }
  }

  await completeReceivedExternalIdentitySyncEvent(eventId);

  flushAnalyticsBestEffort();
};

export const POST = async (request: Request): Promise<Response> => {
  if (!env.CLERK_WEBHOOK_SECRET) {
    return serviceJson({ error: "webhook_not_configured" }, 503);
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!(svixId && svixTimestamp && svixSignature)) {
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
  let event: WebhookEvent;

  try {
    event = new Webhook(env.CLERK_WEBHOOK_SECRET).verify(body, {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    }) as WebhookEvent;
  } catch {
    log.warn("Clerk webhook signature rejected", {
      eventId: svixId,
      payloadHash: hashIdempotentWebhookPayload(body),
      provider: "clerk",
    });
    return serviceJson({ error: "invalid_webhook_signature" }, 400);
  }

  log.info("Webhook received", {
    eventId: svixId,
    eventType: event.type,
    provider: "clerk",
  });

  try {
    const result = await processIdempotentWebhook({
      eventId: svixId,
      payloadHash: hashIdempotentWebhookPayload(body),
      process: () => processEvent(event, svixId, body),
      scope: "clerk",
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
      log.error("Clerk webhook idempotency is not configured", {
        eventId: svixId,
        eventType: event.type,
        provider: "clerk",
      });
      return serviceJson({ error: "webhook_idempotency_not_configured" }, 503);
    }

    log.error("Clerk webhook processing failed", {
      eventId: svixId,
      eventType: event.type,
      provider: "clerk",
    });
    return serviceJson({ error: "webhook_processing_failed" }, 500);
  }
};
