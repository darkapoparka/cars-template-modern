import {
  applyDealerMembershipAbsenceEvent,
  applyDealerMembershipSyncEvent,
  applyDealerOrganizationAbsenceEvent,
  applyDealerOrganizationSyncEvent,
  claimExternalIdentitySyncEvent,
  completeExternalIdentitySyncEvent,
  disableMarketplaceAccountFromClerk,
  listPendingExternalIdentitySyncEvents,
  scheduleExternalIdentitySyncRetry,
} from "@repo/database/auth-sync";
import {
  claimRecoverableClerkProvisioning,
  listRecoverableClerkProvisioning,
  projectClerkOrganizationProvisioning,
  recordClerkProvisioningManualReview,
  recordRecoveredClerkOrganization,
  scheduleClerkProvisioningRetry,
} from "@repo/database/clerk-provisioning";
import type { ClerkRecoveryAdapter } from "@/lib/provider-adapters";

const SAFE_ERROR_CODE_PATTERN = /^[a-z0-9_]{3,64}$/;

const retryAt = (attemptCount: number) =>
  new Date(Date.now() + Math.min(60, 2 ** Math.min(attemptCount, 8)) * 60_000);

const safeErrorCode = (error: unknown, fallback: string) => {
  const code =
    error instanceof Error && "code" in error ? String(error.code) : fallback;
  return SAFE_ERROR_CODE_PATTERN.test(code) ? code : fallback;
};

export const recoverExternalIdentitySync = async (
  adapter: ClerkRecoveryAdapter,
  limit = 50
) => {
  if (!adapter.configured) {
    return {
      claimed: 0,
      failed: 0,
      processed: 0,
      status: "adapter_unconfigured" as const,
    };
  }
  const events = await listPendingExternalIdentitySyncEvents(limit);
  let claimed = 0;
  let failed = 0;
  let processed = 0;
  for (const event of events) {
    const claim = await claimExternalIdentitySyncEvent({
      expectedStatus: event.status,
      expectedUpdatedAt: event.updatedAt,
      id: event.id,
    });
    if (!claim) {
      continue;
    }
    claimed += 1;
    try {
      const current = await adapter.reconcileIdentityEvent({
        aggregateId: event.aggregateId,
        eventType: event.eventType,
      });
      let applied = true;
      if (current.kind === "organization") {
        const result =
          current.lifecycle === "active"
            ? await applyDealerOrganizationSyncEvent({
                ...current,
                completeInboxEvent: false,
                eventKind: "active",
                providerEventId: event.providerEventId,
              })
            : await applyDealerOrganizationAbsenceEvent({
                clerkOrgId: current.clerkOrgId,
                providerEventId: event.providerEventId,
                providerUpdatedAt: current.providerUpdatedAt,
              });
        applied = result.applied;
      } else if (current.kind === "membership") {
        const result =
          current.lifecycle === "active"
            ? await applyDealerMembershipSyncEvent({
                ...current,
                completeInboxEvent: false,
                eventKind: "active",
                providerEventId: event.providerEventId,
              })
            : await applyDealerMembershipAbsenceEvent({
                clerkMembershipId: current.clerkMembershipId,
                providerEventId: event.providerEventId,
                providerUpdatedAt: current.providerUpdatedAt,
              });
        applied = Boolean(result?.applied);
      } else if (current.lifecycle === "absent") {
        await disableMarketplaceAccountFromClerk(current);
      }
      await completeExternalIdentitySyncEvent({
        attemptCount: claim.attemptCount,
        id: claim.id,
        status: applied ? "applied" : "ignored_stale",
      });
      processed += 1;
    } catch (error) {
      failed += 1;
      await scheduleExternalIdentitySyncRetry({
        attemptCount: claim.attemptCount,
        errorCode: safeErrorCode(error, "identity_reconcile_failed"),
        id: claim.id,
        nextAttemptAt: retryAt(claim.attemptCount),
      });
    }
  }
  return { claimed, failed, processed, status: "completed" as const };
};

export const recoverClerkProvisioning = async (
  adapter: ClerkRecoveryAdapter,
  limit = 25
) => {
  if (!adapter.configured) {
    return { failed: 0, processed: 0, status: "adapter_unconfigured" as const };
  }
  const attempts = await listRecoverableClerkProvisioning(limit);
  let failed = 0;
  let processed = 0;
  for (const attempt of attempts) {
    const claim = await claimRecoverableClerkProvisioning({
      expectedStatus: attempt.status,
      expectedUpdatedAt: attempt.updatedAt,
      provisioningId: attempt.id,
    });
    if (!claim) {
      continue;
    }
    try {
      const current = await adapter.reconcileProvisioning({
        applicantClerkUserId: claim.applicantAccount.clerkUserId,
        clerkOrgId: claim.clerkOrgId,
        provisioningId: claim.id,
      });
      if (current.status !== "found") {
        if (current.status === "ambiguous" || claim.attemptCount >= 5) {
          await recordClerkProvisioningManualReview({
            errorCode:
              current.status === "ambiguous"
                ? "clerk_create_outcome_ambiguous_manual_review"
                : "clerk_create_outcome_unknown_manual_review",
            expectedAttemptCount: claim.attemptCount,
            provisioningId: claim.id,
          });
        } else {
          await scheduleClerkProvisioningRetry({
            errorCode: "clerk_create_outcome_unknown",
            expectedAttemptCount: claim.attemptCount,
            nextAttemptAt: retryAt(claim.attemptCount),
            provisioningId: claim.id,
          });
        }
        failed += 1;
        continue;
      }
      if (!claim.clerkOrgId) {
        const recorded = await recordRecoveredClerkOrganization({
          clerkOrgId: current.clerkOrgId,
          expectedAttemptCount: claim.attemptCount,
          provisioningId: claim.id,
        });
        if (recorded.count !== 1) {
          continue;
        }
      }
      await projectClerkOrganizationProvisioning({
        ...current,
        expectedAttemptCount: claim.attemptCount,
        provisioningId: claim.id,
        recognizedRole: true,
        role: "owner",
      });
      processed += 1;
    } catch (error) {
      await scheduleClerkProvisioningRetry({
        errorCode: safeErrorCode(error, "clerk_reconcile_failed"),
        expectedAttemptCount: claim.attemptCount,
        nextAttemptAt: retryAt(claim.attemptCount),
        provisioningId: claim.id,
      });
      failed += 1;
    }
  }
  return { failed, processed, status: "completed" as const };
};
