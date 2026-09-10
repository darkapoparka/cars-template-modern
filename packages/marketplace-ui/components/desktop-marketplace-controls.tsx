"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import {
  type ListingViewMode,
  leadSite,
  type MarketplaceSearchParams,
} from "@repo/marketplace";
import { Globe2, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import {
  formatVehicleCount,
  getActiveFilterChips,
  getMarketplaceResultTitle,
} from "../lib/marketplace-results-toolbar-policy";
import { MarketplaceLocaleSwitchLink } from "./marketplace-locale-switch-link";

export type { ActiveFilterChip } from "../lib/marketplace-results-toolbar-policy";
export {
  formatVehicleCount,
  getActiveFilterChips,
} from "../lib/marketplace-results-toolbar-policy";

const MobileNarrowFilterTrigger = ({
  activeFilterCount,
  isBg,
  onOpenFilters,
}: {
  activeFilterCount: number;
  isBg: boolean;
  onOpenFilters?: () => void;
}) => {
  if (!onOpenFilters) {
    return null;
  }

  const label = isBg ? "Филтри" : "Filters";
  return (
    <Button
      aria-label={`${label}${
        activeFilterCount > 0 ? ` (${activeFilterCount})` : ""
      }`}
      className="hidden h-9 gap-1.5 rounded-lg border border-border bg-card px-2.5 font-medium text-foreground text-xs shadow-none max-[359px]:inline-flex"
      data-slot="mobile-narrow-filter-trigger"
      onClick={onOpenFilters}
      type="button"
      variant="outline"
    >
      <SlidersHorizontal aria-hidden="true" className="size-4" />
      <span>{label}</span>
      {activeFilterCount > 0 ? (
        <span className="grid min-h-4 min-w-4 place-items-center rounded-full bg-[var(--lead-site-accent)] px-1 font-semibold text-[10px] text-white">
          {activeFilterCount}
        </span>
      ) : null}
    </Button>
  );
};

export const ResultToolbar = ({
  filters,
  hideDesktopSummary = false,
  locale,
  onClearFilters,
  onOpenFilters,
  onViewModeChange,
  totalListings,
  viewMode,
}: {
  filters: MarketplaceSearchParams;
  hideDesktopSummary?: boolean;
  locale?: string;
  onClearFilters?: () => void;
  onOpenFilters?: () => void;
  onViewModeChange: (viewMode: ListingViewMode) => void;
  totalListings: number;
  viewMode: ListingViewMode;
}) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const formattedCount = formatVehicleCount(
    totalListings,
    filters.category,
    locale
  );
  const resultTitle = getMarketplaceResultTitle(filters, locale);
  const activeFilterCount = getActiveFilterChips(filters, locale).length;
  const clearFiltersLabel = isBg ? "Изчисти филтрите" : "Clear filters";

  const clearFiltersButton =
    activeFilterCount > 0 && onClearFilters ? (
      <Button
        aria-label={clearFiltersLabel}
        className="h-8 gap-1.5 rounded-lg px-2.5 text-xs max-[359px]:hidden"
        onClick={onClearFilters}
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" className="size-3.5" />
        {clearFiltersLabel}
      </Button>
    ) : null;

  return (
    <>
      <h1 className="sr-only" data-slot="marketplace-results-heading">
        {resultTitle}
      </h1>
      <div
        className={
          hideDesktopSummary
            ? "hidden"
            : "mb-5 hidden items-baseline justify-between gap-3 lg:flex"
        }
      >
        <div className="flex min-w-0 items-baseline gap-3">
          <p className="font-semibold text-foreground text-page-title tracking-tight">
            {resultTitle}
          </p>
          <p
            aria-live="polite"
            className="text-meta text-muted-foreground"
            data-slot="marketplace-results-count"
          >
            {formattedCount}
          </p>
        </div>
        {clearFiltersButton}
      </div>
      <div
        className={cn(
          leadSite.staticDemoMode
            ? "hidden"
            : "mb-2 flex min-h-11 items-center justify-between gap-2 py-1 lg:hidden"
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-card-title">{resultTitle}</p>
          <p
            aria-live="polite"
            className="text-meta text-muted-foreground"
            data-slot="marketplace-results-count"
          >
            {formattedCount}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <MobileNarrowFilterTrigger
            activeFilterCount={activeFilterCount}
            isBg={isBg}
            onOpenFilters={onOpenFilters}
          />
          {clearFiltersButton}
          <MarketplaceLocaleSwitchLink
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-semibold text-foreground text-meta"
            label={isBg ? "English" : "Български"}
            locale={locale}
          >
            <Globe2 aria-hidden="true" className="size-4" />
            {isBg ? "EN" : "BG"}
          </MarketplaceLocaleSwitchLink>
          <MarketplaceViewModeToggle
            locale={locale}
            onViewModeChange={onViewModeChange}
            viewMode={viewMode}
          />
        </div>
      </div>
    </>
  );
};

export const MarketplaceViewModeToggle = ({
  className,
  disabled = false,
  labels,
  locale,
  onViewModeChange,
  viewMode,
}: {
  className?: string;
  disabled?: boolean;
  labels?: { grid: string; group: string; list: string };
  locale?: string;
  onViewModeChange: (viewMode: ListingViewMode) => void;
  viewMode: ListingViewMode;
}) => {
  const copy = getMarketplaceControlCopy(locale);
  const viewCopy = labels ?? copy.view;

  return (
    <fieldset
      aria-label={viewCopy.group}
      className={cn(
        "flex shrink-0 items-center gap-0.5 rounded-lg bg-secondary p-0.5",
        className
      )}
    >
      {(
        [
          ["list", viewCopy.list, List],
          ["grid", viewCopy.grid, LayoutGrid],
        ] as const
      ).map(([mode, label, Icon]) => (
        <Button
          aria-label={label}
          aria-pressed={viewMode === mode}
          className={cn(
            "size-11 rounded-lg text-muted-foreground shadow-none lg:size-7 lg:rounded-md",
            viewMode === mode &&
              "bg-card text-foreground shadow-sm hover:bg-card"
          )}
          disabled={disabled}
          key={mode}
          onClick={() => onViewModeChange(mode)}
          size="icon"
          title={label}
          type="button"
          variant="ghost"
        >
          <Icon aria-hidden="true" className="size-4" strokeWidth={2} />
        </Button>
      ))}
    </fieldset>
  );
};
