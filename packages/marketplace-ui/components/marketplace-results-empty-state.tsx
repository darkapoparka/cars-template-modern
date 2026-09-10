import { Button } from "@repo/design-system/components/ui/button";
import {
  buildMarketplaceSearchHref,
  type MarketplaceSearchParams,
} from "@repo/marketplace";
import { Search } from "lucide-react";
import Link from "next/link";

export const MarketplaceResultsEmptyState = ({
  currentPath,
  filters,
  filtered,
  isBg,
  onChooseCategory,
}: {
  currentPath: string;
  filters: MarketplaceSearchParams;
  filtered: boolean;
  isBg: boolean;
  onChooseCategory: () => void;
}) => {
  const title = filtered
    ? isBg
      ? "Няма намерени обяви"
      : "No matching vehicles"
    : isBg
      ? "Все още няма обяви в тази категория"
      : "No vehicles in this category yet";
  const description = filtered
    ? isBg
      ? "Изчистете част от филтрите или изберете друга категория."
      : "Try clearing a few filters or switching the vehicle category."
    : isBg
      ? "Нови обяви се добавят редовно. Разгледайте друга категория."
      : "New listings are added regularly. Browse another category.";

  return (
    <div
      aria-live="polite"
      className="flex min-h-60 flex-col items-center justify-center rounded-xl bg-zinc-50 px-5 py-8 text-center lg:min-h-72 lg:border lg:border-dashed lg:bg-secondary/40 lg:px-6 lg:py-0"
      data-slot="marketplace-empty-state"
    >
      <Search className="mb-3 h-6 w-6 text-muted-foreground" />
      <h2 className="font-semibold text-card-title">{title}</h2>
      <p className="mt-1 max-w-sm text-meta text-muted-foreground">
        {description}
      </p>
      {filtered ? (
        <Button asChild className="mt-4 h-11 rounded-lg lg:h-10">
          <Link
            href={buildMarketplaceSearchHref(
              {
                category: filters.category,
                page: 1,
                sort: "recommended",
              },
              currentPath
            )}
          >
            {isBg ? "Изчисти филтрите" : "Clear filters"}
          </Link>
        </Button>
      ) : (
        <Button
          className="mt-4 h-11 rounded-lg lg:h-10"
          onClick={onChooseCategory}
          type="button"
        >
          {isBg ? "Избери друга категория" : "Choose another category"}
        </Button>
      )}
    </div>
  );
};
