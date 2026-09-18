"use client";

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
import type { ComponentProps } from "react";
import {
  desktopDiscoveryBodyTypes,
  getDesktopBrandArtwork,
} from "../lib/desktop-discovery-data";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";
import { DealerDesktopToolbar } from "./dealer-desktop-toolbar";
import { DesktopLandingVehicleCard } from "./desktop-landing-vehicle-card";

type DiscoveryHeroProps = ComponentProps<typeof DealerDesktopToolbar>;

export const DealerDesktopDiscoveryHero = ({
  locale,
  totalListings,
  ...toolbarProps
}: DiscoveryHeroProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  return (
    <section className={styles.hero} data-slot="dealer-desktop-home-hero">
      <div aria-hidden="true" className={styles.heroArchitecture} />
      <div className={styles.heroCopy}>
        <p className={styles.heroEyebrow}>
          {isBg
            ? `${numberFormatter.format(totalListings)} налични автомобила`
            : `${numberFormatter.format(totalListings)} vehicles available`}
        </p>
        <h1>
          {isBg
            ? "Открийте автомобила, който ви пасва."
            : "Find the car that fits your life."}
        </h1>
        <p className={styles.heroDescription}>
          {isBg
            ? "Подбрани предложения, ясни условия и всички важни детайли на едно място."
            : "Curated inventory, transparent terms, and every important detail in one place."}
        </p>
      </div>

      <div aria-hidden="true" className={styles.heroVehicles}>
        <div className={cn(styles.heroVehicle, styles.heroVehicleLeft)}>
          <Image
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 0px"
            src="/lead-car-left-v2.webp"
          />
        </div>
        <div className={cn(styles.heroVehicle, styles.heroVehicleRight)}>
          <Image
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 52vw, 0px"
            src="/lead-car-right-v2.webp"
          />
        </div>
      </div>

      <div className={styles.heroSearch}>
        <DealerDesktopToolbar
          {...toolbarProps}
          locale={locale}
          totalListings={totalListings}
          variant="hero"
        />
      </div>
    </section>
  );
};

const getPopularMakes = (listings: readonly VehicleListing[]) => {
  const counts = new Map<string, number>();
  for (const listing of listings) {
    counts.set(listing.spec.make, (counts.get(listing.spec.make) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(
      ([firstMake, firstCount], [secondMake, secondCount]) =>
        secondCount - firstCount || firstMake.localeCompare(secondMake)
    )
    .slice(0, 4)
    .map(([make, count]) => ({ count, make }));
};
const getVehicleCountLabel = (count: number, isBg: boolean) => {
  if (isBg) {
    return count === 1 ? "автомобил" : "автомобила";
  }
  return count === 1 ? "vehicle" : "vehicles";
};

const takeUniqueListings = (
  source: readonly VehicleListing[],
  usedListingIds: Set<string>,
  limit: number
) => {
  const selected: VehicleListing[] = [];
  for (const listing of source) {
    if (usedListingIds.has(listing.id)) {
      continue;
    }
    selected.push(listing);
    usedListingIds.add(listing.id);
    if (selected.length === limit) {
      break;
    }
  }
  return selected;
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
      {description ? <p>{description}</p> : null}
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
        {listings.map((listing, index) => (
          <DesktopLandingVehicleCard
            href={getLocalizedPublicPath(locale, getListingPath(listing))}
            key={listing.id}
            listing={listing}
            locale={locale}
            priority={index < 4}
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
        actionHref={currentPath}
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
                  loading="eager"
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
                ? "Бърз достъп до най-търсените наличности"
                : "Quick access to the most requested inventory"}
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
  const usedListingIds = new Set<string>();
  const featuredPool = [
    ...listings.filter((listing) => listing.promoted),
    ...listings.filter((listing) => !listing.promoted),
  ];
  const featured = takeUniqueListings(featuredPool, usedListingIds, 4);
  const newest = takeUniqueListings(
    [...listings].sort(
      (first, second) =>
        new Date(second.publishedAt).getTime() -
        new Date(first.publishedAt).getTime()
    ),
    usedListingIds,
    4
  );
  const availableNow = takeUniqueListings(listings, usedListingIds, 4);

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
            ? "Подбрани предложения с най-силна комбинация от състояние, оборудване и цена."
            : "A curated selection with a strong balance of condition, equipment, and value."
        }
        href={currentPath}
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
        href={currentPath}
        isBg={isBg}
        listings={availableNow}
        locale={locale}
        title={isBg ? "Още в наличност" : "Available now"}
      />
    </div>
  );
};
