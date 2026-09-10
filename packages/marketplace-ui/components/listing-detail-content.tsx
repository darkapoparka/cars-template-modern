import { Button } from "@repo/design-system/components/ui/button";
import {
  buildMarketplaceSearchHref,
  getListingPath,
  type Money,
  type VehicleListing,
} from "@repo/marketplace";
import Link from "next/link";
import { getListingDetailCopy } from "../lib/listing-detail-policy";
import { getLocalizedPublicPath } from "../lib/public-path";
import { ListingDetailsTabs } from "./listing-details-tabs";
import { ListingEquipment } from "./listing-equipment";
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
        equipment={<ListingEquipment listing={listing} locale={locale} />}
        information={<ListingSpecs listing={listing} locale={locale} />}
        locale={locale}
        mobileDetails={
          <ListingSpecs listing={listing} locale={locale} variant="combined" />
        }
        overview={
          <section
            aria-label={copy.description}
            className="py-1 lg:rounded-xl lg:bg-control lg:px-5 lg:py-6"
            data-slot="listing-description"
          >
            <h2 className="hidden font-semibold text-card-title lg:block">
              {copy.description}
            </h2>
            <p className="whitespace-pre-line text-[15px] text-zinc-900 leading-6 lg:mt-3 lg:max-w-3xl lg:text-prose">
              {listing.description}
            </p>
            <p className="mt-3 max-w-2xl text-[13px] text-zinc-500 leading-5 lg:text-meta lg:text-muted-foreground">
              {copy.sellerDescription}
            </p>
          </section>
        }
        specifications={
          <ListingSpecs listing={listing} locale={locale} variant="details" />
        }
      />

      {priceIntelligence ? (
        <div className="py-5 lg:py-8">
          <ListingPriceIntelligence
            evidence={priceIntelligence}
            monthlyEstimate={listing.monthlyEstimate}
            price={price}
            priceType={listing.priceType}
          />
        </div>
      ) : null}

      {trustEvidence.length > 0 ? (
        <div className="py-5 lg:py-8">
          <ListingTrustPanel evidence={trustEvidence} />
        </div>
      ) : null}

      {relatedListings.length > 0 ? (
        <section aria-labelledby="similar-heading" className="py-6 lg:py-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-card-title" id="similar-heading">
              {copy.similarVehicles}
            </h2>
            <Button
              asChild
              className="h-11 rounded-lg lg:h-9"
              variant="secondary"
            >
              <Link href={backHref}>{copy.viewAll}</Link>
            </Button>
          </div>
          <div className="grid auto-cols-[82%] grid-flow-col gap-3 overflow-x-auto pb-2 [scrollbar-width:none] md:grid-flow-row md:grid-cols-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
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
