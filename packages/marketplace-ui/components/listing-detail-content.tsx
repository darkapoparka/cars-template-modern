import { Button } from "@repo/design-system/components/ui/button";
import {
  buildMarketplaceSearchHref,
  formatMoney,
  getListingPath,
  leadSite,
  type Money,
  type VehicleListing,
} from "@repo/marketplace";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
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
  const isBg = locale?.startsWith("bg") ?? false;
  let financingLabel = isBg ? "Лизинг и финансиране" : "Finance options";

  if (listing.monthlyEstimate) {
    financingLabel = `${isBg ? "Лизинг от" : "Finance from"} ~${formatMoney(listing.monthlyEstimate, locale)}/${copy.month}`;
  }

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
            <p className="whitespace-pre-line text-[16px] text-zinc-900 leading-6 lg:mt-3 lg:max-w-3xl lg:text-prose">
              {listing.description}
            </p>
            <p className="mt-4 max-w-2xl text-[13px] text-zinc-500 leading-5 lg:text-meta lg:text-muted-foreground">
              {copy.sellerDescription}
            </p>
          </section>
        }
        specifications={
          <ListingSpecs listing={listing} locale={locale} variant="details" />
        }
      />

      {listing.category === "car" ? (
        <div className="pb-5 lg:hidden">
          <Link
            className="group flex min-h-[76px] w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3.5 transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-200/80 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            href={`${getLocalizedPublicPath(locale, "/lease")}?vehicle=${encodeURIComponent(listing.id)}`}
          >
            <span className="relative block h-20 w-24 shrink-0 overflow-hidden rounded-lg">
              <Image
                alt=""
                className="object-cover object-right"
                fill
                sizes="96px"
                src={leadSite.financingArtworkPath}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[15px] text-zinc-950 leading-5">
                {financingLabel}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-zinc-600 leading-4">
                {isBg
                  ? "Виж условията и изпрати запитване"
                  : "View options and send an enquiry"}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-[18px] shrink-0 text-[var(--lead-site-accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>
      ) : null}

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
        <section
          aria-labelledby="similar-heading"
          className="my-5 rounded-2xl bg-zinc-100 px-4 py-5 lg:my-0 lg:rounded-none lg:bg-transparent lg:px-0 lg:py-8"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              className="font-semibold text-[19px] tracking-tight"
              id="similar-heading"
            >
              {copy.similarVehicles}
            </h2>
            <Button
              asChild
              className="h-11 gap-1 rounded-lg px-2 font-semibold text-[14px] text-zinc-600 shadow-none hover:bg-white hover:text-zinc-950 lg:h-9"
              variant="ghost"
            >
              <Link href={backHref}>
                {copy.viewAll}
                <ArrowRight aria-hidden="true" className="size-4" />
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
