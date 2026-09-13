"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import {
  DealerMobileBrandBar,
  DealerMobileHeaderIcon,
  getMobileQuickPillClassName,
  MobileDealerChrome,
  MobilePillRail,
  mobileHeaderIconActionClassName,
} from "@repo/marketplace-ui";
import { getLocalizedPath } from "@repo/seo/metadata";
import {
  ArrowRight,
  BookOpenText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type ContentFilter,
  type ContentSearch,
  contentFilters,
  filterPublicContent,
  type PublicContentCard,
  parseContentSearch,
  serializeContentSearch,
} from "../../../lib/public-content";

interface MobileContentHubProps {
  initialSearch: ContentSearch;
  items: readonly PublicContentCard[];
  locale: "bg" | "en";
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
    <main className="min-h-[100dvh] bg-background pb-4 text-zinc-950">
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
                    searchInput.current?.focus({ preventScroll: true });
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

      <div className="mx-auto w-full max-w-lg lg:max-w-[90rem]">
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
              <h1 className="font-semibold text-[19px] tracking-tight lg:text-2xl">
                {isBg ? "Съвети и статии" : "Guides and articles"}
              </h1>
              <output
                aria-atomic="true"
                className="text-[12px] text-muted-foreground tabular-nums"
              >
                {visibleItems.length} {isBg ? "материала" : "items"}
              </output>
            </div>
          </div>

          <div className="grid gap-2 px-4 pb-8 md:grid-cols-2 lg:gap-3 lg:px-6">
            {visibleItems.map((item, index) => (
              <Link
                className="group flex min-h-[124px] overflow-hidden rounded-2xl bg-white focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-2 active:scale-[0.995]"
                href={`${localize(`/guides/${item.slug}`)}${serializeContentSearch({ query, filter })}`}
                key={`${item.type}-${item.slug}`}
                prefetch={false}
              >
                <div className="relative w-[35%] min-w-[112px] shrink-0 overflow-hidden bg-zinc-200">
                  <Image
                    alt=""
                    className="object-cover"
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 768px) 140px, 260px"
                    src={item.image}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col px-3 py-2.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.09em]">
                    <span className="truncate">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">{item.meta}</span>
                  </div>
                  <h2 className="mt-1 line-clamp-3 font-semibold text-[16px] leading-5 tracking-tight lg:line-clamp-2">
                    {item.title}
                  </h2>
                  <p className="mt-1 line-clamp-1 text-[12.5px] text-zinc-600 leading-[17px] lg:line-clamp-2">
                    {item.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-1.5 font-semibold text-[12px]">
                    {isBg ? "Прочети" : "Read"}
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {visibleItems.length === 0 ? (
            <div className="mx-4 mb-8 rounded-2xl bg-white px-5 py-10 text-center lg:mx-6">
              <p className="font-semibold text-[17px]">
                {isBg
                  ? "Няма материали с тези критерии"
                  : "No content matches these filters"}
              </p>
              <p className="mt-1 text-[13px] text-zinc-600">
                {isBg
                  ? "Променете търсенето или филтъра."
                  : "Change the search or filter."}
              </p>
              <button
                className="mt-4 rounded-full bg-zinc-950 px-4 py-2.5 font-semibold text-sm text-white focus-visible:outline-2 focus-visible:outline-zinc-950 focus-visible:outline-offset-2"
                disabled={!ready}
                onClick={() => {
                  updateSearch({ query: "", filter: "all" });
                  searchInput.current?.focus({ preventScroll: true });
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
              <DrawerTitle className="text-center text-[17px]">
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
                      ? "flex min-h-12 items-center justify-between rounded-xl bg-zinc-950 px-4 font-semibold text-[15px] text-white"
                      : "flex min-h-12 items-center justify-between rounded-xl bg-zinc-100 px-4 font-semibold text-[15px] text-zinc-950"
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
