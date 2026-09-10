import type {
  ListingStatus,
  Money,
  OrganizationKybStatus,
  PriceType,
  SellerSummary,
  VehicleCategory,
  VehicleListingImage,
  VehicleLocation,
  VehicleSpec,
} from "./types";

export type DealerVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type DealerSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled";

export type DealerRole = "owner" | "manager" | "sales" | "viewer";

export type DealerMemberStatus = "active" | "invited" | "disabled";

export type LeadStatus =
  | "new"
  | "viewed"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "closed"
  | "spam";

export type LeadSource =
  | "listing"
  | "dealer_profile"
  | "saved_search"
  | "feed"
  | "qr"
  | "short_link"
  | "import";

export type LeadChannel =
  | "web_form"
  | "in_app"
  | "phone"
  | "email"
  | "dealer_feed";

export type LeadIntent =
  | "availability"
  | "finance"
  | "test_drive"
  | "trade_in"
  | "general";

export type ProviderJobStatus =
  | "queued"
  | "processing"
  | "done"
  | "failed"
  | "skipped"
  | "canceled";

export interface DealerOrgProfile {
  brandColor?: string;
  city?: string;
  clerkOrgId: string;
  country?: string;
  countryCode?: string;
  displayName: string;
  email?: string;
  id: string;
  kybStatus: OrganizationKybStatus;
  legalName?: string;
  logoUrl?: string;
  onboardingStatus:
    | "registered"
    | "profile_incomplete"
    | "kyb_pending"
    | "in_review"
    | "approved"
    | "rejected"
    | "suspended";
  orgType: "dealer" | "manufacturer" | "importer" | "distributor";
  phone?: string;
  region?: string;
  slug: string;
  subscriptionStatus: DealerSubscriptionStatus;
  verificationStatus: DealerVerificationStatus;
  websiteFeedEnabled: boolean;
  websiteUrl?: string;
}

export interface DealerMemberProfile {
  clerkUserId: string;
  dealerOrgId: string;
  id: string;
  role: DealerRole;
  status: DealerMemberStatus;
  userId?: string;
}

export interface LeadRecord {
  buyerName?: string;
  buyerUserId?: string;
  channel: LeadChannel;
  contactMethod: string;
  createdAt: string;
  dealerOrgId?: string;
  email?: string;
  id: string;
  intent?: LeadIntent;
  listingId?: string;
  message?: string;
  phone?: string;
  qualificationSummary?: string;
  score?: number;
  sellerProfileId?: string;
  source: LeadSource;
  status: LeadStatus;
  updatedAt: string;
}

export interface ListingGenerationRecord {
  createdAt: string;
  createdByUserId?: string;
  dealerOrgId: string;
  errorMessage?: string;
  generatedDescriptionBg?: string;
  generatedDescriptionEn?: string;
  generatedShortCopy?: string;
  generatedSocialCaption?: string;
  generatedTitle?: string;
  id: string;
  inputNotes?: string;
  inputPhotoUrls: string[];
  listingId?: string;
  model?: string;
  promptVersion: string;
  provider: string;
  status: ProviderJobStatus;
  updatedAt: string;
  vin?: string;
}

export interface ListingPhotoJobRecord {
  backdropPreset?: string;
  completedAt?: string;
  createdAt: string;
  dealerOrgId: string;
  errorMessage?: string;
  id: string;
  imageId?: string;
  listingId?: string;
  originalUrl: string;
  processedUrl?: string;
  provider: string;
  status: ProviderJobStatus;
  updatedAt: string;
}

export interface DealerInventoryRow {
  category: VehicleCategory;
  daysLive?: number;
  id: string;
  image?: VehicleListingImage;
  leadCount: number;
  location: VehicleLocation;
  monthlyEstimate?: Money;
  photoProcessingStatus?: ProviderJobStatus;
  price: Money;
  priceType: PriceType;
  publishedAt?: string;
  seller: SellerSummary;
  slug: string;
  sourceManaged: boolean;
  spec: VehicleSpec;
  status: ListingStatus;
  title: string;
  updatedAt: string;
}

export const isSourceManagedListing = (listing: {
  readonly inventoryOfferId?: string | null;
  readonly marketPublicationId?: string | null;
}): boolean => Boolean(listing.inventoryOfferId || listing.marketPublicationId);

export interface DealerFeedDealer {
  city: string;
  country: string;
  displayName: string;
  id: string;
  phone?: string;
  slug: string;
  verificationStatus: DealerVerificationStatus;
  websiteUrl?: string;
}

export interface DealerFeedRow {
  category: VehicleCategory;
  description: string;
  id: string;
  images: VehicleListingImage[];
  location: VehicleLocation;
  monthlyEstimate?: Money;
  price: Money;
  priceType: PriceType;
  publicUrl: string;
  publishedAt: string;
  slug: string;
  spec: VehicleSpec;
  title: string;
  updatedAt: string;
}

export interface DealerFeedResponse {
  dealer: DealerFeedDealer;
  feedVersion: "dealer-feed.phase1a.v1";
  generatedAt: string;
  listings: DealerFeedRow[];
}
