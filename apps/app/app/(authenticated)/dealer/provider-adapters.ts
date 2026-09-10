import "server-only";

import {
  type InventoryCredentialProvider,
  unconfiguredInventoryCredentialProvider,
} from "@repo/security/inventory-credentials";
import {
  type PrivateObjectStorageProvider,
  unconfiguredPrivateStorageProvider,
} from "@repo/storage/private-documents";

export const dealerInventoryCredentialProvider: InventoryCredentialProvider =
  unconfiguredInventoryCredentialProvider;

export const dealerPrivateObjectStorageProvider: PrivateObjectStorageProvider =
  unconfiguredPrivateStorageProvider;

export const dealerProviderReadiness = Object.freeze({
  credentials:
    dealerInventoryCredentialProvider.name === "unconfigured"
      ? ("unconfigured" as const)
      : ("configured" as const),
  privateStorage:
    dealerPrivateObjectStorageProvider.name === "unconfigured"
      ? ("unconfigured" as const)
      : ("configured" as const),
});
