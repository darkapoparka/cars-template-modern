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
  leadSite,
  type MarketplaceSearchParams,
  type VehicleCategory,
  withCategory,
} from "@repo/marketplace";
import { ChevronDown, Search, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { getLocalizedDesktopCategoryLabel } from "../lib/desktop-filter-policy";
import {
  localizeMarketplace,
  marketplaceCategorySelectorOptions,
} from "../lib/marketplace-filter-config";
import { getLocalizedPublicPath } from "../lib/public-path";
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
  categoryIcon,
  compact,
  filters,
  isBg,
  open,
}: {
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
        "group h-auto min-h-0 cursor-pointer justify-between self-stretch px-4 text-left shadow-none transition-[background-color,box-shadow] duration-150 focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent-ring)] focus-visible:ring-inset",
        compact
          ? "rounded-lg border border-border/90 bg-card hover:bg-control active:bg-control-hover"
          : "m-1.5 rounded-[14px] bg-control hover:bg-border/75 active:bg-border",
        open &&
          "bg-[var(--lead-site-accent)] text-white hover:bg-[var(--lead-site-accent-active)] active:bg-[var(--lead-site-accent-active)]"
      )}
      data-slot="desktop-search-category"
      type="button"
      variant="ghost"
    >
      <span className="min-w-0">
        <span
          className={cn(
            "block font-semibold text-xs leading-none",
            open ? "text-white/80" : "text-foreground"
          )}
        >
          {localizeMarketplace(isBg, "Категория", "Category")}
        </span>
        <span
          className={cn(
            "mt-1 flex items-center gap-2 truncate font-normal text-compact-control transition-colors",
            open
              ? "text-white group-hover:text-white"
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
          "size-4 opacity-50 transition-transform duration-150 group-hover:opacity-80",
          open && "rotate-180 text-white opacity-100 group-hover:opacity-100"
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
    className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl gap-0 overflow-hidden rounded-2xl border-zinc-200 bg-white p-0 shadow-2xl"
    data-slot="lead-category-dialog"
    showCloseButton={false}
  >
    <DialogHeader className="px-5 py-4 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <DialogTitle className="text-xl text-zinc-950 leading-7">
            {localizeMarketplace(
              isBg,
              "Изберете тип превозно средство",
              "Choose vehicle category"
            )}
          </DialogTitle>
          <DialogDescription className="mt-1 text-base text-zinc-600 leading-6">
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
            className="-mr-2 size-10 rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
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

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex min-h-32 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-transparent bg-zinc-100 p-3 text-center text-foreground transition-[border-color,background-color,box-shadow,color] hover:border-zinc-300 hover:bg-zinc-200 focus-visible:border-zinc-400 focus-visible:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/55",
              active &&
                "border-transparent bg-[var(--lead-site-accent)] text-white hover:border-transparent hover:bg-[var(--lead-site-accent-active)] hover:text-white focus-visible:border-transparent focus-visible:bg-[var(--lead-site-accent)] focus-visible:text-white focus-visible:ring-[var(--lead-site-accent-ring)]"
            )}
            data-slot="lead-category-option"
            href={buildMarketplaceSearchHref(
              withCategory(filters, category.id),
              getLocalizedPublicPath(
                locale,
                leadSite.staticDemoMode ? "/" : getCategoryPath(category.id)
              )
            )}
            key={category.id}
            onClick={onClose}
          >
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
                <span
                  className={cn(
                    "mt-1 text-micro",
                    active ? "text-white/75" : "text-zinc-500"
                  )}
                >
                  {formatVehicleCount(inventoryCount, category.id, locale)}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  </DialogContent>
);

export const DesktopDiscoverySearch = ({
  assistantSlot,
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
            ? "h-16 w-full grid-cols-[12rem_minmax(18rem,1fr)_3rem] grid-rows-[48px] gap-2 rounded-xl border border-border bg-control p-2"
            : "mx-auto h-16 w-full max-w-[70rem] grid-cols-[14rem_minmax(18rem,1fr)_4rem] rounded-[20px] border border-zinc-200 bg-card shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-shadow focus-within:shadow-[0_16px_42px_rgba(0,0,0,0.24)]",
          searchMenuOpen &&
            !compact &&
            "relative z-[60] rounded-b-none shadow-[0_18px_38px_rgba(0,0,0,0.2)] focus-within:shadow-[0_18px_38px_rgba(0,0,0,0.2)]"
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
              "bg-[var(--lead-site-accent)] font-semibold text-white shadow-none hover:bg-[var(--lead-site-accent-hover)]",
              compact ? "size-[46px] rounded-lg" : "size-12 rounded-full"
            )}
            data-search-menu-action
            onClick={submitSearch}
            size="icon-lg"
            type="button"
          >
            <Search
              aria-hidden="true"
              className="size-[18px]"
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
