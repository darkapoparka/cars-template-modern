import { cn } from "@repo/design-system/lib/utils";
import {
  buildMarketplaceSearchHref,
  formatBodyType,
  getListingPath,
  type VehicleListing,
} from "@repo/marketplace";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  desktopDiscoveryBodyTypes,
  getDesktopBrandArtwork,
} from "../lib/desktop-discovery-data";
import {
  getDesktopDiscoveryCollections,
  getPopularMakes,
} from "../lib/desktop-discovery-policy";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";
import { VehicleCard } from "./vehicle-card";

const getVehicleCountLabel = (count: number, isBg: boolean) => {
  if (isBg) {
    return count === 1 ? "автомобил" : "автомобила";
  }
  return count === 1 ? "vehicle" : "vehicles";
};

const DesktopSectionHeader = ({
  actionHref,
  actionLabel,
  description,
  eyebrow,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  description?: string;
  eyebrow?: string;
  title: string;
}) => (
  <div className={styles.sectionHeading}>
    <div>
      {eyebrow ? <p className={styles.sectionEyebrow}>{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? (
        <p className={styles.sectionDescription}>{description}</p>
      ) : null}
    </div>
    <Link className={styles.sectionAction} href={actionHref}>
      {actionLabel}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  </div>
);

const DesktopVehicleRow = ({
  description,
  href,
  isBg,
  listings,
  locale,
  title,
}: {
  description: string;
  href: string;
  isBg: boolean;
  listings: readonly VehicleListing[];
  locale?: string;
  title: string;
}) => {
  if (listings.length === 0) {
    return null;
  }
  return (
    <section className={styles.vehicleSection}>
      <DesktopSectionHeader
        actionHref={href}
        actionLabel={isBg ? "Виж всички" : "View all"}
        description={description}
        title={title}
      />
      <div className={styles.vehicleGrid}>
        {listings.map((listing) => (
          <VehicleCard
            density="compact"
            desktopLayout="grid"
            href={getLocalizedPublicPath(locale, getListingPath(listing))}
            key={listing.id}
            listing={listing}
            locale={locale}
            presentation="discovery"
            priority={false}
            viewMode="grid"
          />
        ))}
      </div>
    </section>
  );
};

const DiscoveryPanel = ({
  currentPath,
  isBg,
  listings,
  locale,
}: {
  currentPath: string;
  isBg: boolean;
  listings: readonly VehicleListing[];
  locale?: string;
}) => {
  const popularMakes = getPopularMakes(listings);

  return (
    <section className={styles.discoveryPanel}>
      <DesktopSectionHeader
        actionHref={buildMarketplaceSearchHref(
          { category: "car", sort: "newest" },
          currentPath
        )}
        actionLabel={isBg ? "Всички автомобили" : "All vehicles"}
        eyebrow={isBg ? "Разгледайте наличностите" : "Explore inventory"}
        title={isBg ? "Изберете по тип купе" : "Browse by body style"}
      />

      <nav
        aria-label={isBg ? "Типове автомобили" : "Vehicle body types"}
        className={styles.bodyTypeGrid}
      >
        {desktopDiscoveryBodyTypes.map((option) => {
          const label = formatBodyType(option.bodyType, locale);
          return (
            <Link
              className={styles.bodyTypeCard}
              href={buildMarketplaceSearchHref(
                { body: option.bodyType, category: "car" },
                currentPath
              )}
              key={option.bodyType}
            >
              <span className={styles.bodyTypeArtwork}>
                <Image
                  alt=""
                  className={cn(
                    styles.bodyTypeImage,
                    option.imageClassName
                      ? styles[option.imageClassName]
                      : undefined
                  )}
                  fill
                  loading="lazy"
                  sizes="180px"
                  src={option.artwork}
                />
              </span>
              <span className={styles.bodyTypeMeta}>
                <strong>{label}</strong>
              </span>
            </Link>
          );
        })}
      </nav>

      {popularMakes.length > 0 ? (
        <div className={styles.brandSection}>
          <div className={styles.brandHeading}>
            <p>{isBg ? "Популярни марки" : "Popular makes"}</p>
            <span>
              {isBg
                ? "Марки в показаните предложения"
                : "Makes in the displayed selection"}
            </span>
          </div>
          <nav
            aria-label={isBg ? "Популярни марки" : "Popular makes"}
            className={styles.brandGrid}
          >
            {popularMakes.map(({ count, make }) => {
              const artwork = getDesktopBrandArtwork(make);
              return (
                <Link
                  className={styles.brandCard}
                  href={buildMarketplaceSearchHref(
                    { category: "car", make },
                    currentPath
                  )}
                  key={make}
                >
                  <span className={styles.brandArtwork}>
                    {artwork ? (
                      <Image
                        alt=""
                        height={40}
                        src={artwork}
                        unoptimized={artwork.endsWith(".svg")}
                        width={44}
                      />
                    ) : (
                      <span aria-hidden="true">{make.slice(0, 2)}</span>
                    )}
                  </span>
                  <span className={styles.brandMeta}>
                    <strong>{make}</strong>
                    <small>
                      {count} {getVehicleCountLabel(count, isBg)}
                    </small>
                  </span>
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </section>
  );
};

export const DealerDesktopDiscoveryContent = ({
  currentPath,
  listings,
  locale,
}: {
  currentPath: string;
  listings: readonly VehicleListing[];
  locale?: string;
}) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const {
    featured,
    newest,
    available: availableNow,
  } = getDesktopDiscoveryCollections(listings);

  return (
    <div
      className={styles.discoveryContent}
      data-slot="dealer-desktop-discovery-content"
    >
      <DiscoveryPanel
        currentPath={currentPath}
        isBg={isBg}
        listings={listings}
        locale={locale}
      />

      <DesktopVehicleRow
        description={
          isBg
            ? "Разгледайте избрани предложения от нашите наличности."
            : "Explore selected vehicles from our inventory."
        }
        href={buildMarketplaceSearchHref(
          { category: "car", sort: "newest" },
          currentPath
        )}
        isBg={isBg}
        listings={featured}
        locale={locale}
        title={isBg ? "Препоръчани автомобили" : "Featured vehicles"}
      />
      <DesktopVehicleRow
        description={
          isBg
            ? "Последните автомобили, добавени към наличностите."
            : "The latest vehicles added to the inventory."
        }
        href={buildMarketplaceSearchHref(
          { category: "car", sort: "newest" },
          currentPath
        )}
        isBg={isBg}
        listings={newest}
        locale={locale}
        title={isBg ? "Най-нови автомобили" : "Newest vehicles"}
      />
      <DesktopVehicleRow
        description={
          isBg
            ? "Още налични предложения за сравнение и избор."
            : "More available vehicles ready to compare."
        }
        href={buildMarketplaceSearchHref(
          { category: "car", sort: "newest" },
          currentPath
        )}
        isBg={isBg}
        listings={availableNow}
        locale={locale}
        title={isBg ? "Още в наличност" : "Available now"}
      />
    </div>
  );
};
