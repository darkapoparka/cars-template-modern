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
  const copy = isBg
    ? {
        filteredTitle: "Няма намерени обяви",
        emptyTitle: "Все още няма обяви в тази категория",
        filteredDescription:
          "Изчистете част от филтрите или изберете друга категория.",
        emptyDescription:
          "Нови обяви се добавят редовно. Разгледайте друга категория.",
      }
    : {
        filteredTitle: "No matching vehicles",
        emptyTitle: "No vehicles in this category yet",
        filteredDescription:
          "Try clearing a few filters or switching the vehicle category.",
        emptyDescription:
          "New listings are added regularly. Browse another category.",
      };
  const title = filtered ? copy.filteredTitle : copy.emptyTitle;
  const description = filtered
    ? copy.filteredDescription
    : copy.emptyDescription;

  return (
    <div
      aria-live="polite"
      className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-zinc-200/60 bg-zinc-50/70 px-5 py-10 text-center lg:min-h-72 lg:border-dashed lg:bg-secondary/40 lg:px-6 lg:py-0"
      data-slot="marketplace-empty-state"
    >
      <span className="mb-4 grid size-12 place-items-center rounded-full border border-zinc-200/70 bg-white shadow-sm">
        <Search aria-hidden="true" className="size-5 text-zinc-500" />
      </span>
      <h2 className="font-semibold text-card-title">{title}</h2>
      <p className="mt-1.5 max-w-sm text-meta text-muted-foreground leading-5">
        {description}
      </p>
      {filtered ? (
        <Button
          asChild
          className="mt-5 h-12 w-full max-w-xs rounded-xl lg:h-10 lg:w-auto"
        >
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
          className="mt-5 h-12 w-full max-w-xs rounded-xl lg:h-10 lg:w-auto"
          onClick={onChooseCategory}
          type="button"
        >
          {isBg ? "Избери друга категория" : "Choose another category"}
        </Button>
      )}
    </div>
  );
};
