import type { InventoryCredentialProvider } from "@repo/security/inventory-credentials";
import { unconfiguredInventoryCredentialProvider } from "@repo/security/inventory-credentials";
import type { InventoryArtifactScanner } from "@repo/storage/inventory-imports";
import { unconfiguredInventoryArtifactScanner } from "@repo/storage/inventory-imports";
import type { PrivateObjectStorageProvider } from "@repo/storage/private-documents";
import { unconfiguredPrivateStorageProvider } from "@repo/storage/private-documents";
import {
  autoDevExternalInventoryProvider,
  type ExternalInventoryProvider,
} from "./external-inventory-provider";

export { ExternalInventoryProviderError } from "./external-inventory-provider";

export interface ClerkRecoveryAdapter {
  readonly configured: boolean;
  readonly name: string;
  reconcileIdentityEvent(input: {
    readonly aggregateId: string;
    readonly eventType: string;
  }): Promise<
    | {
        readonly clerkOrgId: string;
        readonly displayName: string;
        readonly kind: "organization";
        readonly lifecycle: "active";
        readonly providerUpdatedAt: Date;
        readonly slug?: string | null;
      }
    | {
        readonly clerkOrgId: string;
        readonly kind: "organization";
        readonly lifecycle: "absent";
        readonly providerUpdatedAt: Date;
      }
    | {
        readonly clerkMembershipId: string;
        readonly clerkOrgId: string;
        readonly clerkSourceRole: string;
        readonly clerkUserId: string;
        readonly kind: "membership";
        readonly lifecycle: "active";
        readonly providerUpdatedAt: Date;
        readonly recognizedRole: boolean;
        readonly role: "owner" | "manager" | "sales" | "viewer";
      }
    | {
        readonly clerkMembershipId: string;
        readonly kind: "membership";
        readonly lifecycle: "absent";
        readonly providerUpdatedAt: Date;
      }
    | {
        readonly clerkUserId: string;
        readonly kind: "user";
        readonly lifecycle: "absent" | "active";
        readonly providerUpdatedAt: Date;
      }
  >;
  reconcileProvisioning(input: {
    readonly applicantClerkUserId: string;
    readonly clerkOrgId: string | null;
    readonly provisioningId: string;
  }): Promise<
    | { readonly status: "ambiguous" | "not_found" }
    | {
        readonly clerkMembershipId: string;
        readonly clerkOrgId: string;
        readonly clerkSourceRole: string;
        readonly clerkUserId: string;
        readonly status: "found";
      }
  >;
}

const unconfigured = {
  configured: false,
  name: "unconfigured",
} as const;

export const clerkRecoveryAdapter: ClerkRecoveryAdapter = {
  ...unconfigured,
  reconcileProvisioning: () =>
    Promise.reject(new Error("clerk_recovery_adapter_not_configured")),
  reconcileIdentityEvent: () =>
    Promise.reject(new Error("clerk_recovery_adapter_not_configured")),
};

export const privateObjectStorageProvider: PrivateObjectStorageProvider =
  unconfiguredPrivateStorageProvider;

export const inventoryArtifactScanner: InventoryArtifactScanner =
  unconfiguredInventoryArtifactScanner;

export const inventoryCredentialProvider: InventoryCredentialProvider =
  unconfiguredInventoryCredentialProvider;

export const externalInventoryProvider: ExternalInventoryProvider =
  autoDevExternalInventoryProvider;
