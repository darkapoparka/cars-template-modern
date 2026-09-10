import { Badge } from "@repo/design-system/components/ui/badge";
import { cn } from "@repo/design-system/lib/utils";
import type { VehicleListing } from "@repo/marketplace";
import {
  BadgeCheck,
  Boxes,
  Clock3,
  Factory,
  MapPin,
  ShieldCheck,
  Ship,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  formatTruthDateTime,
  getDeliveryTruth,
  getLandedCostTruth,
  getListingSellerRole,
  getListingSellerRoleLabel,
  getListingSellerTrustKind,
  getListingSellerTrustLabel,
  getPhysicalVehicleLocation,
  type ListingOrganizationRole,
  type ListingSellerRole,
} from "../lib/listing-truth";
import {
  formatVehicleCardMoney,
  getVehicleCardBadgeLabels,
  getVehicleCardPricePolicy,
  getVehicleCardSpecFacts,
  getVehicleCardTitle,
  type VehicleCardVariant,
} from "../lib/vehicle-card-policy";
import type {
  VehicleCardPriceInsight,
  VehicleCardTrustSignal,
} from "../lib/vehicle-card-types";
import {
  formatLocalizedVehicleCardLocation,
  getCompactVehicleCardLandedCostLabel,
  getLocalizedVehicleCardDeliveryLabel,
  getLocalizedVehicleCardFreshnessLabel,
  getLocalizedVehicleCardLandedCostLabel,
  getLocalizedVehicleCardLocationPart,
  getLocalizedVehicleCardSellerName,
  getLocalizedVehicleCardSourceLabel,
  getVehicleCardCopy,
  getVehicleCardSecondaryPriceLabel,
  vehicleCardToneClassNames,
} from "../lib/vehicle-card-view-policy";
import { mobileVehicleCardContentClassName } from "../lib/mobile-vehicle-card-layout";
import { DealerVehicleFacts } from "./dealer-vehicle-facts";

const sellerRoleIcons = {
  dealer: Store,
  distributor: Boxes,
  importer: Ship,
  manufacturer: Factory,
  private: UserRound,
} as const satisfies Record<ListingSellerRole, typeof Store>;

export const VehicleCardMediaBadges = ({
  listing,
  locale,
}: {
  listing: VehicleListing;
  locale?: string;
}) => {
  const copy = getVehicleCardCopy(locale);
  const labels = getVehicleCardBadgeLabels(listing, locale, copy);

  if (labels.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute top-1.5 left-1.5 z-10 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-1 lg:top-2 lg:left-2 lg:max-w-[calc(100%-4.25rem)] lg:gap-1.5"
      data-slot="vehicle-card-media-badges"
    >
      {labels.map((label) => (
        <Badge
          className="h-5 rounded-md border-0 bg-white/95 px-1.5 font-medium text-[11px] text-foreground lg:h-6 lg:px-2 lg:text-xs"
          key={label}
          variant="secondary"
        >
          {label}
        </Badge>
      ))}
    </div>
  );
};

const VehiclePriceSummary = ({
  listing,
  locale,
  priceInsight,
  variant,
}: {
  listing: VehicleListing;
  locale?: string;
  priceInsight?: VehicleCardPriceInsight;
  variant: VehicleCardVariant;
}) => {
  const pricePolicy = getVehicleCardPricePolicy(listing, variant);
  const conversionTime = formatTruthDateTime(
    listing.supply?.priceConversion.convertedAt,
    locale
  );
  const copy = getVehicleCardCopy(locale);
  const secondaryPriceLabel = getVehicleCardSecondaryPriceLabel(
    listing,
    locale,
    variant,
    pricePolicy
  );

  return (
    <div className="min-w-0">
      <p
        className="whitespace-nowrap font-bold text-foreground text-lg tabular-nums leading-5 tracking-tight"
        data-slot="vehicle-card-price"
      >
        {formatVehicleCardMoney(pricePolicy.primaryPrice, variant, locale)}
        {pricePolicy.isMonthlyPrice ? (
          <span className="ml-1 font-medium text-meta text-muted-foreground">
            {copy.monthSuffix}
          </span>
        ) : null}
      </p>
      {secondaryPriceLabel ? (
        <p
          className="text-[12px] text-muted-foreground leading-4"
          title={secondaryPriceLabel}
        >
          {secondaryPriceLabel}
        </p>
      ) : null}
      {pricePolicy.approximatePrice && variant !== "comparison" ? (
        <p className="text-[12px] text-muted-foreground leading-4">
          ≈{" "}
          {formatVehicleCardMoney(
            pricePolicy.approximatePrice,
            variant,
            locale
          )}
          {pricePolicy.showConversionTime && conversionTime
            ? ` · ${copy.rateSnapshot} ${conversionTime}`
            : ""}
        </p>
      ) : null}
      {priceInsight ? (
        <div className="flex flex-wrap items-center gap-1.5 text-micro">
          <span
            className={
              vehicleCardToneClassNames[priceInsight.tone ?? "neutral"]
            }
          >
            {priceInsight.label}
          </span>
          {priceInsight.detail ? (
            <span className="text-micro text-muted-foreground">
              {priceInsight.detail}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const VehicleSpecPills = ({
  listing,
  locale,
}: {
  listing: VehicleListing;
  locale?: string;
}) => {
  const copy = getVehicleCardCopy(locale);
  const facts = getVehicleCardSpecFacts(listing, locale);

  if (facts.length === 0) {
    return null;
  }

  return <DealerVehicleFacts facts={facts} label={copy.specs} />;
};

const VehicleSellerFooter = ({
  listing,
  locale,
  placement = "footer",
  sellerOrganizationRole,
}: {
  listing: VehicleListing;
  locale?: string;
  placement?: "eyebrow" | "footer";
  sellerOrganizationRole?: ListingOrganizationRole;
}) => {
  const sellerName = getLocalizedVehicleCardSellerName(
    listing,
    locale,
    sellerOrganizationRole
  );
  const sellerRole = getListingSellerRole(listing, sellerOrganizationRole);
  const sellerType = getListingSellerRoleLabel(sellerRole, locale);
  const SellerRoleIcon = sellerRoleIcons[sellerRole];
  const sellerTrustKind = getListingSellerTrustKind(
    listing,
    sellerOrganizationRole
  );
  const sellerLabel =
    sellerName === sellerType ? sellerType : `${sellerType} · ${sellerName}`;
  const sellerTrustLabel = sellerTrustKind
    ? getListingSellerTrustLabel(sellerTrustKind, locale)
    : undefined;
  const sellerBadgeLabel = sellerTrustLabel
    ? `${sellerLabel}, ${sellerTrustLabel}`
    : sellerLabel;

  if (placement === "eyebrow") {
    return (
      <footer
        className="flex min-w-0 flex-1 items-center gap-1.5"
        data-slot="vehicle-seller-eyebrow"
      >
        <Badge
          aria-label={sellerBadgeLabel}
          className="h-7 min-w-0 max-w-full shrink gap-2 rounded-md border-border/70 bg-control px-2.5 font-semibold text-foreground text-xs"
          title={sellerBadgeLabel}
          variant="outline"
        >
          <span
            className={cn(
              "relative grid h-4 w-14 shrink-0 place-items-center text-foreground/70",
              sellerTrustLabel && "text-success-foreground"
            )}
          >
            {listing.seller.logoUrl ? (
              <Image
                alt=""
                aria-hidden="true"
                className="h-4 w-14 object-contain"
                data-slot="vehicle-seller-logo"
                height={16}
                src={listing.seller.logoUrl}
                width={56}
              />
            ) : (
              <SellerRoleIcon aria-hidden="true" className="size-3.5" />
            )}
            {sellerTrustLabel ? (
              <BadgeCheck
                aria-hidden="true"
                className="absolute -right-1 -bottom-0.5 size-3 rounded-full bg-control text-success-foreground ring-1 ring-control"
              />
            ) : null}
          </span>
          <span className="truncate">{sellerName}</span>
          {sellerTrustLabel ? (
            <span className="sr-only">{sellerTrustLabel}</span>
          ) : null}
        </Badge>
      </footer>
    );
  }

  return (
    <footer className="mt-auto flex min-w-0 max-w-full items-center lg:mt-1 lg:border-border/70 lg:border-t lg:pt-2">
      <span
        className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-secondary/85 px-2.5 py-1 text-foreground/75 text-meta lg:rounded-none lg:bg-transparent lg:p-0 lg:text-muted-foreground"
        title={sellerLabel}
      >
        {listing.seller.logoUrl ? (
          <Image
            alt=""
            aria-hidden="true"
            className="size-4 shrink-0 rounded object-contain"
            height={16}
            src={listing.seller.logoUrl}
            width={16}
          />
        ) : null}
        <span className="truncate font-medium">{sellerLabel}</span>
        {sellerTrustLabel ? (
          <span className="shrink-0 text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="h-3 w-3" />
            <span className="sr-only">{sellerTrustLabel}</span>
          </span>
        ) : null}
      </span>
    </footer>
  );
};

const VehicleLocationDetails = ({
  deliveryTruth,
  landedCostTruth,
  listing,
  locale,
  physicalLocation,
}: {
  deliveryTruth: ReturnType<typeof getDeliveryTruth>;
  landedCostTruth: ReturnType<typeof getLandedCostTruth>;
  listing: VehicleListing;
  locale?: string;
  physicalLocation: ReturnType<typeof getPhysicalVehicleLocation>;
}) => {
  const copy = getVehicleCardCopy(locale);
  const desktopLocation = formatLocalizedVehicleCardLocation(
    physicalLocation,
    locale
  );
  const mobileLocation = [physicalLocation.city, physicalLocation.country]
    .map((value) => getLocalizedVehicleCardLocationPart(value, locale))
    .join(", ");

  return (
    <div className="space-y-1.5 pt-1 text-meta text-muted-foreground lg:pt-0.5">
      <p className="flex min-w-0 items-start gap-1.5">
        <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span className="lg:hidden">{mobileLocation}</span>
        <span className="hidden lg:inline">
          {copy.vehicleIn} {desktopLocation}
        </span>
      </p>
      {deliveryTruth ? (
        <p className="flex items-start gap-1.5">
          <Truck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {getLocalizedVehicleCardDeliveryLabel(deliveryTruth, locale)}
          </span>
        </p>
      ) : null}
      {landedCostTruth ? (
        <p className="hidden pl-5 text-micro lg:block">
          {getLocalizedVehicleCardLandedCostLabel(
            listing,
            landedCostTruth.label,
            locale
          )}
        </p>
      ) : null}
    </div>
  );
};

const ComparisonLocationMeta = ({
  landedCostTruth,
  listing,
  locale,
}: {
  landedCostTruth: ReturnType<typeof getLandedCostTruth>;
  listing: VehicleListing;
  locale?: string;
}) => {
  const physicalLocation = getPhysicalVehicleLocation(listing);
  const compactLocation = getLocalizedVehicleCardLocationPart(
    physicalLocation.city || physicalLocation.country,
    locale
  );
  const fullLocation = [physicalLocation.city, physicalLocation.country]
    .filter((value): value is string => Boolean(value))
    .map((value) => getLocalizedVehicleCardLocationPart(value, locale))
    .join(", ");
  const landedCostLabel = landedCostTruth
    ? getCompactVehicleCardLandedCostLabel(
        listing,
        landedCostTruth.label,
        locale
      )
    : undefined;
  const accessibleLabel = landedCostLabel
    ? `${fullLocation}. ${landedCostLabel}`
    : fullLocation;

  return (
    <span
      className="ml-auto flex min-w-0 max-w-[42%] shrink-0 items-center gap-1.5 font-medium text-foreground/65 text-meta"
      data-slot="vehicle-location-meta"
      title={accessibleLabel}
    >
      <span className="sr-only">{accessibleLabel}</span>
      <MapPin
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      <span aria-hidden="true" className="truncate">
        {compactLocation}
      </span>
      {landedCostLabel ? (
        <Truck
          aria-hidden="true"
          className="size-3.5 shrink-0 text-amber-700"
        />
      ) : null}
    </span>
  );
};

const VehicleProvenanceFooter = ({
  listing,
  locale,
  sellerOrganizationRole,
  signals,
}: {
  listing: VehicleListing;
  locale?: string;
  sellerOrganizationRole?: ListingOrganizationRole;
  signals: readonly VehicleCardTrustSignal[];
}) => {
  if (!listing.supply && signals.length === 0) {
    return null;
  }

  const confirmedAt = formatTruthDateTime(
    listing.supply?.provenance.lastConfirmedAt,
    locale
  );
  const copy = getVehicleCardCopy(locale);
  const sellerTrustKind = getListingSellerTrustKind(
    listing,
    sellerOrganizationRole
  );

  return (
    <footer className="mt-3 hidden flex-wrap items-center justify-between gap-x-3 gap-y-1 text-micro text-muted-foreground lg:flex">
      <span className="flex min-w-0 items-center gap-1.5">
        <Clock3 aria-hidden="true" className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {getLocalizedVehicleCardSourceLabel(listing, locale)}
          {confirmedAt ? ` · ${copy.confirmed} ${confirmedAt}` : ""}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        {listing.supply ? (
          <span>{getLocalizedVehicleCardFreshnessLabel(listing, locale)}</span>
        ) : null}
        {sellerTrustKind === "verified_importer" ? (
          <span className="flex items-center gap-1 font-medium text-foreground">
            <ShieldCheck aria-hidden="true" className="h-3 w-3" />
            {getListingSellerTrustLabel(sellerTrustKind, locale)}
          </span>
        ) : null}
        {signals.map((signal) => (
          <span
            className={vehicleCardToneClassNames[signal.tone ?? "neutral"]}
            key={signal.id}
          >
            {signal.label}
          </span>
        ))}
      </span>
    </footer>
  );
};

const MobileDealerVehicleCardContent = ({
  listing,
  listingHref,
  locale,
}: {
  listing: VehicleListing;
  listingHref: string;
  locale?: string;
}) => (
  <Link
    className={cn(mobileVehicleCardContentClassName, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:hidden")}
    href={listingHref}
  >
    <div className="min-w-0 space-y-0.5">
      <h2
        className="line-clamp-2 font-medium text-base text-foreground leading-5 tracking-tight"
        data-slot="vehicle-card-title"
      >
        {getVehicleCardTitle(listing, "comparison")}
      </h2>
      <VehiclePriceSummary
        listing={listing}
        locale={locale}
        variant="comparison"
      />
    </div>
    <VehicleSpecPills listing={listing} locale={locale} />
  </Link>
);

const ComparisonVehicleCardContent = ({
  isDesktopComparison,
  listing,
  listingHref,
  locale,
  priceInsight,
  presentation,
  sellerOrganizationRole,
}: {
  isDesktopComparison: boolean;
  listing: VehicleListing;
  listingHref: string;
  locale?: string;
  priceInsight?: VehicleCardPriceInsight;
  presentation: "default" | "discovery";
  sellerOrganizationRole?: ListingOrganizationRole;
}) => {
  const landedCostTruth = getLandedCostTruth(listing);
  const vehicleTitle = getVehicleCardTitle(listing, "comparison");

  return (
    <Link
      className={cn(
        "flex min-w-0 flex-col gap-2.5 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:gap-3 lg:p-3.5",
        isDesktopComparison && "lg:gap-2 lg:p-3"
      )}
      href={listingHref}
    >
      {presentation === "discovery" ? (
        <div data-slot="vehicle-card-title-row">
          <h2
            className="line-clamp-2 min-w-0 font-medium text-card-title text-foreground"
            data-slot="vehicle-card-title"
            title={vehicleTitle}
          >
            {vehicleTitle}
          </h2>
        </div>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-1.5">
            <VehicleSellerFooter
              listing={listing}
              locale={locale}
              placement="eyebrow"
              sellerOrganizationRole={sellerOrganizationRole}
            />
            <ComparisonLocationMeta
              landedCostTruth={landedCostTruth}
              listing={listing}
              locale={locale}
            />
          </div>
          <h2
            className="line-clamp-2 font-medium text-card-title text-foreground"
            data-slot="vehicle-card-title"
            title={vehicleTitle}
          >
            {vehicleTitle}
          </h2>
        </>
      )}
      <VehiclePriceSummary
        listing={listing}
        locale={locale}
        priceInsight={priceInsight}
        variant="comparison"
      />
      <div className="mt-auto">
        <VehicleSpecPills listing={listing} locale={locale} />
      </div>
    </Link>
  );
};

const ListVehicleCardContent = ({
  listing,
  listingHref,
  locale,
  priceInsight,
  sellerOrganizationRole,
  trustSignals,
  variant,
}: {
  listing: VehicleListing;
  listingHref: string;
  locale?: string;
  priceInsight?: VehicleCardPriceInsight;
  sellerOrganizationRole?: ListingOrganizationRole;
  trustSignals: readonly VehicleCardTrustSignal[];
  variant: Exclude<VehicleCardVariant, "comparison">;
}) => {
  const deliveryTruth = getDeliveryTruth(listing);
  const landedCostTruth = getLandedCostTruth(listing);
  const physicalLocation = getPhysicalVehicleLocation(listing);
  const isCompactList = variant === "compact-list";

  return (
    <Link
      className={cn(
        "flex min-w-0 flex-col gap-1.5 p-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        isCompactList && "lg:p-4"
      )}
      href={listingHref}
    >
      <h2
        className="line-clamp-2 font-medium text-card-title text-foreground"
        data-slot="vehicle-card-title"
      >
        {getVehicleCardTitle(listing, variant)}
      </h2>
      <VehiclePriceSummary
        listing={listing}
        locale={locale}
        priceInsight={priceInsight}
        variant={variant}
      />
      <VehicleSpecPills listing={listing} locale={locale} />
      <VehicleLocationDetails
        deliveryTruth={deliveryTruth}
        landedCostTruth={landedCostTruth}
        listing={listing}
        locale={locale}
        physicalLocation={physicalLocation}
      />
      <VehicleSellerFooter
        listing={listing}
        locale={locale}
        sellerOrganizationRole={sellerOrganizationRole}
      />
      <VehicleProvenanceFooter
        listing={listing}
        locale={locale}
        sellerOrganizationRole={sellerOrganizationRole}
        signals={trustSignals}
      />
    </Link>
  );
};

export const VehicleCardContent = ({
  isDesktopComparison,
  listing,
  listingHref,
  locale,
  presentation,
  priceInsight,
  sellerOrganizationRole,
  trustSignals,
  variant,
}: {
  isDesktopComparison: boolean;
  listing: VehicleListing;
  listingHref: string;
  locale?: string;
  presentation: "default" | "discovery";
  priceInsight?: VehicleCardPriceInsight;
  sellerOrganizationRole?: ListingOrganizationRole;
  trustSignals: readonly VehicleCardTrustSignal[];
  variant: VehicleCardVariant;
}) => (
  <>
    <MobileDealerVehicleCardContent
      listing={listing}
      listingHref={listingHref}
      locale={locale}
    />
    <div className="hidden lg:contents">
      {variant === "comparison" ? (
        <ComparisonVehicleCardContent
          isDesktopComparison={isDesktopComparison}
          listing={listing}
          listingHref={listingHref}
          locale={locale}
          presentation={presentation}
          priceInsight={priceInsight}
          sellerOrganizationRole={sellerOrganizationRole}
        />
      ) : (
        <ListVehicleCardContent
          listing={listing}
          listingHref={listingHref}
          locale={locale}
          priceInsight={priceInsight}
          sellerOrganizationRole={sellerOrganizationRole}
          trustSignals={trustSignals}
          variant={variant}
        />
      )}
    </div>
  </>
);
