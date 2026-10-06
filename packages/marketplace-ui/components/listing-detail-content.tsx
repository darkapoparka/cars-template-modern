import { Button } from "@repo/design-system/components/ui/button";
import {
  buildMarketplaceSearchHref,
  getListingPath,
  leadSite,
  type Money,
  type VehicleListing,
} from "@repo/marketplace";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getListingDetailCopy } from "../lib/listing-detail-policy";
import { getLocalizedPublicPath } from "../lib/public-path";
import { ListingDetailsTabs } from "./listing-details-tabs";
import { ListingEquipment } from "./listing-equipment";
import { ListingFinanceCard } from "./listing-finance-card";
import { ListingPhotoGrid } from "./listing-photo-grid";
import {
  ListingPriceIntelligence,
  type PriceIntelligenceEvidence,
} from "./listing-price-intelligence";
import { ListingSpecs } from "./listing-specs";
import {
  type ListingTrustEvidence,
  ListingTrustPanel,
} from "./listing-trust-panel";
import { RelatedListingCard } from "./related-listing-card";

export const ListingDetailContent = ({
  backHref,
  destinationCountryCode,
  listing,
  locale,
  price,
  priceIntelligence,
  relatedListings,
  trustEvidence,
}: {
  backHref: string;
  destinationCountryCode?: string;
  listing: VehicleListing;
  locale?: string;
  price: Money;
  priceIntelligence?: PriceIntelligenceEvidence;
  relatedListings: readonly VehicleListing[];
  trustEvidence: readonly ListingTrustEvidence[];
}) => {
  const copy = getListingDetailCopy(locale);

  return (
    <>
      <ListingDetailsTabs
        desktopLayout={isDealershipSite ? "sections" : "tabs"}
        equipment={<ListingEquipment listing={listing} locale={locale} />}
        information={<ListingSpecs listing={listing} locale={locale} />}
        key={listing.id}
        locale={locale}
        mobileDetails={
          <div className="space-y-4">
            <ListingSpecs
              listing={listing}
              locale={locale}
              variant="combined"
            />
            <ListingEquipment
              listing={listing}
              locale={locale}
              variant="mobile"
            />
            {listing.description.trim() ? (
              <section
                aria-label={copy.description}
                data-slot="listing-mobile-description"
              >
                <p className="whitespace-pre-line text-compact-control text-zinc-600 leading-6">
                  {listing.description}
                </p>
              </section>
            ) : null}
          </div>
        }
        mobilePhotos={
          <ListingPhotoGrid
            images={listing.images}
            key={listing.id}
            locale={locale}
            title={listing.title}
          />
        }
        overview={
          <section
            aria-label={copy.description}
            className="py-1 lg:rounded-xl lg:bg-control lg:px-5 lg:py-6"
            data-slot="listing-description"
          >
            <h2 className="hidden font-semibold text-card-title-lg lg:block">
              {copy.description}
            </h2>
            <p className="whitespace-pre-line font-normal text-compact-control text-zinc-600 leading-6 lg:mt-3 lg:max-w-3xl lg:text-prose lg:text-zinc-900">
              {listing.description}
            </p>
            {isDealershipSite ? null : (
              <p className="mt-4 max-w-2xl text-meta text-zinc-500 lg:text-muted-foreground">
                {copy.sellerDescription}
              </p>
            )}
          </section>
        }
        specifications={
          <ListingSpecs listing={listing} locale={locale} variant="details" />
        }
      />

      {listing.category === "car" ? (
        <div className="pt-1 pb-2 lg:hidden">
          <ListingFinanceCard
            artwork={
              leadSite.mobileFinancingArtworkPath ??
              leadSite.financingArtworkPath
            }
            href={`${getLocalizedPublicPath(locale, "/lease")}?vehicle=${encodeURIComponent(listing.id)}`}
            locale={locale}
          />
        </div>
      ) : null}

      {priceIntelligence ? (
        <div className="py-5 lg:py-8">
          <ListingPriceIntelligence
            evidence={priceIntelligence}
            locale={locale}
            monthlyEstimate={listing.monthlyEstimate}
            price={price}
            priceType={listing.priceType}
          />
        </div>
      ) : null}

      {trustEvidence.length > 0 ? (
        <div className="py-5 lg:py-8">
          <ListingTrustPanel evidence={trustEvidence} locale={locale} />
        </div>
      ) : null}

      {relatedListings.length > 0 ? (
        <section
          aria-labelledby="similar-heading"
          className="my-6 lg:my-0 lg:py-8"
          data-slot="listing-related"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2
              className="min-w-0 font-semibold text-card-title-lg tracking-heading [overflow-wrap:anywhere] lg:text-section-title lg:[overflow-wrap:normal]"
              id="similar-heading"
            >
              {copy.similarVehicles}
            </h2>
            <Button
              asChild
              className="size-11 shrink-0 rounded-lg p-0 text-zinc-600 shadow-none hover:bg-white hover:text-zinc-950 lg:size-9"
              variant="ghost"
            >
              <Link aria-label={copy.viewAll} href={backHref}>
                <ArrowRight aria-hidden="true" className="size-5" />
              </Link>
            </Button>
          </div>
          <div
            className="grid auto-cols-[100%] grid-flow-col gap-3 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible lg:pb-0 min-[360px]:auto-cols-[max(17rem,calc(100%-3rem))] [&::-webkit-scrollbar]:hidden [&>article]:snap-start"
            data-slot="listing-related-rail"
          >
            {relatedListings.map((relatedListing) => (
              <RelatedListingCard
                href={buildMarketplaceSearchHref(
                  { deliverTo: destinationCountryCode },
                  getLocalizedPublicPath(locale, getListingPath(relatedListing))
                )}
                key={relatedListing.id}
                listing={relatedListing}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
};
