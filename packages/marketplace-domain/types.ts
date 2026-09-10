export type VehicleCategory = "car" | "truck" | "motorbike" | "van" | "lease";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "sold"
  | "expired"
  | "rejected"
  | "archived";

export type SellerType = "private" | "dealer";

export type PriceType =
  | "fixed"
  | "negotiable"
  | "lease_monthly"
  | "finance_estimate";

export type PriceCurrency = "BGN" | "EUR";

export type CurrencyCode = string;

export type FuelType =
  | "gasoline"
  | "diesel"
  | "hybrid"
  | "plug_in_hybrid"
  | "electric"
  | "lpg"
  | "cng"
  | "other";

export type Transmission = "automatic" | "manual" | "semi_automatic";

export type BodyType =
  | "hatchback"
  | "sedan"
  | "wagon"
  | "suv"
  | "coupe"
  | "convertible"
  | "pickup"
  | "van"
  | "minibus"
  | "motorcycle"
  | "scooter"
  | "truck"
  | "other";

export type ListingBadge =
  | "new"
  | "used"
  | "certified"
  | "verified"
  | "lease"
  | "promoted";

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export type InventorySourceKind =
  | "legacy"
  | "manual"
  | "csv"
  | "json"
  | "https_feed"
  | "api"
  | "webhook"
  | "sftp"
  | "dms";

export type InventoryFreshnessStatus = "fresh" | "stale" | "unknown";

export type DeliveryEligibilityStatus =
  | "eligible"
  | "quote_required"
  | "unavailable"
  | "unknown";

export type PriceConversionStatus =
  | "native"
  | "converted_estimate"
  | "unavailable";

export type LandedCostStatus =
  | "not_calculated"
  | "quote_required"
  | "unavailable"
  | "unknown";

export type OrganizationKybStatus =
  | "not_started"
  | "pending"
  | "in_review"
  | "verified"
  | "rejected"
  | "expired"
  | "suspended";

export interface VehicleSupplySummary {
  convertedPrice?: Money;
  delivery: {
    destinationCountryCode?: string;
    eligibleCountryCodes: string[];
    status: DeliveryEligibilityStatus;
  };
  documentCount: number;
  landedCostStatus: LandedCostStatus;
  nativePrice: Money;
  origin: VehicleLocation & { countryCode: string };
  priceConversion: {
    convertedAt?: string;
    status: PriceConversionStatus;
  };
  provenance: {
    externalReference?: string;
    freshUntil?: string;
    freshnessStatus: InventoryFreshnessStatus;
    lastConfirmedAt?: string;
    sourceDisplayName?: string;
    sourceKind: InventorySourceKind;
  };
  supplier: {
    kybStatus?: OrganizationKybStatus;
    orgType?: "dealer" | "manufacturer" | "importer" | "distributor";
    trustStatus?: "unverified" | "pending" | "verified" | "rejected";
    verifiedImporter: boolean;
  };
}

export interface VehicleLocation {
  city: string;
  country: string;
  region?: string;
}

export interface VehicleSpec {
  bodyType: BodyType;
  colorExterior?: string;
  derivative?: string;
  enginePowerHp?: number;
  fuelType: FuelType;
  make: string;
  mileageUnit: "km";
  mileageValue: number;
  model: string;
  transmission: Transmission;
  trim?: string;
  year: number;
}

export interface SellerSummary {
  city: string;
  displayName: string;
  id: string;
  logoUrl?: string;
  type: SellerType;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
}

export interface VehicleListingImage {
  alt: string;
  url: string;
}

export interface VehicleFeature {
  bg: string;
  en: string;
}

export interface VehicleListing {
  badges: ListingBadge[];
  category: VehicleCategory;
  dealerOrgId?: string;
  delivery?: VehicleSupplySummary["delivery"];
  description: string;
  features?: readonly VehicleFeature[];
  id: string;
  images: VehicleListingImage[];
  location: VehicleLocation;
  monthlyEstimate?: Money;
  price: Money;
  priceType: PriceType;
  promoted: boolean;
  publishedAt: string;
  seller: SellerSummary;
  slug: string;
  spec: VehicleSpec;
  status: ListingStatus;
  supply?: VehicleSupplySummary;
  title: string;
}

export type ListingViewMode = "list" | "grid";
