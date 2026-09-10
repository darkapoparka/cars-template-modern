import type {
  OrganizationDirectoryCardData,
  OrganizationDirectoryCardLabels,
  OrganizationDirectorySignal,
  OrganizationDirectorySignalKind,
} from "./organization-directory-card-types";

export const defaultOrganizationDirectoryCardLabels: OrganizationDirectoryCardLabels = {
  additionalBrands: "additional brands",
  brands: "Brands",
  credentials: "Organization credentials",
  emptyInventory: "None available",
  emptyListingPreview: "No listing",
  inventoryPreview: "Representative inventory",
  profile: "Profile",
  to: "to",
};

const whitespacePattern = /\s+/;

export const getOrganizationInitials = (name: string) =>
  name
    .split(whitespacePattern)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AM";

const primarySignalPriority: readonly OrganizationDirectorySignalKind[] = [
  "official_authorization",
  "business_verified",
  "trusted_supplier",
  "commercial_partner",
  "unverified",
];

export const getFeaturedOrganizationSignals = (
  signals: readonly OrganizationDirectorySignal[],
  limit = 2
) =>
  primarySignalPriority
    .flatMap((kind) => signals.filter((signal) => signal.kind === kind))
    .slice(0, limit);

export const resolveOrganizationDirectoryCardData = (
  organization: OrganizationDirectoryCardData,
  providedLabels?: Partial<OrganizationDirectoryCardLabels>
) => ({
  badges: organization.badges ?? [],
  brands: organization.brands ?? [],
  labels: {
    ...defaultOrganizationDirectoryCardLabels,
    ...providedLabels,
  },
  previewImages: organization.previewImages ?? [],
  services: organization.services ?? [],
  tradeLanes: organization.tradeLanes ?? [],
});
