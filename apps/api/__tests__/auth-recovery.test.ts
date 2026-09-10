import { beforeEach, describe, expect, test, vi } from "vitest";

const boundary = vi.hoisted(() => ({
  applyMembership: vi.fn(),
  applyMembershipAbsence: vi.fn(),
  applyOrganization: vi.fn(),
  applyOrganizationAbsence: vi.fn(),
  claimEvent: vi.fn(),
  claimProvisioning: vi.fn(),
  completeEvent: vi.fn(),
  disableAccount: vi.fn(),
  listEvents: vi.fn(),
  listProvisioning: vi.fn(),
  projectProvisioning: vi.fn(),
  recordManualReview: vi.fn(),
  recordRecoveredOrganization: vi.fn(),
  scheduleEvent: vi.fn(),
  scheduleProvisioning: vi.fn(),
}));

vi.mock("@repo/database/auth-sync", () => ({
  applyDealerMembershipSyncEvent: boundary.applyMembership,
  applyDealerMembershipAbsenceEvent: boundary.applyMembershipAbsence,
  applyDealerOrganizationSyncEvent: boundary.applyOrganization,
  applyDealerOrganizationAbsenceEvent: boundary.applyOrganizationAbsence,
  claimExternalIdentitySyncEvent: boundary.claimEvent,
  completeExternalIdentitySyncEvent: boundary.completeEvent,
  disableMarketplaceAccountFromClerk: boundary.disableAccount,
  listPendingExternalIdentitySyncEvents: boundary.listEvents,
  scheduleExternalIdentitySyncRetry: boundary.scheduleEvent,
}));
vi.mock("@repo/database/clerk-provisioning", () => ({
  claimRecoverableClerkProvisioning: boundary.claimProvisioning,
  listRecoverableClerkProvisioning: boundary.listProvisioning,
  projectClerkOrganizationProvisioning: boundary.projectProvisioning,
  recordClerkProvisioningManualReview: boundary.recordManualReview,
  recordRecoveredClerkOrganization: boundary.recordRecoveredOrganization,
  scheduleClerkProvisioningRetry: boundary.scheduleProvisioning,
}));

import {
  recoverClerkProvisioning,
  recoverExternalIdentitySync,
} from "../lib/auth-recovery";

const configuredAdapter = {
  configured: true,
  name: "test",
  reconcileIdentityEvent: vi.fn(),
  reconcileProvisioning: vi.fn(),
};

describe("auth durability recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boundary.listEvents.mockResolvedValue([]);
    boundary.listProvisioning.mockResolvedValue([]);
    boundary.claimEvent.mockImplementation(async (input) => ({
      ...input,
      aggregateId: "org_123456",
      attemptCount: 1,
      eventType: "organization.updated",
      providerEventId: "clerk_evt_claimed",
    }));
    boundary.claimProvisioning.mockImplementation(async (input) => ({
      applicantAccount: { clerkUserId: "user_123456" },
      attemptCount: 3,
      clerkOrgId: null,
      id: input.provisioningId,
    }));
    boundary.completeEvent.mockResolvedValue({ count: 1 });
    boundary.scheduleEvent.mockResolvedValue({ count: 1 });
    boundary.scheduleProvisioning.mockResolvedValue({ count: 1 });
    boundary.recordRecoveredOrganization.mockResolvedValue({ count: 1 });
    boundary.applyOrganization.mockResolvedValue({ applied: true });
  });

  test("fails closed without a Clerk reconcile adapter", async () => {
    const result = await recoverExternalIdentitySync(
      { configured: false, name: "unconfigured" } as never,
      10
    );
    expect(result.status).toBe("adapter_unconfigured");
    expect(boundary.listEvents).not.toHaveBeenCalled();
  });

  test("claims bounded inbox work and applies current organization truth", async () => {
    boundary.listEvents.mockResolvedValue([
      {
        aggregateId: "org_123456",
        attemptCount: 0,
        eventType: "organization.updated",
        id: "event_123456",
        providerEventId: "clerk_evt_1",
        status: "received",
        updatedAt: new Date("2026-07-13T09:59:00.000Z"),
      },
    ]);
    boundary.claimEvent.mockResolvedValue({
      aggregateId: "org_123456",
      attemptCount: 1,
      eventType: "organization.updated",
      id: "event_123456",
      providerEventId: "clerk_evt_1",
    });
    configuredAdapter.reconcileIdentityEvent.mockResolvedValue({
      clerkOrgId: "org_123456",
      displayName: "Dealer One",
      kind: "organization",
      lifecycle: "active",
      providerUpdatedAt: new Date("2026-07-13T10:00:00.000Z"),
    });
    const result = await recoverExternalIdentitySync(configuredAdapter, 10);
    expect(result).toMatchObject({ claimed: 1, failed: 0, processed: 1 });
    expect(boundary.listEvents).toHaveBeenCalledWith(10);
    expect(boundary.applyOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        eventKind: "active",
        providerEventId: "clerk_evt_1",
      })
    );
  });

  test("schedules durable retry codes without exposing provider errors", async () => {
    boundary.listEvents.mockResolvedValue([
      {
        aggregateId: "org_123456",
        attemptCount: 1,
        eventType: "organization.updated",
        id: "event_123456",
        providerEventId: "clerk_evt_2",
        status: "received",
        updatedAt: new Date("2026-07-13T09:59:00.000Z"),
      },
    ]);
    boundary.claimEvent.mockResolvedValue({
      aggregateId: "org_123456",
      attemptCount: 2,
      eventType: "organization.updated",
      id: "event_123456",
      providerEventId: "clerk_evt_2",
    });
    configuredAdapter.reconcileIdentityEvent.mockRejectedValue(
      new Error("raw provider secret")
    );
    const result = await recoverExternalIdentitySync(configuredAdapter, 10);
    expect(result.failed).toBe(1);
    expect(boundary.scheduleEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: "identity_reconcile_failed",
      })
    );
    expect(JSON.stringify(boundary.scheduleEvent.mock.calls)).not.toContain(
      "raw provider secret"
    );
  });

  test("reconciles an unknown-outcome Clerk organization without creating again", async () => {
    boundary.listProvisioning.mockResolvedValue([
      {
        attemptCount: 2,
        clerkOrgId: null,
        id: "provisioning_123456",
        status: "retry_scheduled",
        updatedAt: new Date("2026-07-13T09:59:00.000Z"),
      },
    ]);
    configuredAdapter.reconcileProvisioning.mockResolvedValue({
      status: "not_found",
    });
    const result = await recoverClerkProvisioning(configuredAdapter, 10);
    expect(result.failed).toBe(1);
    expect(configuredAdapter.reconcileProvisioning).toHaveBeenCalledWith(
      expect.objectContaining({ clerkOrgId: null })
    );
    expect(boundary.scheduleProvisioning).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: "clerk_create_outcome_unknown",
        expectedAttemptCount: 3,
      })
    );
  });

  test("uses current Clerk lifecycle instead of the stale queued event suffix", async () => {
    boundary.listEvents.mockResolvedValue([
      {
        aggregateId: "org_123456",
        attemptCount: 0,
        eventType: "organization.deleted",
        id: "event_123456",
        providerEventId: "clerk_evt_3",
        status: "received",
        updatedAt: new Date("2026-07-13T09:59:00.000Z"),
      },
    ]);
    boundary.claimEvent.mockResolvedValue({
      aggregateId: "org_123456",
      attemptCount: 1,
      eventType: "organization.deleted",
      id: "event_123456",
      providerEventId: "clerk_evt_3",
    });
    configuredAdapter.reconcileIdentityEvent.mockResolvedValue({
      clerkOrgId: "org_123456",
      displayName: "Dealer One",
      kind: "organization",
      lifecycle: "active",
      providerUpdatedAt: new Date("2026-07-13T10:00:00.000Z"),
    });

    await recoverExternalIdentitySync(configuredAdapter, 10);

    expect(boundary.applyOrganization).toHaveBeenCalledWith(
      expect.objectContaining({ eventKind: "active" })
    );
    expect(boundary.applyOrganizationAbsence).not.toHaveBeenCalled();
  });
});
