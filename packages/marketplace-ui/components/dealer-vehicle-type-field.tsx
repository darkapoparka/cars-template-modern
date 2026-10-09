"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import type { MarketplaceSearchParams } from "@repo/marketplace";
import { ChevronDown } from "lucide-react";
import { useDesktopMarketplaceViewport } from "../hooks/use-desktop-marketplace-viewport";
import { getDealerVehicleTypeArtwork } from "../lib/dealer-vehicle-types";
import { getLocalizedDesktopCategoryLabel } from "../lib/desktop-filter-policy";
import { marketplaceCategorySelectorOptions } from "../lib/marketplace-filter-config";
import searchStyles from "./dealer-hero-search.module.css";
import styles from "./dealer-inventory-search.module.css";
import Image from "./public-image";

export function DealerVehicleTypeField({
  category: selectedCategory,
  disabled,
  isBg,
  onSelect,
  slot,
}: {
  category: MarketplaceSearchParams["category"];
  disabled: boolean;
  isBg: boolean;
  onSelect: (category: MarketplaceSearchParams["category"]) => void;
  slot: "desktop-hero-category" | "dealer-inventory-type";
}) {
  const isDesktop = useDesktopMarketplaceViewport();
  const category = selectedCategory === "lease" ? "car" : selectedCategory;
  const label = getLocalizedDesktopCategoryLabel(category, isBg);
  const title = isBg ? "Тип превозно средство" : "Vehicle type";

  return (
    <div className={searchStyles.filterField} data-field="category">
      <DropdownMenu key={isDesktop ? "desktop" : "mobile"} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={title}
            aria-pressed={category !== "car"}
            className={`${searchStyles.field} ${searchStyles.typeField}`}
            data-slot={slot}
            disabled={disabled}
            title={`${isBg ? "Тип" : "Type"}: ${label}`}
            type="button"
            variant="ghost"
          >
            <span className={searchStyles.typeValue}>
              <span aria-hidden="true" className={searchStyles.typeArtwork}>
                {isDesktop ? (
                  <Image
                    alt=""
                    data-slot="desktop-vehicle-type-artwork"
                    draggable={false}
                    height={72}
                    src={getDealerVehicleTypeArtwork(category)}
                    unoptimized
                    width={132}
                  />
                ) : null}
              </span>
              <span className={searchStyles.typeLabel}>{label}</span>
            </span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className={styles.typeMenu}
          sideOffset={8}
        >
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            aria-label={title}
            onValueChange={(value) => {
              const next = marketplaceCategorySelectorOptions.find(
                ({ id }) => id === value
              );
              if (next && next.id !== category) {
                onSelect(next.id);
              }
            }}
            value={category}
          >
            {marketplaceCategorySelectorOptions.map(({ id }) => (
              <DropdownMenuRadioItem
                className={styles.typeOption}
                key={id}
                value={id}
              >
                {getLocalizedDesktopCategoryLabel(id, isBg)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
