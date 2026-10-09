"use client";

import { Button } from "@repo/design-system/components/ui/button";
import type { MarketplaceSearchParams } from "@repo/marketplace";
import { dealerVehicleTypes } from "../lib/dealer-vehicle-types";
import { getLocalizedDesktopCategoryLabel } from "../lib/desktop-filter-policy";
import styles from "./dealer-hero-search.module.css";
import Image from "./public-image";

/** Shared discovery types; each page retains its existing search-state owner. */
export function DealerVehicleTypePills({
  category,
  disabled,
  isBg,
  onSelect,
  slot = "desktop-home-types",
}: {
  category: MarketplaceSearchParams["category"];
  disabled: boolean;
  isBg: boolean;
  onSelect: (category: MarketplaceSearchParams["category"]) => void;
  slot?: "desktop-home-types" | "desktop-inventory-types";
}) {
  const carLabel = isBg ? "Автомобили" : "Cars";
  return (
    <fieldset
      aria-label={isBg ? "Тип превозно средство" : "Vehicle type"}
      className={styles.categoryPills}
      data-slot={slot}
    >
      {dealerVehicleTypes.map(({ id, artwork }) => (
        <Button
          aria-pressed={category === id}
          className={styles.categoryPill}
          data-category={id}
          disabled={disabled}
          key={id}
          onClick={() => onSelect(id)}
          type="button"
          variant="ghost"
        >
          <Image
            alt=""
            aria-hidden="true"
            className={styles.categoryArtwork}
            data-slot="desktop-vehicle-type-artwork"
            draggable={false}
            height={72}
            src={artwork}
            unoptimized
            width={132}
          />
          <span>
            {id === "car"
              ? carLabel
              : getLocalizedDesktopCategoryLabel(id, isBg)}
          </span>
        </Button>
      ))}
    </fieldset>
  );
}
