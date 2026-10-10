"use client";

import { getListingPath, type VehicleListing } from "@repo/marketplace";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";
import { VehicleCard } from "./vehicle-card";

function StockGrid({
  listings,
  locale,
}: {
  listings: readonly VehicleListing[];
  locale?: string;
}) {
  return (
    <div className={styles.stockGrid} data-slot="home-stock-grid">
      {listings.slice(0, 5).map((listing, index) => (
        <VehicleCard
          className={index === 4 ? styles.expandedStockPreview : undefined}
          compactDesktopGrid
          density="compact"
          desktopHeadingLevel={3}
          desktopImageSizes="(max-width: 1199px) calc((100vw - 148px) / 2), (max-width: 1399px) calc((100vw - 176px) / 4), (max-width: 1494px) calc((100vw - 192px) / 5), 258px"
          desktopLayout="grid"
          desktopSurface="landing"
          href={getLocalizedPublicPath(locale, getListingPath(listing))}
          key={listing.id}
          listing={listing}
          locale={locale}
          presentation="showroom"
          viewMode="grid"
        />
      ))}
    </div>
  );
}

/** Shows the supplied home preview; the inventory CTA opens the complete stock. */
export function DealerDesktopStock({
  currentPath,
  listings,
  locale,
  totalListings,
}: {
  currentPath: string;
  listings: readonly VehicleListing[];
  locale?: string;
  totalListings: number;
}) {
  const isBg = locale?.startsWith("bg") ?? false;
  const text = (bg: string, en: string) => (isBg ? bg : en);
  return (
    <section
      aria-labelledby="desktop-inventory-heading"
      className={styles.stockPanel}
      data-slot="home-stock-panel"
    >
      <div className={styles.sectionHeading}>
        <h2 id="desktop-inventory-heading">
          {text("Разгледайте автомобилите", "Explore our cars")}
        </h2>
      </div>
      <StockGrid listings={listings} locale={locale} />
      <Link className={styles.stockAction} href={currentPath}>
        {text("Виж всички автомобили", "View all cars")}
        <ArrowRight aria-hidden size={16} />
      </Link>
      <output aria-atomic="true" aria-live="polite" className="sr-only">
        {text("Показани ", "Showing ")}
        <span className="min-[1400px]:hidden">
          {Math.min(listings.length, 4)}
        </span>
        <span className="hidden min-[1400px]:inline">
          {Math.min(listings.length, 5)}
        </span>
        {text(` от ${totalListings} автомобила.`, ` of ${totalListings} cars.`)}
      </output>
    </section>
  );
}
