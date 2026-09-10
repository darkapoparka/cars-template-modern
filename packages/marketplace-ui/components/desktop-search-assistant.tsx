"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { formatMoney, leadSite, type VehicleListing } from "@repo/marketplace";
import {
  CarFront,
  ChevronRight,
  Clock3,
  CornerDownLeft,
  MapPin,
  Search,
  Store,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  type DesktopSearchScope,
  getDesktopSearchSuggestionGroups,
  readRecentMarketplaceSearches,
  rememberMarketplaceSearchQuery,
  type SearchSuggestionItem,
} from "../lib/desktop-search-policy";

export type { DesktopSearchScope } from "../lib/desktop-search-policy";
export { rememberMarketplaceSearchQuery } from "../lib/desktop-search-policy";

interface DesktopSearchAssistantProps {
  ariaLabel: string;
  assistantSlot?: ReactNode;
  compact?: boolean;
  isBg: boolean;
  label: string;
  locale?: string;
  onOpenChange?: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  open?: boolean;
  placeholder: string;
  query: string;
  scope: DesktopSearchScope;
}

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
  listing: VehicleListing;
}) => {
  const listingImage = listing.images[0];

  return (
    <>
      {listingImage ? (
        <Image
          alt={listingImage.alt}
          className="h-16 w-[104px] shrink-0 rounded-xl object-cover"
          height={128}
          sizes="104px"
          src={listingImage.url}
          width={208}
        />
      ) : (
        <span className="grid h-16 w-[104px] shrink-0 place-items-center rounded-xl bg-control text-muted-foreground">
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
        <span className="block truncate font-medium text-sm">{item.label}</span>
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
  const locationPanel = leadSite.staticDemoMode && item.kind === "location";
  let surfaceClassName = "rounded-xl px-3 py-2.5";
  let dataSlot = "desktop-search-suggestion";
  if (listing) {
    surfaceClassName = "min-h-[76px] rounded-xl px-3 py-2";
    dataSlot = "desktop-search-listing-suggestion";
  } else if (locationPanel) {
    surfaceClassName =
      "min-h-[76px] rounded-xl bg-control px-4 py-3 hover:bg-control-hover";
    dataSlot = "desktop-search-location-suggestion";
  }

  const selectedClassName = selected
    ? locationPanel
      ? "bg-control-hover text-foreground"
      : "bg-control text-foreground"
    : undefined;

  return (
    <Button
      aria-selected={selected}
      className={cn(
        "h-auto w-full justify-start text-left font-normal",
        surfaceClassName,
        selectedClassName,
        spansWidePanel && "min-[70rem]:col-span-2"
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

const DesktopSearchFocusCanvas = ({
  anchor,
  compact,
  isBg,
  onDismiss,
  open,
}: {
  anchor: HTMLDivElement | null;
  compact: boolean;
  isBg: boolean;
  onDismiss: () => void;
  open: boolean;
}) => {
  if (!(open && !compact) || typeof document === "undefined") {
    return null;
  }

  const root =
    anchor?.closest<HTMLElement>(
      '[data-slot="desktop-marketplace-header-band"]'
    ) ?? document.body;
  const top =
    anchor
      ?.closest<HTMLElement>('[data-slot="desktop-search-surface"]')
      ?.getBoundingClientRect().bottom ?? 0;

  return createPortal(
    <button
      aria-label={
        isBg ? "Затвори предложенията за търсене" : "Close search suggestions"
      }
      className="fixed inset-x-0 bottom-0 z-[5] cursor-default border-0 bg-black/20 p-0"
      data-slot="desktop-search-focus-canvas"
      onPointerDown={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      style={{ top }}
      tabIndex={-1}
      type="button"
    />,
    root
  );
};

export const DesktopSearchAssistant = ({
  ariaLabel,
  assistantSlot,
  compact = true,
  isBg,
  label,
  locale,
  onOpenChange,
  onQueryChange,
  onSearch,
  open: controlledOpen,
  placeholder,
  query,
  scope,
}: DesktopSearchAssistantProps) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const trimmedQuery = query.trim();

  const groups = useMemo(
    () =>
      getDesktopSearchSuggestionGroups({
        isBg,
        locale,
        query: trimmedQuery,
        recentSearches,
        scope,
      }),
    [isBg, locale, recentSearches, scope, trimmedQuery]
  );

  const items = groups.flatMap((group) => group.items);
  const activeItem = items[activeIndex];

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        if (
          event.target instanceof Element &&
          event.target.closest("[data-search-menu-action]")
        ) {
          return;
        }
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open, setOpen]);

  const openAssistant = () => {
    setRecentSearches(readRecentMarketplaceSearches(scope));
    setActiveIndex(-1);
    setOpen(true);
  };

  const commitSearch = (nextQuery: string, href?: string) => {
    const normalizedQuery = nextQuery.trim();
    if (!normalizedQuery) {
      return;
    }
    onQueryChange(normalizedQuery);
    setRecentSearches(rememberMarketplaceSearchQuery(normalizedQuery, scope));
    setActiveIndex(-1);
    setOpen(false);
    if (href) {
      router.push(href);
      return;
    }
    onSearch(normalizedQuery);
  };

  return (
    <div
      className={cn("relative min-w-0", !compact && "p-1.5")}
      ref={containerRef}
    >
      <DesktopSearchFocusCanvas
        anchor={containerRef.current}
        compact={compact}
        isBg={isBg}
        onDismiss={() => {
          setOpen(false);
          setActiveIndex(-1);
        }}
        open={open}
      />
      <label
        className={cn(
          "flex h-full min-w-0 flex-col justify-center transition-colors",
          compact
            ? "rounded-lg border border-border/90 bg-card px-4 focus-within:border-foreground/25 focus-within:ring-2 focus-within:ring-ring/25 focus-within:ring-inset"
            : "rounded-xl px-4 focus-within:bg-zinc-100 hover:bg-zinc-50"
        )}
        data-slot="desktop-search-query"
      >
        <span className="font-semibold text-xs leading-none">{label}</span>
        <span className="mt-1 flex min-w-0 items-center">
          <input
            aria-activedescendant={
              open && activeItem ? `${listboxId}-${activeItem.id}` : undefined
            }
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-label={ariaLabel}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-compact-control outline-none placeholder:text-muted-foreground"
            name="q"
            onChange={(event) => {
              onQueryChange(event.target.value);
              setActiveIndex(-1);
              setOpen(true);
            }}
            onFocus={openAssistant}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (!open) {
                  openAssistant();
                  setActiveIndex(0);
                  return;
                }
                setActiveIndex((currentIndex) =>
                  items.length ? (currentIndex + 1) % items.length : -1
                );
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((currentIndex) =>
                  items.length
                    ? (currentIndex <= 0 ? items.length : currentIndex) - 1
                    : -1
                );
                return;
              }
              if (event.key === "Escape" && open) {
                event.preventDefault();
                setOpen(false);
                setActiveIndex(-1);
                return;
              }
              if (event.key === "Tab") {
                setOpen(false);
                setActiveIndex(-1);
                return;
              }
              if (event.key === "Enter" && (activeItem || trimmedQuery)) {
                event.preventDefault();
                commitSearch(
                  activeItem?.value ?? trimmedQuery,
                  activeItem?.href
                );
              }
            }}
            placeholder={placeholder}
            role="combobox"
            spellCheck={false}
            type="search"
            value={query}
          />
        </span>
      </label>

      {open ? (
        <div
          aria-label={isBg ? "Предложения за търсене" : "Search suggestions"}
          className={cn(
            "absolute z-[70] max-h-[min(36rem,calc(100vh-13rem))] overflow-y-auto bg-white p-3",
            compact
              ? "top-[calc(100%+0.625rem)] -right-16 -left-52 rounded-2xl border border-zinc-200 shadow-none"
              : "top-[calc(100%-1px)] -right-16 -left-56 -mx-px rounded-b-2xl border-zinc-200 border-x border-b shadow-[0_28px_56px_rgba(7,12,18,0.18)]"
          )}
          data-search-scope={scope}
          data-slot="desktop-search-assistant"
          id={listboxId}
          role="listbox"
        >
          {groups.map((group) => (
            <div className="not-last:mb-2" key={group.heading}>
              <p className="px-3 py-1.5 font-medium text-muted-foreground text-xs">
                {group.heading}
              </p>
              <div
                className={cn(
                  "grid gap-0.5",
                  group.items.length > 1 &&
                    !group.items.some((item) => item.listing) &&
                    "min-[70rem]:grid-cols-2"
                )}
              >
                {group.items.map((item, groupItemIndex) => {
                  const itemIndex = items.findIndex(
                    (candidate) => candidate.id === item.id
                  );
                  const selected = itemIndex === activeIndex;
                  const spansWidePanel =
                    group.items.length > 1 &&
                    group.items.length % 2 === 1 &&
                    groupItemIndex === group.items.length - 1;
                  return (
                    <SearchSuggestionOption
                      id={`${listboxId}-${item.id}`}
                      isBg={isBg}
                      item={item}
                      key={item.id}
                      onCommit={commitSearch}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                      selected={selected}
                      spansWidePanel={spansWidePanel}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {assistantSlot ? (
            <div className="mt-1 pt-1">{assistantSlot}</div>
          ) : null}
          <div className="mt-1 flex items-center justify-between px-3 pt-2 pb-1 text-micro text-muted-foreground">
            <span>
              {isBg ? "↑↓ избор · Enter отвори" : "↑↓ select · Enter open"}
            </span>
            <span>Esc</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
