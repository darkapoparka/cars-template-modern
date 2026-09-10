import { Button } from "@repo/design-system/components/ui/button";
import { formatMoney, getListingPath } from "@repo/marketplace";
import { formatVehicleLocation } from "@repo/marketplace-ui";
import { HeartOffIcon, MapPinIcon, RouteIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BuyerSavedListing } from "../buyer-data";
import { getPublicWebBaseUrl } from "../marketplace-url";
import { removeSavedListingAction } from "../saved/actions";

interface BuyerListingCardProperties {
  readonly savedListing: BuyerSavedListing;
  readonly showRemove?: boolean;
}

export const BuyerListingCard = ({
  savedListing,
  showRemove = false,
}: BuyerListingCardProperties) => {
  const { listing } = savedListing;
  const listingHref = new URL(
    getListingPath({ slug: listing.slug }),
    getPublicWebBaseUrl()
  ).toString();

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <Link
        className="grid grid-cols-[7.5rem_minmax(0,1fr)]"
        href={listingHref}
      >
        <div className="relative min-h-28 bg-muted">
          {listing.imageUrl ? (
            <Image
              alt={listing.imageAlt ?? listing.title}
              className="object-cover"
              fill
              sizes="120px"
              src={listing.imageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <RouteIcon className="size-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 p-3">
          <p className="font-semibold text-base">
            {formatMoney(
              {
                amount: listing.priceAmount,
                currency: listing.priceCurrency,
              },
              "bg"
            )}
          </p>
          <h2 className="mt-1 truncate font-medium text-sm">{listing.title}</h2>
          <p className="mt-2 text-muted-foreground text-xs">
            {listing.year} · {listing.mileageValue.toLocaleString("bg-BG")} km
          </p>
          <p className="mt-1 flex items-center gap-1 text-muted-foreground text-xs">
            <MapPinIcon className="size-3.5" />
            {formatVehicleLocation(
              {
                city: listing.locationCity,
                country: listing.locationCountry,
                region: listing.locationRegion ?? undefined,
              },
              "bg"
            )}
          </p>
        </div>
      </Link>
      {showRemove && (
        <form
          action={removeSavedListingAction}
          className="border-border border-t p-2"
        >
          <input name="savedListingId" type="hidden" value={savedListing.id} />
          <Button
            className="w-full gap-2"
            size="sm"
            type="submit"
            variant="ghost"
          >
            <HeartOffIcon className="size-4" />
            Премахни от запазени
          </Button>
        </form>
      )}
    </article>
  );
};
