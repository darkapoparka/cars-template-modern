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
import { formatListingMonthlyEstimate } from "../lib/listing-financing";
import { getLocalizedPublicPath } from "../lib/public-path";
import { ListingCtaBanner } from "./listing-cta-banner";
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
  const isBg = locale?.startsWith("bg") ?? false;
  const monthlyEstimate = listing.monthlyEstimate;
  const financingFallback = isBg ? "Лизинг и финансиране" : "Finance options";
  const financingAmount = formatListingMonthlyEstimate(monthlyEstimate, locale);
  const financingHeadline = isBg ? "Карай с лизинг" : "Drive it with finance";

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
        <div className="pb-5 lg:hidden">
          <ListingCtaBanner
            action={isBg ? "Виж условията" : "View options"}
            artwork={leadSite.financingArtworkPath}
            heading={financingAmount ? financingHeadline : financingFallback}
            href={`${getLocalizedPublicPath(locale, "/lease")}?vehicle=${encodeURIComponent(listing.id)}`}
            slot="listing-financing-card"
          >
            {financingAmount ? (
              <p className="flex flex-wrap items-baseline justify-center gap-x-1 font-medium text-price tabular-nums">
                <span>
                  {isBg ? "От" : "From"} ~{financingAmount}
                </span>
                <span className="text-meta">/{copy.month}</span>
              </p>
            ) : null}
          </ListingCtaBanner>
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
          className="-mx-2 my-5 rounded-2xl bg-zinc-100 px-2 py-4 lg:mx-0 lg:my-0 lg:rounded-none lg:bg-transparent lg:px-0 lg:py-8"
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
            className="grid auto-cols-[100%] grid-flow-col gap-3 overflow-x-auto pb-1 [scroll-snap-type:x_mandatory] [scrollbar-width:none] lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden [&>article]:snap-start"
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
