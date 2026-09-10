import {
  formatFuelType,
  formatMileage,
  formatMoney,
  type VehicleListing,
} from "@repo/marketplace";
import { Car, MapPin, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  formatVehicleLocation,
  getApproximateConvertedPrice,
  getDeliveryTruth,
  getPhysicalVehicleLocation,
  getPrimaryListingPrice,
  getSourceLabel,
} from "../lib/listing-truth";

interface RelatedListingCardProps {
  readonly href: string;
  readonly listing: VehicleListing;
  readonly locale?: string;
}

export const RelatedListingCard = ({
  href,
  listing,
  locale,
}: RelatedListingCardProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const primaryImage = listing.images[0];
  const primaryPrice = getPrimaryListingPrice(listing);
  const approximatePrice = getApproximateConvertedPrice(listing);
  const physicalLocation = getPhysicalVehicleLocation(listing);
  const deliveryTruth = getDeliveryTruth(listing, locale);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <Link
        aria-label={`${isBg ? "Преглед на" : "View"} ${listing.title}`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        href={href}
      >
        <div className="relative aspect-[4/3] bg-muted">
          {primaryImage ? (
            <Image
              alt={primaryImage.alt || listing.title}
              className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              fill
              referrerPolicy="no-referrer"
              sizes="(max-width: 767px) 100vw, 33vw"
              src={primaryImage.url}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Car aria-hidden="true" className="size-8" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-semibold text-lg">
            {formatMoney(primaryPrice, locale)}
          </p>
          {approximatePrice ? (
            <p className="text-muted-foreground text-xs">
              ≈ {formatMoney(approximatePrice, locale)}
            </p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 font-medium text-sm">
            {listing.title}
          </h3>
          <p className="mt-2 text-muted-foreground text-xs">
            {formatMileage(listing.spec.mileageValue, locale)} ·{" "}
            {formatFuelType(listing.spec.fuelType, locale)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPin aria-hidden="true" className="size-3.5" />
            {isBg ? "Автомобил в" : "Vehicle in"}{" "}
            {formatVehicleLocation(physicalLocation, locale)}
          </p>
          {deliveryTruth ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-xs">
              <Truck aria-hidden="true" className="size-3.5" />
              {deliveryTruth.label}
            </p>
          ) : null}
          {listing.supply ? (
            <p className="mt-2 text-micro text-muted-foreground">
              {getSourceLabel(listing, locale)}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
};
