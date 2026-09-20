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
import {
  DealerMobileBrandBar,
  DealerMobileHeaderIcon,
  getMobileQuickPillClassName,
  MobileDealerChrome,
  MobilePillRail,
  mobileHeaderIconActionClassName,
} from "@repo/marketplace-ui";
import Image from "@repo/marketplace-ui/components/public-image";
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

function DesktopContentSearch({
  isBg,
  ready,
  query,
  inputRef,
  onQueryChange,
  onClear,
}: {
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
    setReady(true);
    const restore = () => {
      const search = parseContentSearch(
        Object.fromEntries(new URLSearchParams(window.location.search))
      );
      setQuery(search.query);
      setFilter(search.filter);
    };
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
      <section className="bg-zinc-950 text-white lg:hidden">
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
          >
            <div className="flex h-12 items-center gap-2.5 rounded-full bg-white px-4 text-zinc-950 ring-1 ring-white/20 ring-inset focus-within:outline-2 focus-within:outline-white">
              <Search
                aria-hidden="true"
                className="size-[18px] shrink-0 text-muted-foreground"
              />
              <label className="sr-only" htmlFor="content-search">
                {isBg ? "Търси" : "Search"}
              </label>
              <input
                aria-label={
                  isBg ? "Търси съвети и статии" : "Search guides and articles"
                }
                className="min-w-0 flex-1 bg-transparent font-medium text-body outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                disabled={!ready}
                id="content-search"
                onChange={(event) =>
                  updateSearch({ query: event.target.value, filter })
                }
                placeholder={
                  isBg ? "Търси съвети и статии" : "Search guides and articles"
                }
                ref={searchInput}
                type="search"
                value={query}
              />
              {query ? (
                <button
                  aria-label={isBg ? "Изчисти търсенето" : "Clear search"}
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100"
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

      <DesktopContentSearch
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

      <div
        className={cn(
          "mx-auto w-full max-w-lg lg:max-w-[90rem]",
          desktopStyles.editorialBody
        )}
      >
        <div className="relative -mt-3 rounded-t-2xl bg-background pt-3 lg:mt-0 lg:rounded-none lg:pt-8">
          <div className="px-4 lg:px-6">
            <MobilePillRail className="gap-2">
              {contentFilters.map(({ id: value, ...labels }) => (
                <button
                  aria-pressed={filter === value}
                  className={getMobileQuickPillClassName(filter === value)}
                  disabled={!ready}
                  key={value}
                  onClick={() => selectFilter(value)}
                  type="button"
                >
                  {labels[locale]}
                </button>
              ))}
            </MobilePillRail>
          </div>

          <div className="px-4 pt-3 pb-2 lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <h1 className="font-semibold text-section-title tracking-heading lg:hidden">
                {isBg ? "Съвети и статии" : "Guides and articles"}
              </h1>
              <output
                aria-atomic="true"
                className="text-micro text-muted-foreground tabular-nums"
              >
                {visibleItems.length} {isBg ? "материала" : "items"}
              </output>
            </div>
          </div>

          <div className="grid gap-2 px-4 pb-8 md:grid-cols-2 lg:gap-5 lg:px-6 xl:grid-cols-3">
            {visibleItems.map((item, index) => (
              <Link
                className="group flex min-h-[124px] overflow-hidden rounded-2xl bg-white focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-2 active:scale-[0.995]"
                data-slot="content-card"
                href={`${localize(`/guides/${item.slug}`)}${serializeContentSearch({ query, filter })}`}
                key={`${item.type}-${item.slug}`}
                prefetch={false}
              >
                <div
                  className="relative w-24 min-w-24 shrink-0 overflow-hidden bg-zinc-200 min-[360px]:w-[35%] min-[360px]:min-w-28"
                  data-slot="content-card-media"
                >
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 359px) 96px, (max-width: 768px) 140px, (max-width: 1023px) 260px, (min-width: 1280px) 30vw, 44vw"
                    src={item.image}
                  />
                </div>
                <div
                  className="flex min-w-0 flex-1 flex-col px-2 py-2.5 min-[360px]:px-3"
                  data-slot="content-card-body"
                >
                  <div
                    className="grid grid-cols-1 items-center gap-0 font-semibold text-micro text-muted-foreground uppercase tracking-label min-[360px]:flex min-[360px]:flex-wrap min-[360px]:gap-x-1.5"
                    data-slot="content-card-meta"
                  >
                    <span className="whitespace-nowrap">{item.category}</span>
                    <span className="whitespace-nowrap">{item.meta}</span>
                  </div>
                  <h2 className="mt-1 line-clamp-3 font-semibold text-card-title tracking-heading lg:line-clamp-2 lg:text-card-title-lg">
                    {item.title}
                  </h2>
                  <p
                    className="mt-1 hidden text-meta text-zinc-600 lg:line-clamp-2 min-[360px]:line-clamp-1"
                    data-slot="content-card-description"
                  >
                    {item.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-1.5 font-semibold text-compact-control">
                    {isBg ? "Прочети" : "Read"}
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {visibleItems.length === 0 ? (
            <div className="mx-4 mb-8 rounded-2xl bg-white px-5 py-10 text-center lg:mx-6">
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
              <DrawerTitle className="text-center text-card-title">
                {isBg ? "Филтрирай материалите" : "Filter content"}
              </DrawerTitle>
              <DrawerClose
                aria-label={isBg ? "Затвори" : "Close"}
                className="grid size-11 place-items-center rounded-full bg-zinc-100 text-zinc-950 focus-visible:outline-2 focus-visible:outline-ring"
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
