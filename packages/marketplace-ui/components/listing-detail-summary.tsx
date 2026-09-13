import { Button } from "@repo/design-system/components/ui/button";
import { formatMoney, leadSite, type VehicleListing } from "@repo/marketplace";
import { ArrowLeft, ArrowUpRight, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getListingDetailCopy } from "../lib/listing-detail-policy";
import { formatListingMonthlyEstimate } from "../lib/listing-financing";
import {
  formatTruthDateTime,
  formatVehicleLocation,
  getApproximateConvertedPrice,
  getDeliveryTruth,
  getListingSellerRole,
  getListingSellerRoleLabel,
  getListingSellerTrustKind,
  getListingSellerTrustLabel,
  getPhysicalVehicleLocation,
  getPrimaryListingPrice,
  type ListingOrganizationRole,
} from "../lib/listing-truth";
import { getLocalizedMarketplaceCityName } from "../lib/marketplace-control-copy";
import { ListingActions } from "./listing-actions";
import { ListingBackLink } from "./listing-back-link";

export const DesktopListingSummaryHeader = ({
  backHref,
  listing,
  listingUrl,
  locale,
  saveHref,
}: {
  backHref: string;
  listing: VehicleListing;
  listingUrl: string;
  locale?: string;
  saveHref?: string;
}) => {
  const copy = getListingDetailCopy(locale);
  const physicalLocation = getPhysicalVehicleLocation(listing);

  return (
    <header
      className="mb-4 hidden min-h-20 flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 lg:flex"
      data-slot="listing-summary-header"
    >
      <Button
        asChild
        className="h-10 shrink-0 gap-1.5 rounded-lg px-3 text-foreground shadow-none"
        variant="secondary"
      >
        <ListingBackLink href={backHref}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          {copy.backToSearch}
        </ListingBackLink>
      </Button>
      <div className="min-w-0 flex-1 basis-72">
        <h1 className="text-pretty break-words font-semibold text-page-title tracking-tight">
          {listing.title}
        </h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5" />
            {formatVehicleLocation(physicalLocation, locale)}
          </span>
          <span>Ref {listing.id.toUpperCase()}</span>
        </div>
      </div>
      <ListingActions
        listingTitle={listing.title}
        listingUrl={listingUrl}
        locale={locale}
        saveHref={saveHref}
      />
    </header>
  );
};

export const MobileListingGalleryActions = ({
  backHref,
  listing,
  listingUrl,
  locale,
  saveHref,
}: {
  backHref: string;
  listing: VehicleListing;
  listingUrl: string;
  locale?: string;
  saveHref?: string;
}) => {
  const copy = getListingDetailCopy(locale);

  return (
    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 lg:hidden min-[360px]:px-4 min-[360px]:pt-[calc(1rem+env(safe-area-inset-top))] min-[360px]:pb-4">
      <Button
        aria-label={copy.backToSearch}
        asChild
        className="size-11 rounded-full border border-border/70 bg-card/95 shadow-sm backdrop-blur"
        size="icon"
        variant="secondary"
      >
        <ListingBackLink href={backHref}>
          <ArrowLeft aria-hidden="true" className="size-5" />
        </ListingBackLink>
      </Button>
      <ListingActions
        floating
        listingTitle={listing.title}
        listingUrl={listingUrl}
        locale={locale}
        saveHref={saveHref}
      />
    </div>
  );
};

export const MobileListingSummary = ({
  listing,
  locale,
  sellerOrganizationRole,
  sellerProfileHref,
}: {
  listing: VehicleListing;
  locale?: string;
  sellerOrganizationRole?: ListingOrganizationRole;
  sellerProfileHref?: string;
}) => {
  const copy = getListingDetailCopy(locale);
  const primaryPrice = getPrimaryListingPrice(listing);
  const approximatePrice = getApproximateConvertedPrice(listing);
  const conversionTime = formatTruthDateTime(
    listing.supply?.priceConversion.convertedAt,
    locale
  );
  const physicalLocation = getPhysicalVehicleLocation(listing);
  const originCountryCode = listing.supply?.origin.countryCode?.toUpperCase();
  const showPhysicalLocation = originCountryCode
    ? originCountryCode !== leadSite.countryCode
    : physicalLocation.city !== leadSite.city ||
      physicalLocation.country !== leadSite.country;
  const deliveryTruth = getDeliveryTruth(listing, locale);
  const sellerRole = getListingSellerRole(listing, sellerOrganizationRole);
  const sellerTrustKind = getListingSellerTrustKind(
    listing,
    sellerOrganizationRole
  );
  const showSellerIdentity = !leadSite.staticDemoMode;
  const monthlyAmount = formatListingMonthlyEstimate(
    listing.monthlyEstimate,
    locale
  );

  return (
    <section className="pt-4 pb-1 lg:hidden" data-slot="listing-mobile-summary">
      <div className="border-zinc-200 border-b pb-3">
        <div className="flex min-w-0 items-baseline justify-between gap-2">
          <p className="min-w-0 break-words font-semibold text-price-lg tabular-nums tracking-tight">
            {formatMoney(primaryPrice, locale)}
          </p>
          {monthlyAmount ? (
            <p className="shrink-0 whitespace-nowrap text-right text-meta text-zinc-600 tabular-nums">
              ~{monthlyAmount}
              {locale?.startsWith("bg") ? "/мес." : "/mo"}
            </p>
          ) : null}
        </div>
        {approximatePrice ? (
          <p className="mt-1 text-meta text-muted-foreground">
            ≈ {formatMoney(approximatePrice, locale)} ·{" "}
            {copy.approximateConversion}
            {conversionTime ? ` ${copy.conversionAt} ${conversionTime}` : ""}
          </p>
        ) : null}
      </div>

      <h1 className="mt-3 text-pretty break-words font-medium text-[length:var(--text-section-title)] text-zinc-950 leading-[var(--text-section-title--line-height)]">
        {listing.title}
      </h1>
      {showPhysicalLocation ? (
        <p className="mt-2 text-meta text-muted-foreground">
          {formatVehicleLocation(physicalLocation, locale)}
        </p>
      ) : null}
      {deliveryTruth ? (
        <p className="mt-2 text-meta text-muted-foreground">
          {deliveryTruth.label}. {deliveryTruth.detail}
        </p>
      ) : null}

      {showSellerIdentity ? (
        <div className="mt-5">
          <p className="font-semibold text-body">
            {sellerProfileHref ? (
              <Link
                aria-label={`${copy.viewSellerProfile}: ${listing.seller.displayName}`}
                className="-mx-2 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md px-2 py-2 hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-slot="listing-seller-profile-link"
                href={sellerProfileHref}
              >
                <span className="break-words">
                  {listing.seller.displayName}
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />
              </Link>
            ) : (
              listing.seller.displayName
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground">
            <span data-slot="listing-seller-type">
              {getListingSellerRoleLabel(sellerRole, locale)} ·{" "}
              {getLocalizedMarketplaceCityName(listing.seller.city, locale)}
            </span>
            {sellerTrustKind ? (
              <span
                className="flex items-center gap-1 text-foreground"
                data-slot="listing-seller-verification"
              >
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                {getListingSellerTrustLabel(sellerTrustKind, locale)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
};
