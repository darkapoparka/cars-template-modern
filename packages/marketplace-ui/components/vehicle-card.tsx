"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { getListingPath } from "@repo/marketplace";
import { Heart, Images } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { mobileVehicleCardMediaClassName } from "../lib/mobile-vehicle-card-layout";
import { rememberInventoryReturn } from "../lib/inventory-return";
import { getVehicleCardVariant } from "../lib/vehicle-card-policy";
import type { VehicleCardProps } from "../lib/vehicle-card-types";
import {
  getVehicleCardCopy,
  getVehicleCardImageSizes,
  getVehicleCardMediaClassName,
  getVehicleCardSaveListingLabel,
  getVehicleCardViewListingLabel,
  vehicleCardPlaceholder,
} from "../lib/vehicle-card-view-policy";
import {
  VehicleCardContent,
  VehicleCardMediaBadges,
} from "./vehicle-card-content";

export type {
  VehicleCardPriceInsight,
  VehicleCardProps,
  VehicleCardTrustSignal,
} from "../lib/vehicle-card-types";

export const VehicleCard = ({
  density = "default",
  desktopLayout = "list",
  href,
  listing,
  locale,
  presentation = "default",
  priceInsight,
  priority = false,
  saveHref,
  sellerOrganizationRole,
  trustSignals = [],
  viewMode = "list",
}: VehicleCardProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(!listing.images[0]?.url);
  const isGrid = viewMode === "grid";
  const isCompact = density === "compact";
  const variant = getVehicleCardVariant({ density, desktopLayout, viewMode });
  const isDesktopComparison = isCompact && desktopLayout === "grid";
  const primaryImage = listing.images[0];
  const listingHref = href ?? getListingPath(listing);
  const hasRealImage = Boolean(primaryImage?.url) && !imageFailed;
  const imageSource =
    imageFailed || !primaryImage?.url
      ? vehicleCardPlaceholder
      : primaryImage.url;
  const copy = getVehicleCardCopy(locale);

  return (
    <article
      className={cn(
        "group flex overflow-hidden rounded-xl border-0 bg-card p-0 **:data-[slot=vehicle-card-title]:line-clamp-2 lg:rounded-lg lg:border lg:border-border lg:**:data-[slot=vehicle-card-title]:line-clamp-1",
        "lg:transition-colors lg:hover:border-foreground/30",
        variant === "compact-list" &&
          "lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-0 xl:grid-cols-[15rem_minmax(0,1fr)]",
        isDesktopComparison && "lg:flex lg:flex-col lg:gap-0"
      )}
      data-presentation={presentation}
      onClickCapture={() => rememberInventoryReturn(listingHref)}
    >
      <div
        className={cn(
          mobileVehicleCardMediaClassName,
          "lg:min-h-0 lg:w-full lg:max-w-none",
          getVehicleCardMediaClassName(isCompact, isGrid, isDesktopComparison)
        )}
        data-slot="vehicle-card-media"
      >
        {hasRealImage && !imageLoaded ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-pulse bg-secondary motion-reduce:animate-none"
            data-slot="vehicle-card-image-skeleton"
          />
        ) : null}
        <Link
          aria-label={getVehicleCardViewListingLabel(listing.title, locale)}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          href={listingHref}
        >
          <Image
            alt={primaryImage?.alt ?? listing.title}
            className="object-cover object-[center_85%] lg:object-[center_80%]"
            fill
            loading={priority ? "eager" : "lazy"}
            onError={() => {
              setImageFailed(true);
              setImageLoaded(true);
            }}
            onLoad={() => setImageLoaded(true)}
            referrerPolicy="no-referrer"
            sizes={getVehicleCardImageSizes(
              isCompact,
              isGrid,
              isDesktopComparison
            )}
            src={imageSource}
            unoptimized={imageSource.startsWith("data:")}
          />
        </Link>

        <VehicleCardMediaBadges listing={listing} locale={locale} />

        {listing.images.length > 1 ? (
          <span className="pointer-events-none absolute right-1.5 bottom-1.5 z-10 flex h-5 items-center gap-1 rounded-md bg-black/65 px-1.5 text-[11px] text-white lg:right-2 lg:bottom-2 lg:h-6 lg:px-2">
            <Images aria-hidden="true" className="size-3" />
            <span aria-hidden="true">{listing.images.length}</span>
            <span className="sr-only">
              {listing.images.length} {copy.photos}
            </span>
          </span>
        ) : null}

        {saveHref ? (
          <Button
            asChild
            className={cn(
              "absolute top-1.5 right-1.5 z-20 size-8 rounded-lg border border-border/70 bg-card text-foreground shadow-sm after:absolute after:-inset-1.5 after:content-[''] hover:bg-accent lg:top-2 lg:right-2 lg:size-9 lg:after:inset-0",
              isDesktopComparison &&
                "lg:size-10 lg:rounded-full lg:border-0 lg:bg-transparent lg:text-white lg:shadow-none lg:hover:bg-black/15"
            )}
            size="icon"
            variant="secondary"
          >
            <Link
              aria-label={getVehicleCardSaveListingLabel(listing.title, locale)}
              href={saveHref}
            >
              <Heart
                aria-hidden="true"
                className={cn(
                  "h-4 w-4",
                  isDesktopComparison && "lg:size-6 lg:drop-shadow-md"
                )}
              />
            </Link>
          </Button>
        ) : null}
      </div>

      <VehicleCardContent
        isDesktopComparison={isDesktopComparison}
        listing={listing}
        listingHref={listingHref}
        locale={locale}
        presentation={presentation}
        priceInsight={priceInsight}
        sellerOrganizationRole={sellerOrganizationRole}
        trustSignals={trustSignals}
        variant={variant}
      />
    </article>
  );
};
