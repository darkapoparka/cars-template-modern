import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@repo/design-system/components/ui/carousel";
import {
  buildMarketplaceSearchHref,
  getListingPath,
  type VehicleListing,
} from "@repo/marketplace";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";
import { DealerDesktopServiceLinks } from "./dealer-desktop-service-links";
import { VehicleCard } from "./vehicle-card";

/** Server-ordered stock, with the existing carousel handling browsing; no duplicate datasets. */
export const DealerDesktopDiscoveryContent = ({
  currentPath,
  listings,
  locale,
}: {
  currentPath: string;
  listings: readonly VehicleListing[];
  locale?: string;
}) => {
  const isBg = locale?.startsWith("bg") ?? false;
  return (
    <section
      aria-labelledby="desktop-inventory-heading"
      className={styles.discoveryContent}
      data-slot="dealer-desktop-discovery-content"
    >
      <Carousel
        aria-label={isBg ? "Налични автомобили" : "Available vehicles"}
        opts={{ align: "start", slidesToScroll: "auto", loop: false }}
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="desktop-inventory-heading">
              {isBg ? "Налични автомобили" : "Available Vehicles"}
            </h2>
          </div>
          <div className={styles.sectionActions}>
            <Link
              className={styles.sectionAction}
              href={buildMarketplaceSearchHref(
                { category: "car" },
                currentPath
              )}
            >
              {isBg ? "Виж всички" : "View all vehicles"}
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
            <CarouselPrevious
              aria-label={isBg ? "Предишни автомобили" : "Previous vehicles"}
              className={styles.arrow}
            />
            <CarouselNext
              aria-label={isBg ? "Следващи автомобили" : "Next vehicles"}
              className={styles.arrow}
            />
          </div>
        </div>
        <CarouselContent>
          {listings.map((listing) => (
            <CarouselItem className={styles.vehicleSlide} key={listing.id}>
              <VehicleCard
                density="compact"
                desktopHeadingLevel={3}
                desktopLayout="grid"
                href={getLocalizedPublicPath(locale, getListingPath(listing))}
                listing={listing}
                locale={locale}
                presentation="discovery"
                priority={false}
                viewMode="grid"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <DealerDesktopServiceLinks locale={locale} placement="inventory" />
    </section>
  );
};
