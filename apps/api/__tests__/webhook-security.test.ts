import { beforeEach, describe, expect, test, vi } from "vitest";

const webhookState = vi.hoisted(() => ({
  event: null as unknown,
}));

const organizationDatabase = vi.hoisted(() => ({
  applyDealerMembershipSyncEvent: vi.fn(),
  applyDealerOrganizationSyncEvent: vi.fn(),
  completeReceivedExternalIdentitySyncEvent: vi.fn(),
  disableMarketplaceAccountFromClerk: vi.fn(),
  hashExternalIdentityPayload: vi.fn(() => "payload-hash"),
  receiveExternalIdentitySyncEvent: vi.fn(),
}));

const analytics = {
  capture: vi.fn(),
  groupIdentify: vi.fn(),
  identify: vi.fn(),
  shutdown: vi.fn(async () => undefined),
};
const log = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};
const idempotencyValues = new Map<string, string>();

const idempotencyStore = {
  begin: vi.fn((scope: string, eventId: string, payloadHash: string) => {
    const key = `${scope}:${eventId}`;
    const existing = idempotencyValues.get(key);
    if (existing === `completed:${payloadHash}`) {
      return Promise.resolve({ status: "completed" as const });
    }
    if (existing && !existing.includes(payloadHash)) {
      return Promise.resolve({ status: "conflict" as const });
    }
    if (existing) {
      return Promise.resolve({ status: "in_progress" as const });
    }
    const processingValue = `processing:${payloadHash}:test`;
    idempotencyValues.set(key, processingValue);
    return Promise.resolve({
      key,
      payloadHash,
      processingValue,
      status: "acquired" as const,
    });
  }),
  complete: vi.fn((claim: { key: string; payloadHash: string }) => {
    idempotencyValues.set(claim.key, `completed:${claim.payloadHash}`);
    return Promise.resolve();
  }),
  release: vi.fn((claim: { key: string }) => {
    idempotencyValues.delete(claim.key);
    return Promise.resolve();
  }),
};

vi.mock("@/env", () => ({
  env: {
    CLERK_WEBHOOK_SECRET: "whsec_test",
  },
}));

vi.mock("@repo/analytics/server", () => ({ analytics }));
vi.mock("@repo/database/auth-sync", () => organizationDatabase);
vi.mock("@repo/observability/log", () => ({ log }));
vi.mock("@repo/rate-limit/idempotency", () => ({
  getIdempotencyStore: () => idempotencyStore,
}));
vi.mock("svix", () => ({
  Webhook: class {
    verify() {
      return webhookState.event;
    }
  },
}));

const clerkOrganization = {
  created_by: "user_owner",
  id: "org_1",
  name: "Dealer One",
  slug: "dealer-one",
};

const clerkMembership = {
  id: "orgmem_1",
  organization: clerkOrganization,
  public_user_data: { user_id: "user_member" },
  role: "org:admin",
  updated_at: 1_752_345_678_000,
};

const webhookRequest = (eventId: string) =>
  new Request("https://api.example/webhooks/auth", {
    body: "raw-signed-body",
    headers: {
      "svix-id": eventId,
      "svix-signature": "signature",
      "svix-timestamp": "1234567890",
    },
    method: "POST",
  });

describe("Clerk webhook security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analytics.shutdown.mockResolvedValue(undefined);
    idempotencyValues.clear();
    organizationDatabase.applyDealerMembershipSyncEvent.mockResolvedValue({
      applied: true,
    });
    organizationDatabase.applyDealerOrganizationSyncEvent.mockResolvedValue({
      id: "dealer_1",
    });
    webhookState.event = {
      data: {
        created_at: Date.now(),
        email_addresses: [{ email_address: "private@example.com" }],
        first_name: "Private",
        id: "user_1",
        image_url: "https://private.example/avatar.png",
        last_name: "Person",
        phone_numbers: [{ phone_number: "+359000000000" }],
      },
      type: "user.created",
    };
  });

  test("replay produces one mutation and logs no raw PII", async () => {
    const { POST } = await import("../app/webhooks/auth/route");

    const first = await POST(webhookRequest("msg_1"));
    const replay = await POST(webhookRequest("msg_1"));

    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(analytics.capture).toHaveBeenCalledTimes(1);
    expect(analytics.identify).toHaveBeenCalledTimes(1);
    expect(
      organizationDatabase.completeReceivedExternalIdentitySyncEvent
    ).toHaveBeenCalledOnce();
    expect(
      organizationDatabase.completeReceivedExternalIdentitySyncEvent
    ).toHaveBeenCalledWith("msg_1");

    const logged = JSON.stringify(log.info.mock.calls);
    const identified = JSON.stringify(analytics.identify.mock.calls);
    expect(logged).not.toContain("private@example.com");
    expect(logged).not.toContain("+359000000000");
    expect(logged).not.toContain("raw-signed-body");
    expect(identified).not.toContain("private@example.com");
    expect(identified).not.toContain("+359000000000");
  });

  test("acknowledges a completed core event when analytics flush fails", async () => {
    analytics.shutdown.mockRejectedValueOnce(new Error("analytics offline"));
    const { POST } = await import("../app/webhooks/auth/route");

    const response = await POST(webhookRequest("msg_analytics_offline"));
    await Promise.resolve();

    expect(response.status).toBe(200);
    expect(log.warn).toHaveBeenCalledWith("Optional analytics flush failed", {
      provider: "posthog",
    });
  });

  test.each([
    "organization.created",
    "organization.updated",
  ])("persists %s before completing the webhook", async (type) => {
    webhookState.event = { data: clerkOrganization, type };
    const { POST } = await import("../app/webhooks/auth/route");

    const response = await POST(webhookRequest(`msg_${type}`));

    expect(response.status).toBe(200);
    expect(
      organizationDatabase.applyDealerOrganizationSyncEvent
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkOrgId: "org_1",
        displayName: "Dealer One",
        slug: "dealer-one",
        eventKind: "active",
        providerEventId: `msg_${type}`,
      })
    );
  });

  test("soft-deletes the durable dealer organization", async () => {
    webhookState.event = {
      data: { deleted: true, id: "org_1", object: "organization" },
      type: "organization.deleted",
    };
    const { POST } = await import("../app/webhooks/auth/route");

    const response = await POST(webhookRequest("msg_org_deleted"));

    expect(response.status).toBe(200);
    expect(
      organizationDatabase.applyDealerOrganizationSyncEvent
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkOrgId: "org_1",
        eventKind: "deleted",
        providerEventId: "msg_org_deleted",
      })
    );
  });

  test.each([
    "organizationMembership.created",
    "organizationMembership.updated",
  ])("upserts the embedded organization before handling %s", async (type) => {
    webhookState.event = { data: clerkMembership, type };
    const { POST } = await import("../app/webhooks/auth/route");

    const response = await POST(webhookRequest(`msg_${type}`));

    expect(response.status).toBe(200);
    expect(
      organizationDatabase.applyDealerOrganizationSyncEvent
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkOrgId: "org_1",
        displayName: "Dealer One",
        slug: "dealer-one",
        eventKind: "active",
        providerEventId: `msg_${type}:organization`,
      })
    );
    expect(
      organizationDatabase.applyDealerMembershipSyncEvent
    ).toHaveBeenCalledWith({
      clerkMembershipId: "orgmem_1",
      clerkOrgId: "org_1",
      clerkUserId: "user_member",
      clerkSourceRole: "org:admin",
      providerEventId: `msg_${type}`,
      eventKind: "active",
      providerUpdatedAt: new Date(1_752_345_678_000),
      recognizedRole: true,
      role: "manager",
    });
    const organizationCallOrder =
      organizationDatabase.applyDealerOrganizationSyncEvent.mock
        .invocationCallOrder[0];
    const membershipCallOrder =
      organizationDatabase.applyDealerMembershipSyncEvent.mock
        .invocationCallOrder[0];
    if (!(organizationCallOrder && membershipCallOrder)) {
      throw new Error("Expected both durable organization mutations");
    }
    expect(organizationCallOrder).toBeLessThan(membershipCallOrder);
  });

  test("durably records a delete-before-create membership event after its embedded organization", async () => {
    webhookState.event = {
      data: clerkMembership,
      type: "organizationMembership.deleted",
    };
    const { POST } = await import("../app/webhooks/auth/route");

    const response = await POST(webhookRequest("msg_membership_deleted"));

    expect(response.status).toBe(200);
    expect(
      organizationDatabase.applyDealerOrganizationSyncEvent
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        clerkOrgId: "org_1",
        displayName: "Dealer One",
        slug: "dealer-one",
        eventKind: "active",
        providerEventId: "msg_membership_deleted:organization",
      })
    );
    expect(
      organizationDatabase.applyDealerMembershipSyncEvent
    ).toHaveBeenCalledWith({
      clerkMembershipId: "orgmem_1",
      clerkOrgId: "org_1",
      clerkUserId: "user_member",
      clerkSourceRole: "org:admin",
      providerEventId: "msg_membership_deleted",
      eventKind: "deleted",
      providerUpdatedAt: new Date(1_752_345_678_000),
      recognizedRole: true,
      role: "manager",
    });
    const organizationCallOrder =
      organizationDatabase.applyDealerOrganizationSyncEvent.mock
        .invocationCallOrder[0];
    const membershipCallOrder =
      organizationDatabase.applyDealerMembershipSyncEvent.mock
        .invocationCallOrder[0];
    expect(organizationCallOrder).toBeLessThan(membershipCallOrder ?? 0);
  });

  test("replayed organization webhooks mutate the durable database once", async () => {
    webhookState.event = {
      data: clerkOrganization,
      type: "organization.created",
    };
    const { POST } = await import("../app/webhooks/auth/route");

    const first = await POST(webhookRequest("msg_org_replay"));
    const replay = await POST(webhookRequest("msg_org_replay"));

    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(
      organizationDatabase.applyDealerOrganizationSyncEvent
    ).toHaveBeenCalledTimes(1);
  });
});
