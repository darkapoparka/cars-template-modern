"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import { cn } from "@repo/design-system/lib/utils";
import { withBasePath } from "@repo/internationalization/paths";
import { publicSite } from "@repo/marketplace/site-config";
import {
  DealerMobileBrandBar,
  DealerMobileHeaderIcon,
  getMobileQuickPillClassName,
  MobileDealerChrome,
  MobilePillRail,
  mobileHeaderIconActionClassName,
} from "@repo/marketplace-ui";
import { DealerDesktopHero } from "@repo/marketplace-ui/components/dealer-desktop-hero";
import Image from "@repo/marketplace-ui/components/public-image";
import {
  mobileSearchFieldClassName,
  mobileSearchIconClassName,
} from "@repo/marketplace-ui/lib/mobile-form-control";
import { mobileMarketplaceOverlayIconActionClassName } from "@repo/marketplace-ui/lib/mobile-overlay-styles";
import { getLocalizedPath } from "@repo/seo/metadata";
import {
  ArrowRight,
  BookOpenText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { type RefObject, useEffect, useRef, useState } from "react";
import {
  type ContentFilter,
  type ContentSearch,
  contentFilters,
  filterPublicContent,
  type PublicContentCard,
  parseContentSearch,
  serializeContentSearch,
} from "../../../lib/public-content";
import desktopStyles from "./public-desktop-layout.module.css";

interface MobileContentHubProps {
  initialSearch: ContentSearch;
  items: readonly PublicContentCard[];
  locale: "bg" | "en";
}

const desktopGuideVehicles = publicSite.artwork.desktopPageVehicles?.guides;
const desktopGuideHeroAppearance = desktopGuideVehicles
  ? "vehicles"
  : undefined;

const contentCategoryLabels = {
  bg: "Категории материали",
  en: "Content categories",
} as const;

const contentResultsLabels = {
  bg: "Намерени статии",
  en: "Matching articles",
} as const;

function ContentCategoryPills({
  filter,
  locale,
  mobile = false,
  onSelect,
  ready,
}: {
  filter: ContentFilter;
  locale: "bg" | "en";
  mobile?: boolean;
  onSelect: (value: ContentFilter) => void;
  ready: boolean;
}) {
  const buttons = contentFilters.map(({ id: value, ...labels }) => (
    <button
      aria-pressed={filter === value}
      className={
        mobile ? getMobileQuickPillClassName(filter === value) : undefined
      }
      disabled={!ready}
      key={value}
      onClick={() => onSelect(value)}
      type="button"
    >
      {labels[locale]}
    </button>
  ));
  return mobile ? (
    <MobilePillRail
      className="gap-2"
      data-slot="editorial-filter-pills"
      label={contentCategoryLabels[locale]}
    >
      {buttons}
    </MobilePillRail>
  ) : (
    <fieldset
      aria-label={contentCategoryLabels[locale]}
      className={desktopStyles.editorialPills}
      data-slot="editorial-desktop-filter-pills"
    >
      {buttons}
    </fieldset>
  );
}

function DesktopContentSearch({
  count,
  isBg,
  ready,
  query,
  inputRef,
  onQueryChange,
  onClear,
}: {
  count: number;
  isBg: boolean;
  ready: boolean;
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onClear: () => void;
}) {
  const label = isBg ? "Търси съвети и статии" : "Search guides and articles";
  return (
    <search aria-label={label} className={desktopStyles.editorialSearch}>
      <Search aria-hidden="true" size={20} />
      <input
        aria-label={label}
        disabled={!ready}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={label}
        ref={inputRef}
        type="search"
        value={query}
      />
      <output
        aria-atomic="true"
        aria-label={isBg ? "Намерени статии" : "Matching articles"}
        aria-live="polite"
        className="shrink-0 text-meta text-muted-foreground tabular-nums"
        data-slot="content-search-count-desktop"
      >
        ({count})
      </output>
      {query && (
        <button
          aria-label={isBg ? "Изчисти търсенето" : "Clear search"}
          onClick={onClear}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
      )}
    </search>
  );
}

export const MobileContentHub = ({
  locale,
  items,
  initialSearch,
}: MobileContentHubProps) => {
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState(initialSearch.query);
  const [filter, setFilter] = useState(initialSearch.filter);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterTrigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const desktopSearchInput = useRef<HTMLInputElement>(null);
  const focusSearch = () => {
    const target = window.matchMedia("(min-width: 1024px)").matches
      ? desktopSearchInput
      : searchInput;
    target.current?.focus({ preventScroll: true });
  };
  const isBg = locale === "bg";
  const localize = (path: string) => getLocalizedPath(locale, path);
  const visibleItems = filterPublicContent(items, { query, filter }, locale);
  const updateSearch = (search: ContentSearch) => {
    setQuery(search.query);
    setFilter(search.filter);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${serializeContentSearch(search)}`
    );
  };
  useEffect(() => {
    const restore = () => {
      const search = parseContentSearch(
        Object.fromEntries(new URLSearchParams(window.location.search))
      );
      setQuery(search.query);
      setFilter(search.filter);
    };
    // Returning to a cached page can restore props from before URL-only filtering.
    restore();
    setReady(true);
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const selectFilter = (value: ContentFilter) => {
    updateSearch({ query, filter: value });
    setFilterOpen(false);
  };

  return (
    <main
      className={cn(
        "min-h-[100dvh] bg-background pb-4 text-zinc-950",
        desktopStyles.editorial
      )}
    >
      <DealerDesktopHero
        appearance={desktopGuideHeroAppearance}
        controls={
          <div className={desktopStyles.editorialDiscovery}>
            <DesktopContentSearch
              count={visibleItems.length}
              inputRef={desktopSearchInput}
              isBg={isBg}
              onClear={() => {
                updateSearch({ query: "", filter });
                focusSearch();
              }}
              onQueryChange={(value) => updateSearch({ query: value, filter })}
              query={query}
              ready={ready}
            />
            <ContentCategoryPills
              filter={filter}
              locale={locale}
              onSelect={selectFilter}
              ready={ready}
            />
          </div>
        }
        locale={locale}
        title={isBg ? "Съвети и статии" : "Guides and articles"}
        vehicleArtwork={desktopGuideVehicles}
      />
      <section className="bg-brand text-white [--lead-site-accent-bright:white] lg:hidden">
        <div className="mx-auto w-full max-w-lg">
          <MobileDealerChrome
            brandRow={
              <DealerMobileBrandBar
                isBg={isBg}
                leadingAction={
                  <Link
                    aria-label={
                      isBg ? "Съвети и статии" : "Guides and articles"
                    }
                    className={mobileHeaderIconActionClassName}
                    href={localize("/guides")}
                  >
                    <DealerMobileHeaderIcon icon={BookOpenText} kind="guides" />
                  </Link>
                }
                locale={locale}
                trailingAction={
                  <button
                    aria-expanded={filterOpen}
                    aria-haspopup="dialog"
                    aria-label={
                      isBg ? "Филтрирай материалите" : "Filter content"
                    }
                    className={mobileHeaderIconActionClassName}
                    disabled={!ready}
                    onClick={() => setFilterOpen(true)}
                    ref={filterTrigger}
                    type="button"
                  >
                    <DealerMobileHeaderIcon
                      icon={SlidersHorizontal}
                      kind="filters"
                    />
                  </button>
                }
              />
            }
            title={isBg ? "Съвети и статии" : "Guides and articles"}
          >
            <div
              className={cn(
                mobileSearchFieldClassName,
                "bg-white p-1 pl-4 text-zinc-950 ring-white/20 focus-within:outline-2 focus-within:outline-[var(--lead-site-accent-bright)] focus-within:outline-offset-2"
              )}
              data-slot="mobile-guides-search"
            >
              <Search
                aria-hidden="true"
                className={mobileSearchIconClassName}
                strokeWidth={1.75}
              />
              <label className="sr-only" htmlFor="content-search">
                {isBg ? "Търси" : "Search"}
              </label>
              <input
                aria-label={
                  isBg ? "Търси съвети и статии" : "Search guides and articles"
                }
                className="h-full min-w-0 flex-1 bg-transparent font-normal text-body outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                disabled={!ready}
                id="content-search"
                onChange={(event) =>
                  updateSearch({ query: event.target.value, filter })
                }
                placeholder={`${isBg ? "Търси статии" : "Search articles"} (${visibleItems.length})`}
                ref={searchInput}
                type="search"
                value={query}
              />
              <output
                aria-atomic="true"
                aria-label={contentResultsLabels[locale]}
                aria-live="polite"
                className={cn({
                  "shrink-0 px-2 text-meta text-muted-foreground tabular-nums":
                    query,
                  "sr-only": !query,
                })}
                data-slot="content-search-count"
              >
                ({visibleItems.length})
              </output>
              {query ? (
                <button
                  aria-label={isBg ? "Изчисти търсенето" : "Clear search"}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-zinc-100 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-200"
                  disabled={!ready}
                  onClick={() => {
                    updateSearch({ query: "", filter });
                    focusSearch();
                  }}
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              ) : null}
            </div>
          </MobileDealerChrome>
        </div>
      </section>

      <div
        className={cn(
          "mx-auto w-full max-w-lg lg:max-w-[90rem]",
          desktopStyles.editorialBody
        )}
      >
        <div
          className={cn(
            "relative -mt-3 rounded-t-2xl bg-background pt-3 lg:mt-0 lg:rounded-none lg:pt-8",
            desktopStyles.editorialPanel
          )}
        >
          <div className="px-4 lg:px-0">
            <ContentCategoryPills
              filter={filter}
              locale={locale}
              mobile
              onSelect={selectFilter}
              ready={ready}
            />
          </div>

          <div
            className="mt-3 grid gap-3 px-4 pb-8 md:grid-cols-2 lg:mt-5 lg:gap-5 lg:px-0 xl:grid-cols-3"
            data-slot="editorial-content-grid"
          >
            {visibleItems.map((item, index) => (
              <Link
                aria-label={item.title}
                className="group flex min-h-[124px] flex-col overflow-hidden rounded-2xl bg-white focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-2 active:scale-[0.995]"
                data-slot="content-card"
                href={`${localize(`/guides/${item.slug}`)}${serializeContentSearch({ query, filter })}`}
                key={`${item.type}-${item.slug}`}
                prefetch={false}
              >
                <div
                  className="relative aspect-[7/3] w-full min-w-0 shrink-0 overflow-hidden bg-secondary"
                  data-slot="content-card-media"
                >
                  <picture className="absolute inset-0 block">
                    {item.desktopImage && (
                      <source
                        media="(min-width: 1024px)"
                        srcSet={withBasePath(item.desktopImage)}
                      />
                    )}
                    <Image
                      alt=""
                      className={
                        item.mobileImage
                          ? "object-contain object-center p-2.5"
                          : "object-cover object-center"
                      }
                      fill
                      loading={index === 0 ? "eager" : "lazy"}
                      sizes="(max-width: 511px) calc(100vw - 32px), (max-width: 767px) 480px, (max-width: 1023px) 240px, (min-width: 1600px) 260px, (min-width: 1280px) 330px, 30vw"
                      src={item.mobileImage ?? item.image}
                    />
                  </picture>
                </div>
                <div
                  className="flex min-w-0 flex-1 flex-col p-2.5"
                  data-slot="content-card-body"
                >
                  <div
                    className="font-medium text-meta text-muted-foreground"
                    data-slot="content-card-meta"
                  >
                    <span className="whitespace-nowrap">{item.category}</span>
                  </div>
                  <div
                    className="mt-1 flex items-end gap-3 lg:mt-0 lg:block"
                    data-slot="content-card-heading"
                  >
                    <h2
                      aria-label={item.title}
                      className="line-clamp-2 min-w-0 flex-1 font-medium text-card-title tracking-heading lg:font-semibold lg:text-card-title-lg"
                      title={item.title}
                    >
                      {item.desktopTitle ?? item.title}
                    </h2>
                    <ArrowRight
                      aria-hidden="true"
                      className="mb-0.5 size-4 shrink-0 text-muted-foreground lg:hidden"
                    />
                  </div>
                  <p
                    className="mt-1 hidden text-meta text-zinc-600 lg:line-clamp-2"
                    data-slot="content-card-description"
                  >
                    {item.description}
                  </p>
                  <span className="mt-auto hidden items-center gap-1 pt-1.5 font-semibold text-compact-control lg:inline-flex">
                    {isBg ? "Прочети" : "Read"}
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {visibleItems.length === 0 ? (
            <div className="mx-4 mb-8 rounded-2xl bg-white px-5 py-10 text-center lg:mx-0">
              <p className="font-semibold text-card-title tracking-heading">
                {isBg
                  ? "Няма материали с тези критерии"
                  : "No content matches these filters"}
              </p>
              <p className="mt-1 text-meta text-zinc-600">
                {isBg
                  ? "Променете търсенето или филтъра."
                  : "Change the search or filter."}
              </p>
              <button
                className="mt-4 rounded-full bg-zinc-950 px-4 py-2.5 font-semibold text-compact-control text-white focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-2"
                disabled={!ready}
                onClick={() => {
                  updateSearch({ query: "", filter: "all" });
                  focusSearch();
                }}
                type="button"
              >
                {isBg ? "Покажи всички материали" : "Show all articles"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Drawer onOpenChange={setFilterOpen} open={filterOpen}>
        <DrawerContent
          className="mx-auto max-w-lg overflow-hidden rounded-t-2xl border-0 bg-white data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[calc(var(--mobile-visible-height,100dvh)-1rem)]"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            filterTrigger.current?.focus({ preventScroll: true });
          }}
        >
          <DrawerHeader className="shrink-0 px-4 pt-2 pb-3">
            <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
              <span />
              <DrawerTitle className="text-center font-medium text-card-title-lg">
                {isBg ? "Теми" : "Topics"}
              </DrawerTitle>
              <DrawerClose
                aria-label={isBg ? "Затвори" : "Close"}
                className={cn(
                  mobileMarketplaceOverlayIconActionClassName,
                  "grid place-items-center bg-zinc-100"
                )}
              >
                <X aria-hidden="true" className="size-[18px]" />
              </DrawerClose>
            </div>
            <DrawerDescription className="sr-only">
              {isBg ? "Изберете тема" : "Choose a topic"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="grid gap-2">
              {contentFilters.map(({ id: value, ...labels }) => (
                <button
                  aria-pressed={filter === value}
                  className={
                    filter === value
                      ? "flex min-h-12 items-center justify-between rounded-xl bg-zinc-950 px-4 font-semibold text-compact-control text-white"
                      : "flex min-h-12 items-center justify-between rounded-xl bg-zinc-100 px-4 font-semibold text-compact-control text-zinc-950"
                  }
                  key={value}
                  onClick={() => selectFilter(value)}
                  type="button"
                >
                  {labels[locale]}
                  {filter === value ? <span aria-hidden="true">✓</span> : null}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
};
