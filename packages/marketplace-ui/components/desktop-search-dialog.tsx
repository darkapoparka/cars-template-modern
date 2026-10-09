"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { cn } from "@repo/design-system/lib/utils";
import { formatMoney } from "@repo/marketplace/format";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { isDealershipSite } from "@repo/marketplace/site-config";
import {
  CarFront,
  ChevronRight,
  Clock3,
  CornerDownLeft,
  MapPin,
  Search,
  Store,
  X,
} from "lucide-react";
import {
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useMemo,
} from "react";
import type {
  DesktopSearchScope,
  getDesktopSearchSuggestionGroups,
  SearchSuggestionItem,
} from "../lib/desktop-search-policy";
import Image from "./public-image";

export type DesktopSearchAppearance = "standard" | "toolbar" | "hero";

type DesktopSearchGroups = ReturnType<typeof getDesktopSearchSuggestionGroups>;

export const DesktopSearchDialog = ({
  activeIndex,
  activeItem,
  appearance,
  ariaLabel,
  assistantSlot,
  dialogId,
  dialogInputRef,
  dialogTitle,
  filterSlot,
  groups,
  handleOpenChange,
  isBg,
  items,
  listboxId,
  onCloseAutoFocus,
  onCommit,
  onQueryChange,
  onSearchKeyDown,
  onSearchSubmit,
  onSelectIndex,
  open,
  placeholder,
  query,
  scope,
  searchActionLabel,
  showSuggestions,
}: {
  activeIndex: number;
  activeItem?: SearchSuggestionItem;
  appearance: DesktopSearchAppearance;
  ariaLabel: string;
  assistantSlot?: ReactNode;
  dialogId: string;
  dialogInputRef: RefObject<HTMLInputElement | null>;
  dialogTitle: string;
  filterSlot?: ReactNode;
  groups: DesktopSearchGroups;
  handleOpenChange: (open: boolean) => void;
  isBg: boolean;
  items: SearchSuggestionItem[];
  listboxId: string;
  onCloseAutoFocus: (event: Event) => void;
  onCommit: (query: string, href?: string) => void;
  onQueryChange: (query: string) => void;
  onSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
  onSelectIndex: Dispatch<SetStateAction<number>>;
  open: boolean;
  placeholder: string;
  query: string;
  scope: DesktopSearchScope;
  searchActionLabel?: string;
  showSuggestions: boolean;
}) => {
  const itemIndices = useMemo(
    () => new Map(items.map((item, index) => [item.id, index])),
    [items]
  );
  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        className="fixed top-1/2 left-1/2 z-[var(--desktop-layer-dialog)] flex h-[var(--desktop-search-dialog-height)] w-[var(--desktop-search-dialog-width)] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-3xl border border-border/75 bg-panel p-0 shadow-overlay sm:max-w-none"
        data-slot="desktop-search-dialog"
        id={dialogId}
        onCloseAutoFocus={onCloseAutoFocus}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          dialogInputRef.current?.focus({ preventScroll: true });
        }}
        showCloseButton={false}
      >
        <DialogHeader className="shrink-0 bg-panel px-6 pt-5 text-left sm:px-8">
          <DialogDescription className="sr-only">
            {isBg
              ? "Търсете автомобили или задайте филтри. Натиснете Escape, за да затворите търсенето."
              : "Search vehicles or set filters. Press Escape to close search."}
          </DialogDescription>
          <div className="mx-auto flex w-full max-w-[var(--desktop-search-dialog-content)] items-center justify-between gap-4">
            <DialogTitle className="font-semibold text-foreground text-xl tracking-tight">
              {dialogTitle}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                aria-label={isBg ? "Затвори търсенето" : "Close search"}
                className="size-10 shrink-0 rounded-full border-0 bg-control text-muted-foreground hover:bg-control-hover hover:text-foreground"
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </DialogClose>
          </div>
          <div className="mx-auto w-full max-w-[var(--desktop-search-dialog-content)] pt-4 pb-5">
            <div className="relative flex min-w-0 items-center">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 size-5 text-muted-foreground"
              />
              <input
                aria-activedescendant={
                  showSuggestions && activeItem
                    ? `${listboxId}-${activeItem.id}`
                    : undefined
                }
                aria-autocomplete="list"
                aria-controls={showSuggestions ? listboxId : undefined}
                aria-expanded={open && showSuggestions}
                aria-label={ariaLabel}
                autoComplete="off"
                className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-control pr-5 pl-12 text-body text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30"
                name="q"
                onChange={(event) => {
                  onQueryChange(event.target.value);
                  onSelectIndex(-1);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder={placeholder}
                ref={dialogInputRef}
                role="combobox"
                spellCheck={false}
                type="search"
                value={query}
              />
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto bg-panel">
          <div className="mx-auto grid w-full gap-5 px-6 pb-5 sm:px-8">
            {filterSlot}
            {showSuggestions ? (
              <div
                aria-label={
                  isBg ? "Предложения за търсене" : "Search suggestions"
                }
                className="grid gap-2"
                data-search-scope={scope}
                data-slot="desktop-search-assistant"
                id={listboxId}
                role="listbox"
              >
                {groups.map((group) => (
                  <SearchSuggestionGroup
                    activeIndex={activeIndex}
                    group={group}
                    isBg={isBg}
                    itemIndices={itemIndices}
                    key={group.heading}
                    listboxId={listboxId}
                    narrow={appearance === "hero"}
                    onCommit={onCommit}
                    onSelectIndex={onSelectIndex}
                  />
                ))}
              </div>
            ) : null}
            {assistantSlot && showSuggestions ? (
              <div>{assistantSlot}</div>
            ) : null}
          </div>
        </div>
        <footer className="shrink-0 bg-panel px-6 pb-5 sm:px-8">
          {filterSlot ? (
            <div className="mx-auto flex w-full max-w-[var(--desktop-search-dialog-content)] items-center justify-end">
              <Button
                className="h-11 gap-2 rounded-full bg-brand px-6 font-semibold text-brand-foreground shadow-none hover:bg-[var(--lead-site-accent-hover)] hover:text-[var(--brand-hover-foreground)]"
                data-slot="desktop-search-submit"
                onClick={onSearchSubmit}
                type="button"
              >
                {searchActionLabel ??
                  (isBg ? "Покажи резултатите" : "Show results")}
                <Search aria-hidden="true" className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="mx-auto flex min-h-10 w-full max-w-[var(--desktop-search-dialog-footer)] items-center justify-between gap-4 text-micro text-muted-foreground">
              <span>
                {isBg
                  ? "↑↓ избор · Enter отвори · Esc затвори"
                  : "↑↓ select · Enter open · Esc close"}
              </span>
              <span className="hidden sm:inline">
                {isBg
                  ? "Натиснете Tab за навигация"
                  : "Tab to move through results"}
              </span>
            </div>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
};

const getSuggestionIcon = (kind: SearchSuggestionItem["kind"]) => {
  if (kind === "dealer") {
    return Store;
  }
  if (kind === "location") {
    return MapPin;
  }
  if (kind === "recent") {
    return Clock3;
  }
  if (kind === "search") {
    return Search;
  }
  return CarFront;
};

const ListingSuggestionContent = ({
  isBg,
  item,
  listing,
}: {
  isBg: boolean;
  item: SearchSuggestionItem;
  listing: InventorySearchListing;
}) => {
  const listingImage = listing.images[0];

  return (
    <>
      {listingImage ? (
        <Image
          alt={listingImage.alt}
          className="h-16 w-[var(--desktop-search-thumbnail-width)] shrink-0 rounded-xl object-cover"
          height={128}
          sizes="104px"
          src={listingImage.url}
          width={208}
        />
      ) : (
        <span className="grid h-16 w-[var(--desktop-search-thumbnail-width)] shrink-0 place-items-center rounded-xl bg-control text-muted-foreground">
          <CarFront aria-hidden="true" className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-compact-control text-foreground">
          {item.label}
        </span>
        <span className="mt-1 block truncate text-meta text-muted-foreground">
          {item.description}
        </span>
      </span>
      <span className="min-w-32 shrink-0 text-right">
        <span className="block font-semibold text-compact-control text-foreground">
          {formatMoney(listing.price, isBg ? "bg" : "en")}
        </span>
        {listing.monthlyEstimate ? (
          <span className="mt-1 block text-micro text-muted-foreground">
            {isBg ? "от " : "from "}
            {formatMoney(listing.monthlyEstimate, isBg ? "bg" : "en")}
            {isBg ? "/мес." : "/mo."}
          </span>
        ) : null}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </>
  );
};

const StandardSuggestionContent = ({
  item,
  locationPanel,
}: {
  item: SearchSuggestionItem;
  locationPanel: boolean;
}) => {
  const Icon = getSuggestionIcon(item.kind);

  return (
    <>
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center text-foreground/75",
          locationPanel ? "bg-transparent" : "rounded-lg bg-control"
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-meta">
          {item.label}
        </span>
        <span className="mt-0.5 block truncate text-meta text-muted-foreground">
          {item.description}
        </span>
      </span>
      {item.kind === "search" ? (
        <CornerDownLeft
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      ) : null}
      {locationPanel ? (
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      ) : null}
    </>
  );
};

const SearchSuggestionOption = ({
  id,
  isBg,
  item,
  onCommit,
  onMouseEnter,
  selected,
  spansWidePanel,
}: {
  id: string;
  isBg: boolean;
  item: SearchSuggestionItem;
  onCommit: (value: string, href?: string) => void;
  onMouseEnter: () => void;
  selected: boolean;
  spansWidePanel: boolean;
}) => {
  const listing = item.listing;
  const locationPanel = isDealershipSite && item.kind === "location";
  let surfaceClassName = "rounded-xl px-3 py-2.5";
  let dataSlot = "desktop-search-suggestion";
  if (listing) {
    surfaceClassName =
      "min-h-[var(--desktop-search-result-height)] rounded-xl px-3 py-2";
    dataSlot = "desktop-search-listing-suggestion";
  } else if (locationPanel) {
    surfaceClassName =
      "min-h-[var(--desktop-search-result-height)] rounded-xl bg-control px-4 py-3 hover:bg-control-hover";
    dataSlot = "desktop-search-location-suggestion";
  }

  const selectedSurface = locationPanel
    ? "bg-control-hover text-foreground"
    : "bg-control text-foreground";
  const selectedClassName = selected ? selectedSurface : undefined;

  return (
    <Button
      aria-selected={selected}
      className={cn(
        "h-auto w-full justify-start text-left font-normal",
        surfaceClassName,
        selectedClassName,
        spansWidePanel && "desktop-wide:col-span-2"
      )}
      data-slot={dataSlot}
      id={id}
      onClick={() => onCommit(item.value, item.href)}
      onMouseDown={(event) => event.preventDefault()}
      onMouseEnter={onMouseEnter}
      role="option"
      type="button"
      variant="ghost"
    >
      {listing ? (
        <ListingSuggestionContent isBg={isBg} item={item} listing={listing} />
      ) : (
        <StandardSuggestionContent item={item} locationPanel={locationPanel} />
      )}
    </Button>
  );
};

const SearchSuggestionGroup = ({
  group,
  itemIndices,
  activeIndex,
  isBg,
  listboxId,
  narrow,
  onCommit,
  onSelectIndex,
}: {
  group: { heading: string; items: readonly SearchSuggestionItem[] };
  itemIndices: ReadonlyMap<string, number>;
  activeIndex: number;
  isBg: boolean;
  listboxId: string;
  narrow: boolean;
  onCommit: (value: string, href?: string) => void;
  onSelectIndex: (index: number) => void;
}) => {
  const twoColumns =
    !narrow &&
    group.items.length > 1 &&
    !group.items.some((item) => item.listing);
  return (
    <div className="not-last:mb-2">
      <p className="px-3 py-1.5 font-medium text-micro text-muted-foreground">
        {group.heading}
      </p>
      <div
        className={cn("grid gap-0.5", twoColumns && "desktop-wide:grid-cols-2")}
      >
        {group.items.map((item, groupItemIndex) => {
          const itemIndex = itemIndices.get(item.id) ?? -1;
          const spansWidePanel =
            twoColumns &&
            group.items.length % 2 === 1 &&
            groupItemIndex === group.items.length - 1;
          return (
            <SearchSuggestionOption
              id={`${listboxId}-${item.id}`}
              isBg={isBg}
              item={item}
              key={item.id}
              onCommit={onCommit}
              onMouseEnter={() => onSelectIndex(itemIndex)}
              selected={itemIndex === activeIndex}
              spansWidePanel={spansWidePanel}
            />
          );
        })}
      </div>
    </div>
  );
};
