"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import type {
  MarketplaceSearchParams,
  QuickFilterKey,
} from "@repo/marketplace";
import { Eraser } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getLocalizedMarketplaceCityName,
  getMarketplaceControlCopy,
} from "../lib/marketplace-control-copy";
import { marketplaceCityOptions } from "../lib/marketplace-filter-config";
import { isMarketplaceQuickFilterActive } from "../lib/marketplace-filter-policy";
import { getQuickFilterClearUpdates } from "../lib/quick-filter-state";
import {
  MarketplaceCountryOptionGrid,
  MarketplaceFilterSubview,
  MarketplaceOptionGrid,
} from "./marketplace-filter-options";
import {
  marketplaceOptionButtonClassName,
  marketplaceSelectedOptionButtonClassName,
} from "./marketplace-model-picker-options";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayIconAction,
  mobileMarketplaceOverlayPrimaryActionClassName,
} from "./mobile-marketplace-overlay";

export const MarketplaceQuickFilterDrawer = ({
  activeFilter,
  filters,
  locale,
  onApply,
  onClose,
}: {
  activeFilter: QuickFilterKey | null;
  filters: MarketplaceSearchParams;
  locale?: string;
  onApply: (filters: Partial<MarketplaceSearchParams>) => void;
  onClose: () => void;
}) => {
  const [draft, setDraft] = useState(filters);
  const triggerRef = useRef<HTMLElement | null>(null);
  const copy = getMarketplaceControlCopy(locale);
  const clearUpdates = activeFilter
    ? getQuickFilterClearUpdates(activeFilter)
    : undefined;
  const showClearAction = Boolean(
    activeFilter &&
      clearUpdates &&
      isMarketplaceQuickFilterActive(activeFilter, filters)
  );
  const quickFilterTitle = activeFilter
    ? copy.chips[activeFilter]
    : copy.filters.main;

  useEffect(() => {
    if (activeFilter) {
      setDraft(filters);
    }
  }, [activeFilter, filters]);

  const apply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <MobileMarketplaceOverlay
      bodyClassName="flex-initial"
      description={copy.quickFilterDescription}
      footer={
        <Button
          className={mobileMarketplaceOverlayPrimaryActionClassName}
          onClick={apply}
        >
          {copy.actions.apply}
        </Button>
      }
      leftAction={
        showClearAction ? (
          <MobileMarketplaceOverlayIconAction
            ariaLabel={copy.actions.clear}
            disabled={
              !(
                activeFilter &&
                isMarketplaceQuickFilterActive(activeFilter, draft)
              )
            }
            onClick={() => {
              if (clearUpdates) {
                setDraft({ ...draft, ...clearUpdates });
              }
            }}
          >
            <Eraser aria-hidden="true" className="size-[18px]" />
          </MobileMarketplaceOverlayIconAction>
        ) : undefined
      }
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        triggerRef.current?.focus({ preventScroll: true });
      }}
      onOpenAutoFocus={() => {
        triggerRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={Boolean(activeFilter)}
      presentation="sheet"
      rightAction={
        <MobileMarketplaceOverlayCloseAction ariaLabel={copy.actions.close} />
      }
      title={quickFilterTitle}
    >
      <div>
        {activeFilter === "deliver-to" ? (
          <MarketplaceCountryOptionGrid
            locale={locale}
            onSelect={(deliverTo) => setDraft({ ...draft, deliverTo })}
            selected={draft.deliverTo}
          />
        ) : null}
        {activeFilter === "origin" ? (
          <MarketplaceCountryOptionGrid
            locale={locale}
            onSelect={(origin) => setDraft({ ...draft, origin })}
            selected={draft.origin}
          />
        ) : null}
        {activeFilter === "location" ? (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-2">
              {marketplaceCityOptions.map((city) => (
                <Button
                  aria-pressed={draft.location === city}
                  className={cn(
                    "h-auto min-h-12 rounded-xl",
                    draft.location === city
                      ? marketplaceSelectedOptionButtonClassName
                      : marketplaceOptionButtonClassName
                  )}
                  key={city}
                  onClick={() => setDraft({ ...draft, location: city })}
                  variant={draft.location === city ? "default" : "secondary"}
                >
                  {getLocalizedMarketplaceCityName(city, locale)}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        {activeFilter === "price" ||
        activeFilter === "year" ||
        activeFilter === "mileage" ||
        activeFilter === "fuel" ||
        activeFilter === "transmission" ? (
          <MarketplaceFilterSubview
            draft={draft}
            locale={locale}
            setDraft={setDraft}
            view={activeFilter}
          />
        ) : null}
        {activeFilter === "sort" ? (
          <MarketplaceOptionGrid
            onSelect={(sort) =>
              setDraft({
                ...draft,
                sort: sort as MarketplaceSearchParams["sort"],
              })
            }
            options={[
              ["recommended", copy.sort.recommended],
              ["newest", copy.sort.newest],
              ["price_asc", copy.sort.price_asc],
              ["price_desc", copy.sort.price_desc],
              ["mileage_asc", copy.sort.mileage_asc],
              ["year_desc", copy.sort.year_desc],
            ]}
            selected={draft.sort}
          />
        ) : null}
      </div>
    </MobileMarketplaceOverlay>
  );
};
