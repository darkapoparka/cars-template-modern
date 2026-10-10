"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { cn } from "@repo/design-system/lib/utils";
import {
  buildMarketplaceSearchHref,
  getCategoryPath,
  type MarketplaceSearchParams,
  type VehicleCategory,
  withCategory,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { ChevronDown, Search, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { getLocalizedDesktopCategoryLabel } from "../lib/desktop-filter-policy";
import {
  localizeMarketplace,
  marketplaceCategorySelectorOptions,
} from "../lib/marketplace-filter-config";
import { getLocalizedPublicPath } from "../lib/public-path";
import filterStyles from "./desktop-full-filter-dialog.module.css";
import { formatVehicleCount } from "./desktop-marketplace-controls";
import {
  DesktopSearchAssistant,
  rememberMarketplaceSearchQuery,
} from "./desktop-search-assistant";
import { VehicleCategoryArtwork } from "./vehicle-category-artwork";

type ApplyFilters = (filters: Partial<MarketplaceSearchParams>) => void;
export interface DesktopCategoryInventoryCount {
  category: VehicleCategory;
  count: number;
}

export const DesktopCategoryPickerTrigger = ({
  appearance = "standard",
  categoryIcon,
  compact,
  filters,
  isBg,
  open,
}: {
  appearance?: "standard" | "toolbar" | "hero";
  categoryIcon?: ReactNode;
  compact: boolean;
  filters: MarketplaceSearchParams;
  isBg: boolean;
  open: boolean;
}) => (
  <DialogTrigger asChild>
    <Button
      aria-expanded={open}
      aria-label={localizeMarketplace(
        isBg,
        "Избери категория",
        "Choose category"
      )}
      className={cn(
        "group h-auto min-h-0 cursor-pointer justify-between self-stretch px-4 text-left shadow-none transition-[background-color,box-shadow] duration-[var(--duration-interaction)] focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent-ring)] focus-visible:ring-inset",
        compact
          ? "rounded-lg border border-border/90 bg-card hover:bg-control active:bg-control-hover"
          : "m-1.5 rounded-desktop-control bg-control hover:bg-border/75 active:bg-border",
        appearance !== "standard" &&
          "h-[var(--control-height-search)] w-52 shrink-0 rounded-xl bg-control",
        appearance === "hero" && "w-44",
        open &&
          "bg-brand text-brand-foreground hover:bg-[var(--lead-site-accent-active)] active:bg-[var(--lead-site-accent-active)] active:text-[var(--brand-active-foreground)]"
      )}
      data-slot="desktop-search-category"
      type="button"
      variant="ghost"
    >
      <span className="min-w-0">
        <span
          className={cn(
            "block font-semibold text-meta",
            open ? "text-brand-foreground/80" : "text-foreground"
          )}
        >
          {localizeMarketplace(isBg, "Категория", "Category")}
        </span>
        <span
          className={cn(
            "mt-1 flex items-center gap-2 truncate font-normal text-compact-control transition-colors",
            open
              ? "text-brand-foreground group-hover:text-brand-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {categoryIcon ?? (
            <VehicleCategoryArtwork
              category={filters.category}
              className="h-6 w-10 shrink-0"
              sizes="40px"
            />
          )}
          {getLocalizedDesktopCategoryLabel(filters.category, isBg)}
        </span>
      </span>
      <ChevronDown
        aria-hidden="true"
        className={cn(
          "size-4 opacity-50 transition-transform duration-[var(--duration-interaction)] group-hover:opacity-80",
          open &&
            "rotate-180 text-brand-foreground opacity-100 group-hover:opacity-100"
        )}
      />
    </Button>
  </DialogTrigger>
);

export const DesktopCategoryPickerContent = ({
  categoryCounts,
  filters,
  isBg,
  locale,
  onClose,
}: {
  categoryCounts?: DesktopCategoryInventoryCount[];
  filters: MarketplaceSearchParams;
  isBg: boolean;
  locale?: string;
  onClose: () => void;
}) => (
  <DialogContent
    className={cn(
      filterStyles.dialog,
      filterStyles.quickDialog,
      filterStyles.categoryDialog
    )}
    data-slot="lead-category-dialog"
    showCloseButton={false}
  >
    <DialogHeader className={filterStyles.header}>
      <div className="flex w-full items-center justify-between gap-4">
        <div>
          <DialogTitle className="text-dialog-title text-foreground">
            {localizeMarketplace(
              isBg,
              "Изберете тип превозно средство",
              "Choose vehicle category"
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {localizeMarketplace(
              isBg,
              "Категорията определя наличностите и филтрите в търсенето.",
              "The category controls the available inventory and search filters."
            )}
          </DialogDescription>
        </div>
        <DialogClose asChild>
          <Button
            aria-label={localizeMarketplace(isBg, "Затвори", "Close")}
            className={filterStyles.close}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </DialogClose>
      </div>
    </DialogHeader>
    <div className="grid grid-cols-2 gap-2 overflow-y-auto p-5 sm:grid-cols-4">
      {marketplaceCategorySelectorOptions.map((category) => {
        const active = filters.category === category.id;
        const inventoryCount = categoryCounts?.find(
          (entry) => entry.category === category.id
        )?.count;
        const className = cn(
          "group flex h-auto min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border bg-control p-3 text-center text-foreground transition-colors hover:bg-control-hover focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          active
            ? "border-selected bg-selected text-selected-foreground hover:bg-selected"
            : "border-transparent"
        );
        const content = (
          <>
            <span
              className="flex h-14 w-full shrink-0 items-center justify-center rounded-lg bg-inherit"
              data-slot="lead-category-image-surface"
            >
              <VehicleCategoryArtwork
                category={category.id}
                className="h-14 w-full"
                sizes="96px"
              />
            </span>
            <span className="flex min-w-0 flex-col items-center justify-center leading-tight">
              <span className="truncate font-semibold text-meta">
                {getLocalizedDesktopCategoryLabel(category.id, isBg)}
              </span>
              {inventoryCount === undefined ? null : (
                <span className="mt-1 text-micro opacity-75">
                  {formatVehicleCount(inventoryCount, category.id, locale)}
                </span>
              )}
            </span>
          </>
        );

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={className}
            data-slot="lead-category-option"
            href={buildMarketplaceSearchHref(
              withCategory(filters, category.id),
              getLocalizedPublicPath(locale, getCategoryPath(category.id))
            )}
            key={category.id}
            onClick={onClose}
          >
            {content}
          </Link>
        );
      })}
    </div>
  </DialogContent>
);

export const DesktopDiscoverySearch = ({
  assistantSlot,
  searchListings,
  categoryCounts,
  compact,
  filters,
  isBg,
  locale,
  onApply,
  query,
  setQuery,
}: {
  assistantSlot?: ReactNode;
  searchListings?: readonly InventorySearchListing[];
  categoryCounts?: DesktopCategoryInventoryCount[];
  compact: boolean;
  filters: MarketplaceSearchParams;
  isBg: boolean;
  locale?: string;
  onApply: ApplyFilters;
  query: string;
  setQuery: (query: string) => void;
}) => {
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);

  const submitSearch = () => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setSearchMenuOpen(false);
      return;
    }
    rememberMarketplaceSearchQuery(normalizedQuery, "vehicles");
    setSearchMenuOpen(false);
    onApply({ q: normalizedQuery });
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        setCategoryMenuOpen(open);
        if (open) {
          setSearchMenuOpen(false);
        }
      }}
      open={categoryMenuOpen}
    >
      <div
        className={cn(
          "grid items-stretch",
          compact
            ? "h-16 w-full grid-cols-[var(--desktop-search-compact-columns)] grid-rows-[var(--desktop-filter-height)] gap-2 rounded-xl border border-border bg-control p-2"
            : "mx-auto h-16 w-full max-w-[var(--desktop-search-max)] grid-cols-[var(--desktop-search-columns)] rounded-desktop-frame border border-border bg-card shadow-overlay transition-shadow focus-within:shadow-overlay",
          searchMenuOpen &&
            !compact &&
            "relative z-[var(--desktop-layer-popover)] rounded-b-none shadow-overlay focus-within:shadow-overlay"
        )}
        data-slot="desktop-search-surface"
      >
        <DesktopCategoryPickerTrigger
          compact={compact}
          filters={filters}
          isBg={isBg}
          open={categoryMenuOpen}
        />
        <DesktopSearchAssistant
          ariaLabel={localizeMarketplace(
            isBg,
            "Търсене на автомобили",
            "Search vehicles"
          )}
          assistantSlot={assistantSlot}
          compact={compact}
          isBg={isBg}
          label={localizeMarketplace(isBg, "Търсене", "Search")}
          listings={searchListings}
          locale={locale}
          onOpenChange={(open) => {
            setSearchMenuOpen(open);
            if (open) {
              setCategoryMenuOpen(false);
            }
          }}
          onQueryChange={setQuery}
          onSearch={(nextQuery) => onApply({ q: nextQuery })}
          open={searchMenuOpen}
          placeholder={localizeMarketplace(
            isBg,
            "Марка, модел или ключова дума",
            "Make, model or keyword"
          )}
          query={query}
          scope="vehicles"
        />
        <div
          className={cn(
            "grid min-h-0",
            compact ? "place-items-center" : "m-1.5 place-items-center"
          )}
          data-slot="desktop-search-action"
        >
          <Button
            aria-label={localizeMarketplace(isBg, "Търси", "Search")}
            className={cn(
              "bg-brand font-semibold text-brand-foreground shadow-none hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)]",
              compact
                ? "size-[var(--desktop-submit-size)] rounded-lg"
                : "size-12 rounded-full"
            )}
            data-search-menu-action
            onClick={submitSearch}
            size="icon-lg"
            type="button"
          >
            <Search
              aria-hidden="true"
              className="size-[var(--desktop-icon-size)]"
              strokeWidth={2.2}
            />
          </Button>
        </div>
      </div>
      <DesktopCategoryPickerContent
        categoryCounts={categoryCounts}
        filters={filters}
        isBg={isBg}
        locale={locale}
        onClose={() => setCategoryMenuOpen(false)}
      />
    </Dialog>
  );
};
