"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import {
  defaultVehicleCategory,
  type MarketplaceSearchParams,
  type VehicleTaxonomyMakeOption,
  withCategory,
} from "@repo/marketplace";
import { ChevronLeft, Eraser, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDesktopMarketplaceViewport } from "../hooks/use-desktop-marketplace-viewport";
import {
  getMarketplaceControlCopy,
  isBulgarianMarketplaceLocale,
} from "../lib/marketplace-control-copy";
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
  filters,
  locale,
  onApply,
  onOpenChange,
  open,
  taxonomy,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  onApply: (filters: Partial<MarketplaceSearchParams>) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  taxonomy: VehicleTaxonomyMakeOption[];
}) => {
  const isDesktop = useDesktopMarketplaceViewport();
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
    onApply(draft);
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
  const filterBody = isDesktop ? (
    <ScrollArea className="min-h-0 flex-1">{filterContent}</ScrollArea>
  ) : (
    filterContent
  );

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent
          className="flex h-[min(46rem,calc(100dvh-2rem))] w-[calc(100%-2rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-2xl"
          data-slot="desktop-full-filter-dialog"
          showCloseButton={false}
        >
          <DialogHeader className="p-0 text-left">
            <div className="grid min-h-16 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3 px-4 py-3">
              <Button
                aria-label={
                  view === "main" ? copy.actions.reset : copy.actions.back
                }
                className="size-10 rounded-full p-0 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                data-slot={
                  view === "main"
                    ? "desktop-full-filter-reset"
                    : "desktop-full-filter-back"
                }
                onClick={() =>
                  view === "main" ? resetDraft() : goToPreviousView()
                }
                size="icon"
                title={view === "main" ? copy.actions.reset : copy.actions.back}
                variant="ghost"
              >
                {view === "main" ? (
                  <Eraser aria-hidden="true" className="size-[18px]" />
                ) : (
                  <ChevronLeft aria-hidden="true" className="size-5" />
                )}
              </Button>
              <DialogTitle className="text-center text-lg capitalize leading-7">
                {overlayTitle}
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  aria-label={copy.actions.close}
                  className="size-10 rounded-full p-0 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  data-slot="desktop-full-filter-close"
                  size="icon"
                  title={copy.actions.close}
                  variant="ghost"
                >
                  <X aria-hidden="true" className="size-[18px]" />
                </Button>
              </DialogClose>
            </div>
            <DialogDescription className="sr-only">
              {copy.fullFilterDescription}
            </DialogDescription>
          </DialogHeader>
          {filterBody}
          <DialogFooter className="mt-auto block bg-card p-4">
            <Button
              className="h-12 w-full rounded-xl bg-[var(--lead-site-accent)] text-white hover:bg-[var(--lead-site-accent-hover)]"
              onClick={applyAndClose}
            >
              {copy.actions.showResults}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
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
            <Eraser aria-hidden="true" className="size-[18px]" />
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
