import { Button } from "@repo/design-system/components/ui/button";
import { leadSite, type VehicleListing } from "@repo/marketplace";
import {
  ArrowUpRight,
  Boxes,
  Factory,
  Flag,
  MapPin,
  ShieldCheck,
  Ship,
  Store,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  formatTruthDateTime,
  getDeliveryTruth,
  getFreshnessLabel,
  getLandedCostTruth,
  getListingSellerRole,
  getListingSellerRoleLabel,
  getListingSellerTrustKind,
  getListingSellerTrustLabel,
  getSourceLabel,
  type ListingOrganizationRole,
  type ListingSellerRole,
} from "../lib/listing-truth";
import { getLocalizedMarketplaceCityName } from "../lib/marketplace-control-copy";
import {
  formatSellerPanelPublishedDate,
  getSellerPanelCopy,
  getSellerPanelDisplayName,
} from "../lib/seller-contact-policy";

const sellerRoleIcons = {
  dealer: Store,
  distributor: Boxes,
  importer: Ship,
  manufacturer: Factory,
  private: UserRound,
} as const satisfies Record<ListingSellerRole, typeof Store>;

export const LeadSiteListingIdentityCard = ({
  listing,
  locale,
}: {
  listing: VehicleListing;
  locale?: string;
}) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;

  return (
    <section
      aria-label={isBg ? "Информация за дилъра" : "Dealer information"}
      className="rounded-xl border border-border bg-card p-5"
      data-slot="listing-dealership-card"
    >
      <Image
        alt={leadSite.name}
        className="h-12 w-auto max-w-full object-contain object-left"
        height={48}
        src={leadSite.logoPath}
        width={220}
      />

      <a
        className="group mt-4 flex items-center justify-between gap-4 rounded-xl bg-control px-4 py-3 transition-colors hover:bg-control-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent)]"
        href={leadSite.mapsUrl}
        rel="noreferrer"
        target="_blank"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-sm">{leadSite.city}</span>
          <span className="mt-0.5 block text-muted-foreground text-xs leading-4">
            {leadSite.address}, {leadSite.country}
          </span>
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
        />
      </a>

      <dl className="mt-4 divide-y divide-border rounded-lg bg-control px-3 text-meta">
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-muted-foreground">
            {isBg ? "Реф. номер" : "Reference"}
          </dt>
          <dd className="truncate font-semibold">{listing.id.toUpperCase()}</dd>
        </div>
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-muted-foreground">
            {isBg ? "Публикуван" : "Published"}
          </dt>
          <dd className="font-medium">
            {formatSellerPanelPublishedDate(listing.publishedAt, locale)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 h-48 overflow-hidden rounded-lg bg-control">
        <iframe
          className="block h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={leadSite.mapsEmbedUrl}
          title={isBg ? "Карта на шоурума" : "Showroom map"}
        />
      </div>
    </section>
  );
};

export const SellerIdentityCard = ({
  listing,
  locale,
  reportHref,
  sellerOrganizationRole,
  sellerProfileHref,
}: {
  listing: VehicleListing;
  locale?: string;
  reportHref?: string;
  sellerOrganizationRole?: ListingOrganizationRole;
  sellerProfileHref?: string;
}) => {
  const copy = getSellerPanelCopy({ defaultContactLabel: "", locale });
  const deliveryTruth = getDeliveryTruth(listing, locale);
  const landedCostTruth = getLandedCostTruth(listing, locale);
  const lastConfirmedAt = formatTruthDateTime(
    listing.supply?.provenance.lastConfirmedAt,
    locale
  );
  const sellerRole = getListingSellerRole(listing, sellerOrganizationRole);
  const SellerRoleIcon = sellerRoleIcons[sellerRole];
  const sellerDisplayName = getSellerPanelDisplayName(listing, copy);
  const sellerTrustKind = getListingSellerTrustKind(
    listing,
    sellerOrganizationRole
  );
  const verificationLabel = sellerTrustKind
    ? getListingSellerTrustLabel(sellerTrustKind, locale)
    : undefined;

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      data-slot="listing-seller-card"
    >
      <p className="font-medium text-foreground/70 text-sm">{copy.seller}</p>
      <div className="mt-2 flex items-center gap-3">
        {listing.seller.logoUrl ? (
          <Image
            alt=""
            aria-hidden="true"
            className="size-11 rounded-xl object-contain"
            height={44}
            src={listing.seller.logoUrl}
            width={44}
          />
        ) : null}
        <h2 className="min-w-0 font-semibold text-lg">
          {sellerProfileHref ? (
            <Link
              aria-label={`${copy.viewSellerProfile}: ${sellerDisplayName}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-sm hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={sellerProfileHref}
            >
              <span className="break-words">{sellerDisplayName}</span>
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
            </Link>
          ) : (
            sellerDisplayName
          )}
        </h2>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p
          className="flex h-8 w-fit items-center gap-1.5 rounded-md bg-control-hover px-2.5 font-semibold text-sm"
          data-slot="seller-type"
        >
          <SellerRoleIcon aria-hidden="true" className="size-4" />
          {getListingSellerRoleLabel(sellerRole, locale)}
        </p>
        {verificationLabel ? (
          <p
            className="flex h-8 w-fit items-center gap-1.5 rounded-md bg-success-surface px-2.5 font-semibold text-sm text-success-foreground"
            data-slot="seller-verification"
          >
            <ShieldCheck aria-hidden="true" className="size-4" />
            {verificationLabel}
          </p>
        ) : null}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-muted-foreground text-sm">
        <MapPin aria-hidden="true" className="size-4 shrink-0" />
        {copy.basedIn}{" "}
        {getLocalizedMarketplaceCityName(listing.seller.city, locale)}
      </p>

      <dl className="mt-4 divide-y divide-border rounded-lg bg-control px-3 text-meta">
        <div className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
          <dt className="text-muted-foreground">{copy.vehicleReference}</dt>
          <dd className="truncate font-medium">{listing.id.toUpperCase()}</dd>
        </div>
        <div className="min-w-0 py-3">
          <dt className="mb-1 text-muted-foreground">{copy.inventorySource}</dt>
          <dd className="min-w-0">
            <span className="block font-medium">
              {getSourceLabel(listing, locale)}
            </span>
            <span className="mt-1 block text-muted-foreground leading-4">
              {listing.supply
                ? `${getFreshnessLabel(listing, locale)}${
                    lastConfirmedAt
                      ? ` · ${copy.confirmed} ${lastConfirmedAt}`
                      : ""
                  }`
                : `${copy.published} ${formatSellerPanelPublishedDate(
                    listing.publishedAt,
                    locale
                  )}`}
            </span>
          </dd>
        </div>
        {listing.supply ? (
          <div className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
            <dt className="text-muted-foreground">{copy.documentation}</dt>
            <dd className="font-medium">
              {listing.supply.documentCount}{" "}
              {copy.documentsListed(listing.supply.documentCount)}
            </dd>
          </div>
        ) : null}
        {deliveryTruth ? (
          <div className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
            <dt className="text-muted-foreground">{copy.delivery}</dt>
            <dd className="font-medium">{deliveryTruth.label}</dd>
          </div>
        ) : null}
        {landedCostTruth ? (
          <div className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-3 py-3">
            <dt className="text-muted-foreground">{copy.costAfterDelivery}</dt>
            <dd className="font-medium">{landedCostTruth.label}</dd>
          </div>
        ) : null}
      </dl>

      {reportHref ? (
        <Button
          asChild
          className="mt-4 hidden h-10 w-full gap-2 rounded-lg lg:flex"
          data-slot="report-listing-action"
          variant="secondary"
        >
          <Link href={reportHref}>
            <Flag aria-hidden="true" className="size-4" />
            {copy.reportListing}
          </Link>
        </Button>
      ) : null}
    </section>
  );
};
