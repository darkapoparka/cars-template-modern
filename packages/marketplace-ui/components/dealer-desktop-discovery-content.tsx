import {
  buildMarketplaceSearchHref,
  getListingPath,
  type VehicleListing,
} from "@repo/marketplace";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";
import { VehicleCard } from "./vehicle-card";

/** Show the server's inventory order directly; discovery must not hide stock behind duplicate sections. */
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
  return (
    <section
      aria-labelledby="desktop-inventory-heading"
      className={styles.discoveryContent}
      data-slot="dealer-desktop-discovery-content"
    >
      <div className={styles.sectionHeading}>
        <h2 id="desktop-inventory-heading">
          {isBg ? "Налични автомобили" : "Available cars"}
        </h2>
        <Link
          className={styles.sectionAction}
          href={buildMarketplaceSearchHref(
            { category: "car", sort: "newest" },
            currentPath
          )}
        >
          {isBg ? "Виж всички" : "View all"}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
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
