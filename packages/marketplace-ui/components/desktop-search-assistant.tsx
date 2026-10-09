"use client";

import { cn } from "@repo/design-system/lib/utils";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DesktopSearchScope,
  getDesktopSearchSuggestionGroups,
  readRecentMarketplaceSearches,
  rememberMarketplaceSearchQuery,
} from "../lib/desktop-search-policy";
import { handleDesktopSearchKeyDown } from "../lib/search-keyboard";
import {
  type DesktopSearchAppearance,
  DesktopSearchDialog,
} from "./desktop-search-dialog";

export type { DesktopSearchScope } from "../lib/desktop-search-policy";
export { rememberMarketplaceSearchQuery } from "../lib/desktop-search-policy";

interface DesktopSearchAssistantProps {
  appearance?: DesktopSearchAppearance;
  ariaLabel: string;
  assistantSlot?: ReactNode;
  compact?: boolean;
  filterSlot?: ReactNode;
  isBg: boolean;
  label: string;
  listings?: readonly InventorySearchListing[];
  locale?: string;
  onOpenChange?: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  open?: boolean;
  placeholder: string;
  query: string;
  scope: DesktopSearchScope;
  searchActionLabel?: string;
}

const getSearchAppearanceClasses = (appearance: DesktopSearchAppearance) => ({
  container: appearance === "hero" ? "static" : "",
  label: appearance === "standard" ? "" : "sr-only",
  value: appearance === "standard" ? "" : "mt-0",
});

export const DesktopSearchAssistant = ({
  ariaLabel,
  assistantSlot,
  compact = true,
  appearance = "standard",
  filterSlot,
  listings,
  isBg,
  label,
  locale,
  onOpenChange,
  onQueryChange,
  onSearch,
  open: controlledOpen,
  placeholder,
  query,
  searchActionLabel,
  scope,
}: DesktopSearchAssistantProps) => {
  const appearanceClasses = getSearchAppearanceClasses(appearance);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const launcherInputRef = useRef<HTMLInputElement>(null);
  const dialogInputRef = useRef<HTMLInputElement>(null);
  const preventLauncherFocusOpenRef = useRef(false);
  const dialogId = useId();
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const searchDialogOpenRef = useRef(open);
  searchDialogOpenRef.current = open;
  const trimmedQuery = query.trim();
  const showSuggestions = !filterSlot || trimmedQuery.length > 0;

  const groups = useMemo(
    () =>
      open && showSuggestions
        ? getDesktopSearchSuggestionGroups({
            listings,
            isBg,
            locale,
            query: trimmedQuery,
            recentSearches,
            scope,
          })
        : [],
    [
      isBg,
      listings,
      locale,
      open,
      recentSearches,
      scope,
      showSuggestions,
      trimmedQuery,
    ]
  );

  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const activeItem = showSuggestions ? items[activeIndex] : undefined;

  const handleOpenChange = (nextOpen: boolean) => {
    searchDialogOpenRef.current = nextOpen;
    setOpen(nextOpen);
    if (!nextOpen) {
      setActiveIndex(-1);
    }
  };

  const openAssistant = () => {
    if (searchDialogOpenRef.current) {
      return;
    }
    setRecentSearches(readRecentMarketplaceSearches(scope));
    setActiveIndex(-1);
    handleOpenChange(true);
  };

  const commitSearch = (nextQuery: string, href?: string) => {
    const normalizedQuery = nextQuery.trim();
    if (!normalizedQuery) {
      return;
    }
    onQueryChange(normalizedQuery);
    setRecentSearches(rememberMarketplaceSearchQuery(normalizedQuery, scope));
    setActiveIndex(-1);
    handleOpenChange(false);
    if (href) {
      router.push(href);
      return;
    }
    onSearch(normalizedQuery);
  };

  const submitModalSearch = () => {
    if (trimmedQuery) {
      setRecentSearches(rememberMarketplaceSearchQuery(trimmedQuery, scope));
    }
    setActiveIndex(-1);
    handleOpenChange(false);
    onSearch(trimmedQuery);
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) =>
    handleDesktopSearchKeyDown(event, {
      activeItem,
      commitSearch,
      items: showSuggestions ? items : [],
      onClose: () => handleOpenChange(false),
      open,
      openAssistant,
      query: trimmedQuery,
      setActiveIndex,
    });

  const restoreLauncherFocus = (event: Event) => {
    event.preventDefault();
    preventLauncherFocusOpenRef.current = true;
    launcherInputRef.current?.focus({ preventScroll: true });
    window.requestAnimationFrame(() => {
      preventLauncherFocusOpenRef.current = false;
    });
  };

  const dialogTitle = isBg ? "Търсене на автомобили" : "Search vehicles";

  return (
    <div
      className={cn(
        "relative min-w-0",
        !compact && "p-1.5",
        appearanceClasses.container
      )}
    >
      <label
        className={cn(
          "flex h-full min-w-0 flex-col justify-center transition-colors",
          compact
            ? "rounded-lg border border-border/90 bg-card px-4 focus-within:border-foreground/25 focus-within:ring-2 focus-within:ring-ring/25 focus-within:ring-inset"
            : "rounded-xl px-4 focus-within:bg-control hover:bg-canvas",
          appearance !== "standard" &&
            "h-[var(--control-height-search)] rounded-xl border border-border bg-panel pr-20 pl-12 focus-within:ring-ring",
          { standard: "", hero: "relative pr-4 pl-4", toolbar: "pl-4" }[
            appearance
          ]
        )}
        data-slot="desktop-search-query"
      >
        <span
          className={cn("font-semibold text-micro", appearanceClasses.label)}
        >
          {label}
        </span>
        <span
          className={cn(
            "mt-1 flex min-w-0 items-center",
            appearanceClasses.value
          )}
        >
          <input
            aria-autocomplete="list"
            aria-controls={open ? dialogId : undefined}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={ariaLabel}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-compact-control outline-none placeholder:text-muted-foreground"
            disabled={!ready}
            name="q"
            onChange={(event) => {
              onQueryChange(event.target.value);
              setActiveIndex(-1);
              handleOpenChange(true);
            }}
            onClick={openAssistant}
            onFocus={() => {
              if (!preventLauncherFocusOpenRef.current) {
                openAssistant();
              }
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={placeholder}
            ref={launcherInputRef}
            role="combobox"
            spellCheck={false}
            type="search"
            value={query}
          />
        </span>
      </label>

      <DesktopSearchDialog
        activeIndex={activeIndex}
        activeItem={activeItem}
        appearance={appearance}
        ariaLabel={ariaLabel}
        assistantSlot={assistantSlot}
        dialogId={dialogId}
        dialogInputRef={dialogInputRef}
        dialogTitle={dialogTitle}
        filterSlot={filterSlot}
        groups={groups}
        handleOpenChange={handleOpenChange}
        isBg={isBg}
        items={items}
        listboxId={listboxId}
        onCloseAutoFocus={restoreLauncherFocus}
        onCommit={commitSearch}
        onQueryChange={onQueryChange}
        onSearchKeyDown={handleSearchKeyDown}
        onSearchSubmit={submitModalSearch}
        onSelectIndex={setActiveIndex}
        open={open}
        placeholder={placeholder}
        query={query}
        scope={scope}
        searchActionLabel={searchActionLabel}
        showSuggestions={showSuggestions}
      />
    </div>
  );
};
