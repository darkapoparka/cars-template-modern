"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import {
  formatFuelType,
  formatMileage,
  formatMoney,
  getListingPath,
  type VehicleListing,
} from "@repo/marketplace";
import { CarFront, Search, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getMobileInventorySearchGroups,
  type MobileSearchItem,
} from "../lib/inventory-search-suggestions";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import { getLocalizedPublicPath } from "../lib/public-path";
import {
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayHeader,
  MobileMarketplaceOverlayShell,
} from "./mobile-marketplace-overlay";

interface MobileInventorySearchProps {
  readonly isBg: boolean;
  readonly listings: readonly VehicleListing[];
  readonly locale?: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSearch: (query: string) => void;
  readonly onSelectMake: (make: string) => void;
  readonly onSelectModel: (make: string, model: string) => void;
  readonly open: boolean;
  readonly query: string;
}

export const MobileInventorySearch = ({
  isBg,
  listings,
  locale,
  onOpenChange,
  onSearch,
  onSelectMake,
  onSelectModel,
  open,
  query,
}: MobileInventorySearchProps) => {
  const router = useRouter();
  const copy = getMarketplaceControlCopy(locale);
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    if (open) {
      setDraft(query);
    }
  }, [open, query]);

  const groups = useMemo(
    () =>
      getMobileInventorySearchGroups({
        isBg,
        listings,
        locale,
        query: draft,
      }),
    [draft, isBg, listings, locale]
  );

  const commitItem = (item: MobileSearchItem) => {
    if (item.kind === "make") {
      onSelectMake(item.make);
      onOpenChange(false);
      return;
    }

    if (item.kind === "listing") {
      onOpenChange(false);
      router.push(getLocalizedPublicPath(locale, getListingPath(item.listing)));
      return;
    }

    if (item.kind === "model") {
      onSelectModel(item.make, item.model);
      onOpenChange(false);
      return;
    }

    onSearch(item.value);
    onOpenChange(false);
  };

  const commitDraft = () => {
    const nextQuery = draft.trim();
    if (!nextQuery) {
      return;
    }
    onSearch(nextQuery);
    onOpenChange(false);
  };

  return (
    <MobileMarketplaceOverlayShell
      contentDataSlot="mobile-inventory-search"
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        if (event.currentTarget instanceof HTMLElement) {
          event.currentTarget.focus({ preventScroll: true });
        }
      }}
      onOpenChange={onOpenChange}
      open={open}
    >
      <MobileMarketplaceOverlayHeader
        description={
          isBg
            ? "Търси по марка, модел или обява. Клавиатурата се отваря само ако докоснеш полето."
            : "Search by make, model, or listing. The keyboard opens only after you tap the field."
        }
        rightAction={
          <MobileMarketplaceOverlayCloseAction ariaLabel={copy.actions.close} />
        }
        title={isBg ? "Търсене" : "Search"}
      />

      <div
        className="shrink-0 px-3 pb-3"
        data-slot="mobile-inventory-search-header"
      >
        <label className="flex h-[52px] min-w-0 items-center gap-1 rounded-full bg-zinc-100 p-1 pl-3">
          <Search
            aria-hidden="true"
            className="size-[18px] shrink-0 text-zinc-600"
            strokeWidth={2}
          />
          <input
            aria-label={copy.search.ariaLabel}
            autoComplete="off"
            autoFocus={false}
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-[16px] text-zinc-950 outline-none placeholder:text-zinc-600"
            enterKeyHint="search"
            inputMode="search"
            name="q"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitDraft();
              }
            }}
            placeholder={isBg ? "Търси марка, модел…" : "Search make or model…"}
            spellCheck={false}
            type="search"
            value={draft}
          />
          {draft.trim() ? (
            <Button
              aria-label={copy.actions.clear}
              className="size-11 shrink-0 rounded-full bg-zinc-200 p-0 text-zinc-950 shadow-none hover:bg-zinc-300 active:bg-zinc-300"
              onClick={() => setDraft("")}
              size="icon"
              title={copy.actions.clear}
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
        </label>
      </div>

      <div
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        data-slot="mobile-inventory-search-scroll-body"
      >
        {groups.length === 0 ? (
          <p className="px-3 py-8 text-center text-[15px] text-zinc-500">
            {isBg ? "Няма съвпадения в наличността." : "No matching vehicles."}
          </p>
        ) : (
          groups.map((group) => (
            <section
              className={cn(
                "not-last:mb-5",
                group.presentation === "chips" && "pt-2"
              )}
              key={group.heading}
            >
              <h3 className="sr-only">{group.heading}</h3>
              {group.presentation === "chips" ? (
                <ul className="no-scrollbar flex gap-2 overflow-x-auto px-1 pb-1">
                  {group.items.map((item) => (
                    <li className="shrink-0" key={item.id}>
                      <Button
                        className="h-11 rounded-full bg-zinc-100 px-3.5 font-medium text-[14px] text-zinc-950 shadow-none hover:bg-zinc-200"
                        onClick={() => commitItem(item)}
                        type="button"
                        variant="secondary"
                      >
                        {item.label}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="grid gap-2">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <SearchResultButton
                        isBg={isBg}
                        item={item}
                        locale={locale}
                        onSelect={() => commitItem(item)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))
        )}
      </div>
    </MobileMarketplaceOverlayShell>
  );
};

const SearchResultButton = ({
  isBg,
  item,
  locale,
  onSelect,
}: {
  readonly isBg: boolean;
  readonly item: MobileSearchItem;
  readonly locale?: string;
  readonly onSelect: () => void;
}) => {
  const listing = item.kind === "listing" ? item.listing : undefined;
  const listingImage = listing?.images[0];

  return (
    <Button
      className={cn(
        "h-auto w-full text-left font-normal shadow-none",
        listing
          ? "grid min-h-[72px] grid-cols-[88px_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-zinc-100 px-2 py-2 hover:bg-zinc-200"
          : "flex min-h-12 justify-start gap-2 rounded-xl bg-zinc-100 px-3 py-2.5 hover:bg-zinc-200"
      )}
      onClick={onSelect}
      type="button"
      variant="ghost"
    >
      {listing ? (
        <>
          {listingImage ? (
            <Image
              alt={listingImage.alt}
              className="h-14 w-[88px] shrink-0 rounded-lg object-cover"
              height={112}
              sizes="88px"
              src={listingImage.url}
              width={176}
            />
          ) : (
            <span className="grid h-14 w-[88px] shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-500">
              <CarFront aria-hidden="true" className="size-5" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[15px] text-zinc-950">
              {item.label}
            </span>
            <span className="mt-1 flex min-w-0 items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-600">
                {`${listing.spec.year} · ${formatMileage(listing.spec.mileageValue, locale)} · ${formatFuelType(listing.spec.fuelType, locale)}`}
              </span>
              <span className="shrink-0 whitespace-nowrap font-semibold text-[14px] text-zinc-950 tabular-nums">
                {formatMoney(listing.price, isBg ? "bg" : "en")}
              </span>
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600">
            <Search aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] text-zinc-950">
            {item.label}
          </span>
        </>
      )}
    </Button>
  );
};
