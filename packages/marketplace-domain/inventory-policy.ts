import type { InventoryUpsertRecord } from "./inventory-contract";
import type { InventoryFreshnessStatus } from "./types";

export const requiredSupplierCapabilities = [
  "inventory.supply",
  "marketplace.publish",
] as const;

export const publicationBlockerCodes = [
  "organization_inactive",
  "organization_kyb_not_verified",
  "supplier_trust_not_verified",
  "capability_missing",
  "inventory_right_missing",
  "inventory_right_expired",
  "media_rights_invalid",
  "market_permission_missing",
  "market_permission_expired",
  "source_inactive",
  "offer_unavailable",
  "offer_stale",
  "vehicle_identity_disputed",
  "required_data_missing",
  "currency_unsupported",
  "moderation_hold",
] as const;

export type PublicationBlockerCode = (typeof publicationBlockerCodes)[number];

type AuthorizationStatus =
  | "pending"
  | "active"
  | "suspended"
  | "revoked"
  | "expired"
  | "rejected";

interface ExpiringAuthorization {
  expiresAt?: Date | null;
  status?: AuthorizationStatus | null;
}

export interface PublicationEligibilityInput {
  capabilityStatuses: Readonly<Record<string, ExpiringAuthorization | null>>;
  displayCurrencySupported: boolean;
  inventoryRight: ExpiringAuthorization | null;
  marketPermission: ExpiringAuthorization | null;
  mediaRights: ExpiringAuthorization | null;
  moderationHold: boolean;
  now?: Date;
  offer: {
    freshUntil: Date;
    status:
      | "draft"
      | "available"
      | "reserved"
      | "sold"
      | "withdrawn"
      | "stale"
      | "quarantined";
  };
  organization: {
    active: boolean;
    kybStatus:
      | "not_started"
      | "pending"
      | "in_review"
      | "verified"
      | "rejected"
      | "expired"
      | "suspended";
    supplierTrustStatus: "unverified" | "pending" | "verified" | "rejected";
  };
  requiredDataComplete: boolean;
  sourceStatus: "pending" | "active" | "paused" | "degraded" | "disabled";
  vehicleIdentityStatus: "provisional" | "canonical" | "disputed" | "merged";
}

export interface PublicationEligibilityResult {
  decision: "eligible" | "ineligible";
  reasonCodes: PublicationBlockerCode[];
}

const isActiveAuthorization = (
  authorization: ExpiringAuthorization | null | undefined,
  now: Date
) =>
  authorization?.status === "active" &&
  (!authorization.expiresAt || authorization.expiresAt > now);

const getAuthorizationBlocker = (
  authorization: ExpiringAuthorization | null,
  missing: PublicationBlockerCode,
  expired: PublicationBlockerCode,
  now: Date
) => {
  if (!authorization || authorization.status !== "active") {
    return missing;
  }

  if (authorization.expiresAt && authorization.expiresAt <= now) {
    return expired;
  }

  return null;
};

export const evaluatePublicationEligibility = (
  input: PublicationEligibilityInput
): PublicationEligibilityResult => {
  const now = input.now ?? new Date();
  const reasons: PublicationBlockerCode[] = [];

  if (!input.organization.active) {
    reasons.push("organization_inactive");
  }
  if (input.organization.kybStatus !== "verified") {
    reasons.push("organization_kyb_not_verified");
  }
  if (input.organization.supplierTrustStatus !== "verified") {
    reasons.push("supplier_trust_not_verified");
  }
  if (
    requiredSupplierCapabilities.some(
      (key) => !isActiveAuthorization(input.capabilityStatuses[key], now)
    )
  ) {
    reasons.push("capability_missing");
  }

  const rightsBlocker = getAuthorizationBlocker(
    input.inventoryRight,
    "inventory_right_missing",
    "inventory_right_expired",
    now
  );
  if (rightsBlocker) {
    reasons.push(rightsBlocker);
  }

  if (!isActiveAuthorization(input.mediaRights, now)) {
    reasons.push("media_rights_invalid");
  }

  const marketBlocker = getAuthorizationBlocker(
    input.marketPermission,
    "market_permission_missing",
    "market_permission_expired",
    now
  );
  if (marketBlocker) {
    reasons.push(marketBlocker);
  }

  if (input.sourceStatus !== "active" && input.sourceStatus !== "degraded") {
    reasons.push("source_inactive");
  }
  if (input.offer.status !== "available") {
    reasons.push("offer_unavailable");
  }
  if (input.offer.freshUntil <= now) {
    reasons.push("offer_stale");
  }
  if (input.vehicleIdentityStatus === "disputed") {
    reasons.push("vehicle_identity_disputed");
  }
  if (!input.requiredDataComplete) {
    reasons.push("required_data_missing");
  }
  if (!input.displayCurrencySupported) {
    reasons.push("currency_unsupported");
  }
  if (input.moderationHold) {
    reasons.push("moderation_hold");
  }

  return {
    decision: reasons.length === 0 ? "eligible" : "ineligible",
    reasonCodes: Array.from(new Set(reasons)),
  };
};

export const getInventoryFreshnessStatus = (
  freshUntil?: Date | string | null,
  now = new Date()
): InventoryFreshnessStatus => {
  if (!freshUntil) {
    return "unknown";
  }

  return new Date(freshUntil) > now ? "fresh" : "stale";
};

interface MissingReconciliationInput {
  complete: boolean;
  consecutiveMissingRuns: number;
  lastSeenAt: Date;
  minimumMissingAgeHours?: number;
  missingGraceRuns: number;
  mode: "full_snapshot" | "incremental";
  now?: Date;
  runStatus: "completed" | "completed_with_issues" | "failed";
  unsafeRejectedRows?: boolean;
}

export const shouldReconcileMissingRecord = (
  input: MissingReconciliationInput
) => {
  if (
    input.mode !== "full_snapshot" ||
    !input.complete ||
    input.runStatus !== "completed" ||
    input.unsafeRejectedRows
  ) {
    return false;
  }

  const now = input.now ?? new Date();
  const minimumAgeMilliseconds =
    (input.minimumMissingAgeHours ?? 24) * 60 * 60 * 1000;
  const oldEnough =
    now.getTime() - input.lastSeenAt.getTime() >= minimumAgeMilliseconds;
  const nextMissingRunCount = input.consecutiveMissingRuns + 1;

  return oldEnough && nextMissingRunCount >= input.missingGraceRuns;
};

const normalizeVin = (vin: string) => vin.trim().toUpperCase();

export const getCanonicalVehicleKey = (
  sourceKey: string,
  record: Pick<InventoryUpsertRecord, "externalId" | "vehicle">
) => {
  const vin = record.vehicle.vin ? normalizeVin(record.vehicle.vin) : undefined;

  return vin
    ? `vin:${vin}`
    : `source:${sourceKey.trim().toLowerCase()}:${record.externalId.trim()}`;
};
