import type { WorkspaceCapabilities } from "./components/sidebar";

interface WorkspaceCapabilityInput {
  readonly dealerCommerceEnabled: boolean;
  readonly hasDealerOrganization: boolean;
  readonly isAdmin: boolean;
}

export const getWorkspaceCapabilities = ({
  dealerCommerceEnabled,
  hasDealerOrganization,
  isAdmin,
}: WorkspaceCapabilityInput): WorkspaceCapabilities => ({
  admin: isAdmin,
  buyer: true,
  dealerCommerce: hasDealerOrganization && dealerCommerceEnabled,
  dealer: hasDealerOrganization,
  seller: true,
});
