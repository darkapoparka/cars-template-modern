"use client";

import {
  formatBodyType,
  formatMileage,
  getListingPath,
  type VehicleListing,
} from "@repo/marketplace";
import { ArrowUpRight, Cog, Fuel } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { rememberInventoryReturn } from "../lib/inventory-return";
import {
  formatVehicleCardMoney,
  getVehicleCardPricePolicy,
  getVehicleCardSpecFacts,
  getVehicleCardTitle,
} from "../lib/vehicle-card-policy";
import {
  getVehicleCardCopy,
  getVehicleCardSecondaryPriceLabel,
  vehicleCardPlaceholder,
} from "../lib/vehicle-card-view-policy";
import styles from "./desktop-landing-vehicle-card.module.css";

interface DesktopLandingVehicleCardProps {
  href?: string;
  listing: VehicleListing;
  locale?: string;
  priority?: boolean;
}

const desktopFactIcons = {
  fuel: Fuel,
  transmission: Cog,
} as const;

export const DesktopLandingVehicleCard = ({
  href,
  listing,
  locale,
  priority = false,
}: DesktopLandingVehicleCardProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(!listing.images[0]?.url);
  const listingHref = href ?? getListingPath(listing);
  const primaryImage = listing.images[0];
  const imageSource =
    imageFailed || !primaryImage?.url
      ? vehicleCardPlaceholder
      : primaryImage.url;
  const copy = getVehicleCardCopy(locale);
  const pricePolicy = getVehicleCardPricePolicy(listing, "comparison");
  const secondaryPrice = getVehicleCardSecondaryPriceLabel(
    listing,
    locale,
    "comparison",
    pricePolicy
  );
  const facts = getVehicleCardSpecFacts(listing, locale).filter(
    (fact): fact is typeof fact & { id: keyof typeof desktopFactIcons } =>
      fact.id === "fuel" || fact.id === "transmission"
  );
  const vehicleTitle = getVehicleCardTitle(listing, "comparison");
  const bodyLabel = formatBodyType(listing.spec.bodyType, locale);
  const mileageLabel = formatMileage(listing.spec.mileageValue, locale);

  return (
    <article
      className={styles.vehicleCard}
      data-slot="desktop-landing-vehicle-card"
      onClickCapture={() => rememberInventoryReturn(listingHref)}
    >
      <Link
        aria-label={`${locale?.startsWith("bg") ? "Виж" : "View"} ${vehicleTitle}`}
        className={styles.vehicleCardLink}
        href={listingHref}
      >
        <div className={styles.vehicleMedia}>
          {imageLoaded ? null : (
            <div aria-hidden="true" className={styles.vehicleImageSkeleton} />
          )}
          <Image
            alt={primaryImage?.alt ?? vehicleTitle}
            className={styles.vehicleImage}
            fill
            loading={priority ? "eager" : "lazy"}
            onError={() => {
              setImageFailed(true);
              setImageLoaded(true);
            }}
            onLoad={() => setImageLoaded(true)}
            referrerPolicy="no-referrer"
            sizes="(min-width: 1600px) 20vw, (min-width: 1024px) 25vw, 100vw"
            src={imageSource}
            unoptimized={imageSource.startsWith("data:")}
          />
          <div className={styles.vehicleBadges}>
            <span className={styles.vehicleMileage}>{mileageLabel}</span>
            <span className={styles.vehicleYear}>{listing.spec.year}</span>
          </div>
        </div>

        <div className={styles.vehicleCardContent}>
          <div className={styles.vehicleCardHeading}>
            <div>
              <p className={styles.vehicleCategory}>
                {listing.promoted ? `${copy.featured} · ` : ""}
                {bodyLabel}
              </p>
              <h3 className={styles.vehicleTitle}>{vehicleTitle}</h3>
            </div>
            <span aria-hidden="true" className={styles.vehicleArrow}>
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </span>
          </div>
          <ul aria-label={copy.specs} className={styles.vehicleFacts}>
            {facts.map((fact) => {
              const FactIcon = desktopFactIcons[fact.id];
              return (
                <li className={styles.vehicleFact} key={fact.id}>
                  <FactIcon aria-hidden="true" className="size-4" />
                  <span>{fact.value}</span>
                </li>
              );
            })}
          </ul>

          <div className={styles.vehiclePriceRow}>
            <div>
              <p className={styles.vehiclePrice}>
                {formatVehicleCardMoney(
                  pricePolicy.primaryPrice,
                  "comparison",
                  locale
                )}
              </p>
              {secondaryPrice ? (
                <p className={styles.vehicleSecondaryPrice}>{secondaryPrice}</p>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};
