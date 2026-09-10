export type OrganizationDirectorySignalKind =
  | "claimed"
  | "business_verified"
  | "trusted_supplier"
  | "official_authorization"
  | "inventory_current"
  | "commercial_partner"
  | "unverified";

export interface OrganizationDirectorySignal {
  kind: OrganizationDirectorySignalKind;
  label: string;
}

export interface OrganizationDirectoryTradeLane {
  destinationLabel: string;
  detail?: string;
  id: string;
  originLabel: string;
}

export interface OrganizationDirectoryInventoryStatus {
  count: number;
  id: string;
  label: string;
}

export interface OrganizationDirectoryInventorySummary {
  statuses?: readonly OrganizationDirectoryInventoryStatus[];
  total: number;
  totalLabel: string;
  updatedLabel?: string;
}

export interface OrganizationDirectoryPreviewImage {
  alt: string;
  href?: string;
  id: string;
  priceLabel?: string;
  src: string;
  title?: string;
}

export interface OrganizationDirectoryAction {
  href: string;
  label: string;
}

export type OrganizationDirectoryProfileKind =
  | "dealer"
  | "distributor"
  | "importer"
  | "manufacturer"
  | "private_seller";

export interface OrganizationDirectoryCardData {
  badges?: readonly OrganizationDirectorySignal[];
  brands?: readonly string[];
  defaultAvatar?: {
    alt: string;
    src: string;
  };
  description?: string;
  headline?: string;
  id: string;
  inventory?: OrganizationDirectoryInventorySummary;
  inventoryAction?: OrganizationDirectoryAction;
  locationLabel?: string;
  logoAlt?: string;
  logoUrl?: string;
  name: string;
  previewImages?: readonly OrganizationDirectoryPreviewImage[];
  profileAction: OrganizationDirectoryAction;
  profileImage?: {
    alt: string;
    src: string;
  };
  services?: readonly string[];
  tradeLanes?: readonly OrganizationDirectoryTradeLane[];
  typeKind?: OrganizationDirectoryProfileKind;
  typeLabel: string;
}

export interface OrganizationDirectoryCardLabels {
  additionalBrands: string;
  brands: string;
  credentials: string;
  emptyInventory: string;
  emptyListingPreview: string;
  inventoryPreview: string;
  profile: string;
  to: string;
}

export interface OrganizationDirectoryCardProps {
  className?: string;
  compactDesktop?: boolean;
  desktopLayout?: "grid" | "list";
  labels?: Partial<OrganizationDirectoryCardLabels>;
  organization: OrganizationDirectoryCardData;
  priority?: boolean;
}
