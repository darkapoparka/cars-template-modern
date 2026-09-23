import type { ListingViewMode, VehicleListing } from "@repo/marketplace";
import type { ListingOrganizationRole } from "./listing-truth";

export interface VehicleCardPriceInsight {
  detail?: string;
  label: string;
  tone?: "neutral" | "positive" | "caution";
}

export interface VehicleCardTrustSignal {
  id: string;
  label: string;
  tone?: "neutral" | "positive" | "caution";
}

export interface VehicleCardProps {
  density?: "default" | "compact";
  desktopHeadingLevel?: 2 | 3;
  desktopLayout?: "list" | "grid";
  href?: string;
  listing: VehicleListing;
  locale?: string;
  presentation?: "default" | "discovery" | "showroom";
  priceInsight?: VehicleCardPriceInsight;
  priority?: boolean;
  saveHref?: string;
  sellerOrganizationRole?: ListingOrganizationRole;
  trustSignals?: readonly VehicleCardTrustSignal[];
  viewMode?: ListingViewMode;
}
