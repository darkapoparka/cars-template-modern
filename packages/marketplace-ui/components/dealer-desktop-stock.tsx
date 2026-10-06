"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { getListingPath, type VehicleListing } from "@repo/marketplace";
import Link from "next/link";
import { type CSSProperties, useState } from "react";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-discovery.module.css";
import { VehicleCard } from "./vehicle-card";

const stockLabels = {
  all: ["Всички", "All"],
  new: ["Нови", "New"],
  used: ["Употребявани", "Used"],
  recommended: ["Препоръчани", "Recommended"],
  recent: ["Последни", "Recently added"],
} as const;

interface StockView {
  id: keyof typeof stockLabels;
  listings: readonly VehicleListing[];
}

const getStockViews = (listings: readonly VehicleListing[]): StockView[] => {
  const views: StockView[] = [{ id: "all", listings }];
  const newCars = listings.filter((listing) => listing.badges.includes("new"));
  const usedCars = listings.filter((listing) =>
    listing.badges.includes("used")
  );
  // Condition tabs need both kinds of stock; never infer condition from age/mileage.
  if (newCars.length > 0 && usedCars.length > 0) {
    views.push(
      { id: "new", listings: newCars },
      { id: "used", listings: usedCars }
    );
  }
  const recommended = listings.filter((listing) => listing.promoted);
  if (recommended.length > 0 && recommended.length < listings.length) {
    views.push({ id: "recommended", listings: recommended });
  }
  const datedListings = listings.filter((listing) =>
    Number.isFinite(Date.parse(listing.publishedAt))
  );
  if (new Set(datedListings.map((listing) => listing.publishedAt)).size > 1) {
    views.push({
      id: "recent",
      listings: datedListings
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .slice(0, 8),
    });
  }
  return views;
};

function StockGrid({
  listings,
  locale,
}: {
  listings: readonly VehicleListing[];
  locale?: string;
}) {
  return (
    <div className={styles.stockGrid} data-slot="home-stock-grid">
      {listings.slice(0, 8).map((listing) => (
        <VehicleCard
          density="compact"
          desktopHeadingLevel={3}
          desktopImageSizes="(max-width: 1199px) calc((100vw - 184px) / 3), (max-width: 1399px) calc((100vw - 216px) / 4), 296px"
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

/** Filters the supplied home preview; the inventory CTA opens the complete stock. */
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
  const views = getStockViews(listings);
  const [activeView, setActiveView] = useState("all");
  const selected = views.find((view) => view.id === activeView) ?? views[0];
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
        <p>
          {text(
            `${totalListings} автомобила за разглеждане`,
            `${totalListings} cars to explore`
          )}
        </p>
      </div>
      {views.length > 1 ? (
        <Tabs
          className={styles.stockSwitch}
          onValueChange={setActiveView}
          value={selected.id}
        >
          <TabsList
            aria-label={text("Разгледайте автомобилите", "Browse inventory")}
            className={styles.stockTabs}
            data-slot="home-stock-tabs"
            style={
              {
                "--stock-tab-count": views.length,
                "--stock-active-index": views.indexOf(selected),
              } as CSSProperties
            }
          >
            <span
              aria-hidden="true"
              className={styles.stockIndicator}
              data-slot="home-stock-indicator"
            />
            {views.map((view) => (
              <TabsTrigger key={view.id} value={view.id}>
                {stockLabels[view.id][isBg ? 0 : 1]}
                {listings.length === totalListings && (
                  <span aria-hidden="true" className={styles.stockTabCount}>
                    {view.listings.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {views.map((view) => (
            <TabsContent
              className={styles.stockView}
              key={view.id}
              value={view.id}
            >
              <StockGrid listings={view.listings} locale={locale} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <StockGrid listings={listings} locale={locale} />
      )}
      <output aria-atomic="true" aria-live="polite" className="sr-only">
        {text(
          `Показани ${Math.min(selected.listings.length, 8)} автомобила: ${stockLabels[selected.id][0]}.`,
          `Showing ${Math.min(selected.listings.length, 8)} cars: ${stockLabels[selected.id][1]}.`
        )}
      </output>
      <Link className={styles.primaryAction} href={currentPath}>
        {text("Виж всички автомобили", "View all cars")}
      </Link>
    </section>
  );
}
