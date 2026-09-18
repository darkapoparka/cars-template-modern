"use client";

import {
  type BodyType,
  buildMarketplaceSearchHref,
  getListingPath,
  type VehicleListing,
} from "@repo/marketplace";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, CSSProperties } from "react";
import { getLocalizedPublicPath } from "../lib/public-path";
import { DealerDesktopToolbar } from "./dealer-desktop-toolbar";
import { VehicleCard } from "./vehicle-card";

type DiscoveryHeroProps = ComponentProps<typeof DealerDesktopToolbar>;

type DiscoveryBodyType = Extract<
  BodyType,
  "suv" | "sedan" | "hatchback" | "coupe" | "convertible" | "wagon" | "van"
>;

const bodyTypeOptions: readonly {
  id: DiscoveryBodyType;
  labelBg: string;
  labelEn: string;
}[] = [
  { id: "suv", labelBg: "SUV", labelEn: "SUV" },
  { id: "sedan", labelBg: "Седан", labelEn: "Sedan" },
  { id: "hatchback", labelBg: "Хечбек", labelEn: "Hatchback" },
  { id: "coupe", labelBg: "Купе", labelEn: "Coupe" },
  { id: "convertible", labelBg: "Кабрио", labelEn: "Convertible" },
  { id: "wagon", labelBg: "Комби", labelEn: "Wagon" },
  { id: "van", labelBg: "Ван", labelEn: "Van" },
] as const;

const bodyTypeProfiles: Record<DiscoveryBodyType, string> = {
  convertible:
    "M18 48 30 44 46 37 74 36 88 43 135 45 153 50 160 57 155 61 24 61 15 57Z",
  coupe: "M18 49 31 44 48 27 89 24 119 42 148 47 160 55 155 61 24 61 15 57Z",
  hatchback:
    "M18 49 31 44 47 28 94 27 116 35 132 46 151 50 160 57 155 61 24 61 15 57Z",
  sedan: "M18 49 31 44 48 29 99 26 124 41 148 46 160 55 155 61 24 61 15 57Z",
  suv: "M17 49 29 44 43 22 109 20 130 41 151 47 161 55 156 62 23 62 14 57Z",
  van: "M17 49 27 44 39 20 123 20 139 43 154 48 162 56 156 62 23 62 14 57Z",
  wagon: "M17 49 29 44 45 25 112 24 132 41 151 47 161 55 156 62 23 62 14 57Z",
};

const BodyTypeSilhouette = ({ bodyType }: { bodyType: DiscoveryBodyType }) => (
  <svg
    aria-hidden="true"
    className="dealer-desktop-body-type-art"
    viewBox="0 0 176 76"
  >
    <path d={bodyTypeProfiles[bodyType]} fill="currentColor" />
    <path
      d={
        bodyType === "convertible"
          ? "M49 38 76 38 88 44 48 44Z"
          : "M49 31 96 29 119 43 43 43Z"
      }
      fill="rgb(255 255 255 / 72%)"
    />
    <path
      d="M96 29v14M44 44h108"
      stroke="rgb(17 24 39 / 24%)"
      strokeWidth="2"
    />
    <circle cx="48" cy="60" fill="#18181b" r="10" />
    <circle cx="48" cy="60" fill="#d4d4d8" r="4" />
    <circle cx="132" cy="60" fill="#18181b" r="10" />
    <circle cx="132" cy="60" fill="#d4d4d8" r="4" />
  </svg>
);

export const DealerDesktopDiscoveryHero = ({
  locale,
  totalListings,
  ...toolbarProps
}: DiscoveryHeroProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");

  return (
    <section
      className="dealer-desktop-home-hero hidden lg:block"
      data-slot="dealer-desktop-home-hero"
    >
      <div aria-hidden="true" className="dealer-desktop-home-architecture" />
      <div className="dealer-desktop-home-copy">
        <p className="dealer-desktop-home-eyebrow">
          {isBg
            ? `${numberFormatter.format(totalListings)} подбрани автомобила`
            : `${numberFormatter.format(totalListings)} curated vehicles`}
        </p>
        <h1>
          {isBg
            ? "Открийте автомобила за вашия начин на живот."
            : "Find the car that fits your life."}
        </h1>
        <p className="dealer-desktop-home-description">
          {isBg
            ? "Качествени автомобили, ясни условия и по-добър начин да изберете."
            : "Quality vehicles, transparent terms, and a better way to choose."}
        </p>
      </div>
      <div
        aria-hidden="true"
        className="dealer-desktop-home-car dealer-desktop-home-car--left"
      />
      <div
        aria-hidden="true"
        className="dealer-desktop-home-car dealer-desktop-home-car--right"
      />
      <div className="dealer-desktop-home-search">
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
    .slice(0, 7)
    .map(([make]) => make);
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
    <section className="dealer-desktop-vehicle-section">
      <div className="dealer-desktop-section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <Link className="dealer-desktop-section-link" href={href}>
          {isBg ? "Виж всички" : "View all"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div
        className="dealer-desktop-vehicle-row"
        data-slot="marketplace-listing-grid"
        style={
          {
            "--dealer-row-count": Math.min(listings.length, 5),
          } as CSSProperties
        }
      >
        {listings.map((listing) => (
          <VehicleCard
            density="compact"
            desktopLayout="grid"
            href={getLocalizedPublicPath(locale, getListingPath(listing))}
            key={listing.id}
            listing={listing}
            locale={locale}
            presentation="discovery"
            viewMode="grid"
          />
        ))}
      </div>
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
  const popularMakes = getPopularMakes(listings);
  const usedListingIds = new Set<string>();
  const featured = takeUniqueListings(
    listings.filter((listing) => listing.promoted),
    usedListingIds,
    5
  );
  const newest = takeUniqueListings(
    [...listings].sort(
      (first, second) =>
        new Date(second.publishedAt).getTime() -
        new Date(first.publishedAt).getTime()
    ),
    usedListingIds,
    5
  );
  const availableNow = takeUniqueListings(listings, usedListingIds, 5);

  return (
    <div
      className="dealer-desktop-discovery-content hidden lg:block"
      data-slot="dealer-desktop-discovery-content"
    >
      <section className="dealer-desktop-discovery-index">
        <div className="dealer-desktop-index-heading">
          <div>
            <p className="dealer-desktop-index-eyebrow">
              {isBg ? "Намерете своя автомобил" : "Find your vehicle"}
            </p>
            <h2>{isBg ? "Разгледайте по тип" : "Browse by body type"}</h2>
          </div>
          <Link className="dealer-desktop-section-link" href={currentPath}>
            {isBg ? "Всички автомобили" : "All vehicles"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <nav
          aria-label={isBg ? "Типове автомобили" : "Vehicle body types"}
          className="dealer-desktop-body-types"
        >
          {bodyTypeOptions.map((option) => (
            <Link
              className="dealer-desktop-body-type-card"
              href={buildMarketplaceSearchHref(
                { body: option.id, category: "car" },
                currentPath
              )}
              key={option.id}
            >
              <BodyTypeSilhouette bodyType={option.id} />
              <span>{isBg ? option.labelBg : option.labelEn}</span>
            </Link>
          ))}
        </nav>
        {popularMakes.length > 0 ? (
          <div className="dealer-desktop-brands-block">
            <p>{isBg ? "Популярни марки" : "Popular makes"}</p>
            <nav
              aria-label={isBg ? "Популярни марки" : "Popular makes"}
              className="dealer-desktop-brands"
            >
              {popularMakes.map((make) => (
                <Link
                  href={buildMarketplaceSearchHref(
                    { category: "car", make },
                    currentPath
                  )}
                  key={make}
                >
                  {make}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </section>

      <DesktopVehicleRow
        description={
          isBg
            ? "Подбрани предложения, които заслужават първо внимание."
            : "Curated vehicles worth seeing first."
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
        title={isBg ? "Още в наличност" : "More to discover"}
      />
    </div>
  );
};
