"use client";

import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayCloseAction,
} from "@repo/marketplace-ui";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import {
  mobileMarketplaceOverlayFieldClassName,
  mobileMarketplaceOverlayFieldRowClassName,
  mobileMarketplaceOverlayInputClassName,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import { VehicleCategoryArtwork } from "@repo/marketplace-ui/components/vehicle-category-artwork";
import { useRef, useState } from "react";
import {
  type FinancingVehicleOption,
  leaseSelectorCopy,
} from "./lease-finance-policy";
import { LeaseSelectedVehicle } from "./lease-selected-vehicle";

const searchWhitespace = /\s+/u;

export function LeaseCarSelector({
  locale,
  vehicles,
  selectedVehicle,
  onSelect,
}: {
  locale: "bg" | "en";
  vehicles: FinancingVehicleOption[];
  selectedVehicle?: FinancingVehicleOption;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const didSelect = useRef(false);
  const copy = leaseSelectorCopy[locale];
  const terms = query.trim().toLocaleLowerCase(locale).split(searchWhitespace);
  const matches = vehicles.filter((vehicle) =>
    terms.every((term) =>
      vehicle.title.toLocaleLowerCase(locale).includes(term)
    )
  );
  return (
    <>
      <button
        aria-haspopup="dialog"
        className="flex h-[52px] w-full items-center justify-between gap-3 rounded-full bg-white px-4 text-left text-zinc-950 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 active:bg-zinc-200"
        data-slot="lease-mobile-vehicle-trigger"
        id="finance-vehicle"
        onClick={() => {
          setQuery("");
          didSelect.current = false;
          setOpen(true);
        }}
        ref={triggerRef}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-3">
          <VehicleCategoryArtwork
            category="lease"
            className="h-5 w-7"
            sizes="28px"
          />
          <span className="font-normal text-[16px] text-zinc-600 leading-5">
            {selectedVehicle ? copy.changeVehicle : copy.vehicleLabel}
          </span>
        </span>
        <DealerUiIcon className="size-5 shrink-0" name="chevronRight" />
      </button>
      <MobileMarketplaceOverlay
        bodyClassName="bg-zinc-50"
        contentDataSlot="lease-car-selector"
        description={copy.searchPlaceholder}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (didSelect.current) {
            document
              .querySelector<HTMLElement>('[data-slot="lease-finance-action"]')
              ?.focus({ preventScroll: true });
          } else {
            triggerRef.current?.focus({ preventScroll: true });
          }
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document
            .querySelector<HTMLElement>('[data-slot="lease-car-selector"]')
            ?.focus({ preventScroll: true });
        }}
        onOpenChange={setOpen}
        open={open}
        rightAction={
          <MobileMarketplaceOverlayCloseAction
            ariaLabel={
              locale === "bg" ? "Затвори избора" : "Close vehicle selection"
            }
          />
        }
        title={copy.searchTitle}
      >
        <div
          className={`sticky top-0 z-10 ${mobileMarketplaceOverlayFieldRowClassName}`}
        >
          <label className={mobileMarketplaceOverlayFieldClassName}>
            <DealerUiIcon
              className="size-[18px] shrink-0 text-zinc-600"
              name="search"
            />
            <input
              aria-label={copy.searchPlaceholder}
              className={mobileMarketplaceOverlayInputClassName}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              type="search"
              value={query}
            />
          </label>
        </div>
        <div className="grid gap-2 p-4">
          {matches.length ? (
            matches.map((vehicle) => (
              <LeaseSelectedVehicle
                key={vehicle.id}
                locale={locale}
                onSelect={() => {
                  didSelect.current = true;
                  onSelect(vehicle.id);
                  setOpen(false);
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
                selected={selectedVehicle?.id === vehicle.id}
                vehicle={vehicle}
              />
            ))
          ) : (
            <output className="py-8 text-center text-sm text-zinc-600">
              {locale === "bg"
                ? "Няма намерени автомобили. Опитайте друга марка или модел."
                : "No vehicles found. Try another make or model."}
            </output>
          )}
        </div>
      </MobileMarketplaceOverlay>
    </>
  );
}
