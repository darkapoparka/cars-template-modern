"use client";

import type {
  MarketplaceSearchParams,
  VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import type { MarketplaceModelInventoryCount } from "../lib/model-picker-options";
import { DesktopFullFilterDialog } from "./desktop-full-filter-dialog";

/** Standalone selectors reuse the same compact draft panels as Home and inventory. */
export function DesktopMakeModelDialog({
  applyLabel,
  clearSelection,
  derivative,
  filters,
  handleApply,
  initialStep,
  locale,
  make,
  model,
  modelCounts,
  onChange,
  onOpenChange,
  open,
  taxonomy,
}: {
  applyLabel?: string;
  clearSelection: () => void;
  derivative?: string;
  filters: MarketplaceSearchParams;
  handleApply: () => void;
  initialStep: "auto" | "make" | "model";
  locale?: string;
  make?: string;
  model?: string;
  modelCounts?: MarketplaceModelInventoryCount[];
  onChange: (draft: MarketplaceSearchParams) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  taxonomy: VehicleTaxonomyMakeOption[];
}) {
  return (
    <DesktopFullFilterDialog
      applyLabel={applyLabel}
      draft={{ ...filters, derivative, make, model }}
      initialEntry={
        initialStep === "model" || (initialStep === "auto" && make)
          ? "model"
          : "make"
      }
      locale={locale}
      modelCounts={modelCounts}
      onApply={handleApply}
      onChange={onChange}
      onOpenChange={onOpenChange}
      onReset={clearSelection}
      open={open}
      taxonomy={taxonomy}
    />
  );
}
