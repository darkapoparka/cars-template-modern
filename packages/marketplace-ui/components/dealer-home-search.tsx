"use client";

import {
  type MarketplaceSearchParams,
  parseMarketplaceSearchParams,
  type VehicleTaxonomyMakeOption,
  withCategory,
} from "@repo/marketplace";
import { useState } from "react";
import { useMarketplaceOverlayCoordinator } from "../hooks/use-marketplace-overlay-coordinator";
import { marketplaceSearchCurrency } from "../lib/marketplace-filter-config";
import { DealerInventorySearch } from "./dealer-inventory-search";
import {
  DesktopFullFilterDialog,
  type DesktopFullFilterEntry,
} from "./desktop-full-filter-dialog";

const homeRefinements = ["price", "year", "mileage"] as const;

/** Home uses the shared controls while retaining its draft until Search. */
export function DealerHomeSearch({
  disabled,
  filterCount,
  filters,
  locale,
  onApply,
  onSearch,
  taxonomy,
  taxonomyByCategory,
}: {
  disabled: boolean;
  filterCount: number;
  filters: MarketplaceSearchParams;
  locale?: string;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  onSearch: () => void;
  taxonomy: VehicleTaxonomyMakeOption[];
  taxonomyByCategory?: Partial<
    Record<MarketplaceSearchParams["category"], VehicleTaxonomyMakeOption[]>
  >;
}) {
  const [dialog, setDialog] = useState<{
    entry: DesktopFullFilterEntry;
    draft: MarketplaceSearchParams;
  } | null>(null);
  const openOverlay = useMarketplaceOverlayCoordinator(dialog !== null);
  const openSection = (entry: DesktopFullFilterEntry) =>
    openOverlay(() => setDialog({ entry, draft: filters }));
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;

  return (
    <>
      <DealerInventorySearch
        context="home"
        disabled={disabled}
        filterCount={filterCount}
        filters={filters}
        locale={locale}
        onApply={onApply}
        onOpenFilters={() => openSection("vehicle")}
        onOpenSection={openSection}
        onSearch={onSearch}
        refinementSections={homeRefinements}
      />
      {dialog ? (
        <DesktopFullFilterDialog
          applyLabel={isBg ? "Приложи" : "Apply"}
          draft={dialog.draft}
          initialEntry={dialog.entry}
          locale={locale}
          onApply={() => {
            onApply(dialog.draft);
            setDialog(null);
          }}
          onChange={(nextDraft) =>
            setDialog((current) => {
              if (!current) {
                return current;
              }
              const draft = {
                ...nextDraft,
                currency:
                  nextDraft.priceMin !== undefined ||
                  nextDraft.priceMax !== undefined
                    ? (nextDraft.currency ?? marketplaceSearchCurrency)
                    : undefined,
              };
              return {
                ...current,
                draft:
                  draft.category !== current.draft.category
                    ? withCategory(draft, draft.category)
                    : draft,
              };
            })
          }
          onOpenChange={(open) => {
            if (!open) {
              setDialog(null);
            }
          }}
          onReset={() =>
            setDialog({
              ...dialog,
              draft: withCategory(
                parseMarketplaceSearchParams({}),
                dialog.draft.category
              ),
            })
          }
          open
          taxonomy={taxonomyByCategory?.[dialog.draft.category] ?? taxonomy}
        />
      ) : null}
    </>
  );
}
