import { Button } from "@repo/design-system/components/ui/button";
import {
  buildMarketplaceSearchHref,
  getListingPath,
  leadSite,
  type Money,
  type VehicleListing,
} from "@repo/marketplace";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { getListingDetailCopy } from "../lib/listing-detail-policy";
import { formatListingMonthlyEstimate } from "../lib/listing-financing";
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
import Image from "./public-image";
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
          <Link
            className="group relative flex min-h-[156px] w-full overflow-hidden rounded-xl bg-brand p-4 text-brand-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            data-slot="listing-financing-card"
            href={`${getLocalizedPublicPath(locale, "/lease")}?vehicle=${encodeURIComponent(listing.id)}`}
          >
            <Image
              alt=""
              className="object-cover object-center"
              fill
              sizes="(max-width: 1023px) calc(100vw - 32px), 0px"
              src={leadSite.financingArtworkPath}
            />
            <span className="relative z-10 flex w-[48%] flex-col items-start gap-3">
              <span className="relative block aspect-[1780/512] w-28">
                <Image
                  alt=""
                  className="h-full w-full object-contain [clip-path:inset(0_68%_0_0)]"
                  height={512}
                  sizes="112px"
                  src={leadSite.logoPath}
                  width={1780}
                />
                <Image
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain brightness-0 invert [clip-path:inset(0_0_0_32%)]"
                  height={512}
                  sizes="112px"
                  src={leadSite.logoPath}
                  width={1780}
                />
              </span>
              <span className="block font-semibold text-dialog-title tracking-heading">
                {financingAmount ? (
                  <>
                    <span className="block">
                      {isBg ? "Лизинг от" : "Finance from"}
                    </span>
                    <span className="block whitespace-nowrap">
                      ~{financingAmount}
                      <span className="font-medium text-meta">
                        /{copy.month}
                      </span>
                    </span>
                  </>
                ) : (
                  financingFallback
                )}
              </span>
              <span className="mt-auto inline-flex items-center gap-1.5 font-medium text-meta">
                {isBg ? "Виж условията" : "View options"}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </span>
          </Link>
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
          className="my-5 rounded-2xl bg-zinc-100 px-4 py-5 lg:my-0 lg:rounded-none lg:bg-transparent lg:px-0 lg:py-8"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2
              className="whitespace-nowrap font-semibold text-section-title tracking-heading"
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
          <div className="grid auto-cols-[80%] grid-flow-col gap-3 overflow-x-auto pb-1 [scrollbar-width:none] md:grid-flow-row md:grid-cols-3 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
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
