"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import type { VehicleCategory } from "@repo/marketplace";
import { Check } from "lucide-react";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import { marketplaceCategorySelectorOptions } from "../lib/marketplace-filter-config";
import { VehicleCategoryArtwork } from "./vehicle-category-artwork";

export const MarketplaceCategoryOptions = ({
  locale,
  onSelect,
  selectedCategory,
}: {
  readonly locale?: string;
  readonly onSelect: (category: VehicleCategory) => void;
  readonly selectedCategory: VehicleCategory;
}) => {
  const copy = getMarketplaceControlCopy(locale);

  return (
    <div className="grid gap-2 p-4" data-slot="marketplace-category-options">
      {marketplaceCategorySelectorOptions.map((category) => {
        const selected = selectedCategory === category.id;

        return (
          <Button
            aria-pressed={selected}
            className={cn(
              "grid h-auto min-h-[84px] w-full grid-cols-[4rem_minmax(0,1fr)_1.5rem] items-center gap-3 whitespace-normal rounded-2xl border px-2.5 py-2 text-left shadow-none max-lg:grid-cols-[5rem_minmax(0,1fr)_1.5rem]",
              selected
                ? "border-zinc-300 bg-zinc-50 text-zinc-950 hover:bg-zinc-100"
                : "border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50"
            )}
            data-slot="marketplace-category-option"
            key={category.id}
            onClick={() => onSelect(category.id)}
            type="button"
            variant="ghost"
          >
            <span className="grid h-[52px] w-16 place-items-center rounded-xl bg-zinc-100 max-lg:h-16 max-lg:w-20">
              <VehicleCategoryArtwork
                category={category.id}
                className="h-9 w-14 max-lg:h-13 max-lg:w-18"
                sizes="(min-width: 1024px) 56px, 72px"
              />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-compact-control">
                {copy.categories[category.id].label}
              </span>
              <span className="mt-0.5 text-meta text-zinc-500 max-lg:line-clamp-2 max-lg:font-normal lg:block">
                {copy.categories[category.id].description}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "grid size-6 place-items-center rounded-full border",
                selected
                  ? "border-[var(--lead-site-accent)] bg-brand text-brand-foreground"
                  : "border-zinc-300 bg-white text-transparent"
              )}
            >
              <Check className="size-3.5" strokeWidth={2.5} />
            </span>
          </Button>
        );
      })}
    </div>
  );
};
