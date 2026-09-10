import { cn } from "@repo/design-system/lib/utils";
import {
  buildMarketplaceSearchHref,
  getCategoryPath,
  leadSite,
  type VehicleListing,
} from "@repo/marketplace";
import { getAccountListingSaveFlowHref } from "../lib/account-save-flow";
import {
  getListingContactAction,
  getPrimaryListingPrice,
  type ListingOrganizationRole,
} from "../lib/listing-truth";
import {
  cleanListingDetailBaseUrl,
  getListingDetailCopy,
  getListingReportHref,
} from "../lib/listing-detail-policy";
import { getLocalizedPublicPath } from "../lib/public-path";
import { getVehicleCardBadgeLabels } from "../lib/vehicle-card-policy";
import { ListingDetailContent } from "./listing-detail-content";
import {
  DesktopListingSummaryHeader,
  MobileListingGalleryActions,
  MobileListingSummary,
} from "./listing-detail-summary";
import { ListingGallery } from "./listing-gallery";
import { ListingLocation } from "./listing-location";
import type { PriceIntelligenceEvidence } from "./listing-price-intelligence";
import type { ListingTrustEvidence } from "./listing-trust-panel";
import { MarketplaceMasthead } from "./marketplace-masthead";
import { MobileContactBar } from "./mobile-contact-bar";
import { SellerContactPanel } from "./seller-contact-panel";

interface ListingDetailProps {
  readonly appBaseUrl?: string;
  readonly contactHref?: string;
  readonly destinationCountryCode?: string;
  readonly homeHref?: string;
  readonly listing: VehicleListing;
  readonly listingUrl: string;
  readonly locale?: string;
  readonly marketplaceHref?: string;
  readonly priceIntelligence?: PriceIntelligenceEvidence;
  readonly relatedListings?: readonly VehicleListing[];
  readonly sellerOrganizationRole?: ListingOrganizationRole;
  readonly sellerProfileHref?: string;
  readonly trustEvidence?: readonly ListingTrustEvidence[];
}

export const ListingDetail = ({
  appBaseUrl,
  contactHref,
  destinationCountryCode,
  homeHref,
  listing,
  listingUrl,
  locale,
  marketplaceHref,
  priceIntelligence,
  relatedListings = [],
  sellerOrganizationRole,
  sellerProfileHref,
  trustEvidence = [],
}: ListingDetailProps) => {
  const copy = getListingDetailCopy(locale);
  const reportHref = getListingReportHref(
    cleanListingDetailBaseUrl(appBaseUrl),
    listing
  );
  const backHref =
    marketplaceHref ??
    buildMarketplaceSearchHref(
      { category: listing.category },
      getLocalizedPublicPath(locale, getCategoryPath(listing.category))
    );
  const resolvedHomeHref = homeHref ?? getLocalizedPublicPath(locale, "/");
  const primaryPrice = getPrimaryListingPrice(listing);
  const hasFixedContactBar = Boolean(
    contactHref &&
      !getListingContactAction(listing, Boolean(contactHref), locale).disabled
  );
  const saveHref = getAccountListingSaveFlowHref(appBaseUrl, listing);
  const galleryBadges = getVehicleCardBadgeLabels(listing, locale, {
    featured: copy.featured,
    imported: copy.imported,
  });

  return (
    <main
      className={cn(
        "min-h-[100dvh] bg-background text-foreground lg:pb-10",
        hasFixedContactBar
          ? "pb-[calc(6rem+env(safe-area-inset-bottom))]"
          : "pb-[calc(1rem+env(safe-area-inset-bottom))]"
      )}
      data-slot="listing-detail"
    >
      <MarketplaceMasthead
        appBaseUrl={appBaseUrl}
        homeHref={resolvedHomeHref}
        locale={locale}
        variant="discovery"
      />

      <div className="mx-auto max-w-[96rem] lg:px-6 lg:py-4 xl:px-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(21rem,40%)] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_min(22rem,40%)] xl:gap-8">
          <div className="min-w-0">
            <DesktopListingSummaryHeader
              backHref={backHref}
              listing={listing}
              listingUrl={listingUrl}
              locale={locale}
              saveHref={saveHref}
            />

            <div className="relative w-full">
              <ListingGallery
                badges={galleryBadges}
                images={listing.images}
                key={listing.id}
                locale={locale}
                title={listing.title}
              />
              <MobileListingGalleryActions
                backHref={backHref}
                listing={listing}
                listingUrl={listingUrl}
                locale={locale}
                saveHref={saveHref}
              />
            </div>

            <article className="relative z-10 -mt-4 rounded-t-2xl bg-card px-4 lg:z-auto lg:mt-4 lg:rounded-none lg:bg-transparent lg:px-0">
              <MobileListingSummary
                listing={listing}
                locale={locale}
                sellerOrganizationRole={sellerOrganizationRole}
                sellerProfileHref={sellerProfileHref}
              />

              <ListingDetailContent
                backHref={backHref}
                destinationCountryCode={destinationCountryCode}
                listing={listing}
                locale={locale}
                price={primaryPrice}
                priceIntelligence={priceIntelligence}
                relatedListings={relatedListings}
                trustEvidence={trustEvidence}
              />
            </article>
          </div>

          <aside
            className="min-w-0 lg:sticky lg:top-4"
            data-slot="listing-purchase-column"
          >
            <div className="hidden lg:block">
              <SellerContactPanel
                contactHref={contactHref}
                listing={listing}
                locale={locale}
                reportHref={reportHref}
                sellerOrganizationRole={sellerOrganizationRole}
                sellerProfileHref={sellerProfileHref}
              />
            </div>
            {leadSite.staticDemoMode ? (
              <div className="lg:hidden">
                <ListingLocation locale={locale} />
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <MobileContactBar
        contactHref={contactHref}
        listing={listing}
        locale={locale}
        reportHref={reportHref}
      />
    </main>
  );
};
