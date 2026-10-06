"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  defaultVehicleCategory,
  type MarketplaceSearchParams,
  type VehicleCategory,
  type VehicleTaxonomyMakeOption,
  withCategory,
} from "@repo/marketplace";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDesktopMarketplaceViewport } from "../hooks/use-desktop-marketplace-viewport";
import { canUseDesktopFilterModelCounts } from "../lib/desktop-full-filter-policy";
import {
  getMarketplaceControlCopy,
  isBulgarianMarketplaceLocale,
} from "../lib/marketplace-control-copy";
import { marketplaceSearchCurrency } from "../lib/marketplace-filter-config";
import type { MarketplaceModelInventoryCount } from "../lib/model-picker-options";
import {
  DesktopFullFilterDialog,
  type DesktopFullFilterEntry,
} from "./desktop-full-filter-dialog";
import {
  DiscoveryFilterBody,
  type DiscoveryFilterView,
  getDiscoveryOverlayTitle,
  guidedMoreFilterOptionIds,
} from "./marketplace-discovery-filter-body";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayBackAction,
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayIconAction,
  mobileMarketplaceOverlayPrimaryActionClassName,
} from "./mobile-marketplace-overlay";

export const MarketplaceFullFilterOverlay = ({
  applyLabel,
  filters,
  initialDesktopEntry = "vehicle",
  locale,
  modelCounts,
  onApply,
  onDesktopApply,
  onOpenChange,
  open,
  taxonomy,
  taxonomyByCategory,
}: {
  applyLabel?: string;
  filters: MarketplaceSearchParams;
  initialDesktopEntry?: DesktopFullFilterEntry;
  locale?: string;
  modelCounts?: MarketplaceModelInventoryCount[];
  onApply: (filters: Partial<MarketplaceSearchParams>) => void;
  onDesktopApply?: (filters: Partial<MarketplaceSearchParams>) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  taxonomy: VehicleTaxonomyMakeOption[];
  taxonomyByCategory?: Partial<
    Record<VehicleCategory, VehicleTaxonomyMakeOption[]>
  >;
}) => {
  const isDesktop = useDesktopMarketplaceViewport();
  const applyFilters = isDesktop ? (onDesktopApply ?? onApply) : onApply;
  const triggerRef = useRef<HTMLElement | null>(null);
  const [view, setView] = useState<DiscoveryFilterView>("main");
  const [draft, setDraft] = useState(filters);
  const isBg = isBulgarianMarketplaceLocale(locale);
  const copy = getMarketplaceControlCopy(locale);

  useEffect(() => {
    if (open) {
      setDraft(filters);
      setView("main");
    }
  }, [filters, open]);

  const setNormalizedDraft = (nextDraft: MarketplaceSearchParams) => {
    setDraft((currentDraft) =>
      nextDraft.category !== currentDraft.category
        ? withCategory(nextDraft, nextDraft.category)
        : nextDraft
    );
  };

  const applyAndClose = () => {
    applyFilters(draft);
    onOpenChange(false);
  };

  const resetDraft = () =>
    setDraft({
      ...filters,
      body: undefined,
      category: defaultVehicleCategory,
      deliverTo: undefined,
      derivative: undefined,
      fuel: undefined,
      location: undefined,
      make: undefined,
      mileageMax: undefined,
      model: undefined,
      origin: undefined,
      priceMax: undefined,
      priceMin: undefined,
      q: undefined,
      seller: undefined,
      trim: undefined,
      transmission: undefined,
      yearMax: undefined,
      yearMin: undefined,
    });

  const overlayTitle = getDiscoveryOverlayTitle(view, draft, locale, isBg);
  const goToPreviousView = () => {
    if (view === "model") {
      setView("make");
      return;
    }
    if (
      !isDesktop &&
      guidedMoreFilterOptionIds.some((filterView) => filterView === view)
    ) {
      setView("more");
      return;
    }
    setView("main");
  };

  const filterContent = (
    <DiscoveryFilterBody
      draft={draft}
      isBg={isBg}
      isDesktop={isDesktop}
      locale={locale}
      setDraft={setNormalizedDraft}
      setView={setView}
      taxonomy={taxonomy}
      view={view}
    />
  );
  const filterBody = filterContent;

  if (isDesktop) {
    return open ? (
      <DesktopFullFilterDialog
        applyLabel={applyLabel}
        draft={draft}
        initialEntry={initialDesktopEntry}
        locale={locale}
        modelCounts={
          canUseDesktopFilterModelCounts(filters, draft)
            ? modelCounts
            : undefined
        }
        onApply={applyAndClose}
        onChange={(nextDraft) =>
          setNormalizedDraft({
            ...nextDraft,
            currency:
              nextDraft.priceMin !== undefined ||
              nextDraft.priceMax !== undefined
                ? (nextDraft.currency ?? marketplaceSearchCurrency)
                : undefined,
          })
        }
        onOpenChange={onOpenChange}
        onReset={() => {
          resetDraft();
          setDraft((current) => ({ ...current, currency: undefined }));
        }}
        open={open}
        taxonomy={taxonomyByCategory?.[draft.category] ?? taxonomy}
      />
    ) : null;
  }

  return (
    <MobileMarketplaceOverlay
      bodyClassName={view === "main" ? "bg-zinc-50" : "bg-white"}
      description={copy.fullFilterDescription}
      footer={
        <Button
          className={mobileMarketplaceOverlayPrimaryActionClassName}
          onClick={applyAndClose}
        >
          {copy.actions.showResults}
        </Button>
      }
      leftAction={
        view !== "main" ? (
          <MobileMarketplaceOverlayBackAction
            ariaLabel={copy.actions.back}
            onClick={goToPreviousView}
          />
        ) : (
          <MobileMarketplaceOverlayIconAction
            ariaLabel={copy.actions.reset}
            onClick={resetDraft}
          >
            <RotateCcw aria-hidden="true" className="size-[18px]" />
          </MobileMarketplaceOverlayIconAction>
        )
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
      onOpenChange={onOpenChange}
      open={open}
      rightAction={
        <MobileMarketplaceOverlayCloseAction ariaLabel={copy.actions.close} />
      }
      title={overlayTitle}
    >
      {filterBody}
    </MobileMarketplaceOverlay>
  );
};
