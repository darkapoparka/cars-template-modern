export type WorkerCapability =
  | "auth_recovery"
  | "inventory_imports"
  | "inventory_reconciliation"
  | "kyb_retention"
  | "listing_media_cleanup"
  | "platform_liveness"
  | "verification_expiry";

interface ScheduledWorkerDelivery {
  readonly mode: "scheduled";
  readonly schedule: string;
}

interface DisabledWorkerDelivery {
  readonly activationRequirements: readonly string[];
  readonly mode: "disabled";
  readonly reason: string;
}

export interface RequiredWorkerContract {
  readonly capability: WorkerCapability;
  readonly delivery: DisabledWorkerDelivery | ScheduledWorkerDelivery;
  readonly id: string;
  readonly operationalConstraint: string;
  readonly path: `/cron/${string}`;
}

export const requiredWorkerManifest = [
  {
    capability: "platform_liveness",
    delivery: { mode: "scheduled", schedule: "0 1 * * *" },
    id: "keep-alive",
    operationalConstraint: "Daily Neon keep-alive only; not a readiness probe.",
    path: "/cron/keep-alive",
  },
  {
    capability: "auth_recovery",
    delivery: { mode: "scheduled", schedule: "*/10 * * * *" },
    id: "auth-recovery",
    operationalConstraint:
      "Requires a configured Clerk recovery adapter; fails closed otherwise.",
    path: "/cron/auth-recovery",
  },
  {
    capability: "inventory_imports",
    delivery: { mode: "scheduled", schedule: "*/5 * * * *" },
    id: "inventory-import-scans",
    operationalConstraint:
      "Requires the inventory scanner adapter and bounded worker leases.",
    path: "/cron/inventory-import-scans",
  },
  {
    capability: "inventory_imports",
    delivery: { mode: "scheduled", schedule: "*/5 * * * *" },
    id: "inventory-imports",
    operationalConstraint:
      "Requires private object storage; the worker owns overlap protection.",
    path: "/cron/inventory-imports",
  },
  {
    capability: "inventory_reconciliation",
    delivery: { mode: "scheduled", schedule: "*/15 * * * *" },
    id: "inventory-reconciliation",
    operationalConstraint:
      "Reconciles stale public inventory after source apply operations.",
    path: "/cron/inventory-reconciliation",
  },
  {
    capability: "verification_expiry",
    delivery: { mode: "scheduled", schedule: "15 * * * *" },
    id: "verification-expiry",
    operationalConstraint: "Revokes expired verification grants hourly.",
    path: "/cron/verification-expiry",
  },
  {
    capability: "inventory_imports",
    delivery: { mode: "scheduled", schedule: "15 2 * * *" },
    id: "inventory-import-retention",
    operationalConstraint:
      "Daily retention requires private storage and must preserve legal holds.",
    path: "/cron/inventory-import-retention",
  },
  {
    capability: "kyb_retention",
    delivery: { mode: "scheduled", schedule: "45 2 * * *" },
    id: "kyb-retention",
    operationalConstraint:
      "Daily KYB retention requires private storage and must preserve legal holds.",
    path: "/cron/kyb-retention",
  },
  {
    capability: "listing_media_cleanup",
    delivery: { mode: "scheduled", schedule: "0 3 * * *" },
    id: "listing-media-cleanup",
    operationalConstraint:
      "Runs after retention jobs and processes bounded cleanup leases.",
    path: "/cron/listing-media-cleanup",
  },
] as const satisfies readonly RequiredWorkerContract[];
