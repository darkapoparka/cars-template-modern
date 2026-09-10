import { cn } from "@repo/design-system/lib/utils";
import {
  buildMarketplaceSearchHref,
  type MarketplaceSearchParams,
} from "@repo/marketplace";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const DEFAULT_PAGE_SIZE = 24;

interface MarketplacePaginationProps {
  basePath?: string;
  filters: MarketplaceSearchParams;
  locale?: string;
  pageSize?: number;
  totalListings: number;
}

const getPaginationCopy = (locale?: string) => {
  const isBg = locale?.trim().toLowerCase().startsWith("bg") ?? false;

  return isBg
    ? {
        nav: "Страници с резултати от обяви",
        next: "Напред",
        nextLabel: "Следваща страница с резултати",
        pageLabel: (page: number) => `Страница ${page} с резултати`,
        previous: "Назад",
        previousLabel: "Предишна страница с резултати",
      }
    : {
        nav: "Marketplace result pages",
        next: "Next",
        nextLabel: "Next results page",
        pageLabel: (page: number) => `Results page ${page}`,
        previous: "Previous",
        previousLabel: "Previous results page",
      };
};

const getVisiblePages = (currentPage: number, totalPages: number) => {
  const visibleCount = Math.min(5, totalPages);
  const firstPage = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - visibleCount + 1)
  );

  return Array.from({ length: visibleCount }, (_, index) => firstPage + index);
};

export const MarketplacePagination = ({
  basePath,
  filters,
  locale,
  pageSize = DEFAULT_PAGE_SIZE,
  totalListings,
}: MarketplacePaginationProps) => {
  const totalPages = Math.ceil(totalListings / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  const currentPage = Math.min(Math.max(filters.page, 1), totalPages);
  const copy = getPaginationCopy(locale);
  const pages = getVisiblePages(currentPage, totalPages);
  const getHref = (page: number) =>
    buildMarketplaceSearchHref({ ...filters, page }, basePath);
  const pageLinkClassName =
    "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card px-3 font-medium text-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:h-10 lg:min-w-10";

  return (
    <nav
      aria-label={copy.nav}
      className="mt-5 flex flex-wrap items-center justify-center gap-2 pb-2"
    >
      {currentPage > 1 && (
        <Link
          aria-label={copy.previousLabel}
          className={pageLinkClassName}
          href={getHref(currentPage - 1)}
          rel="prev"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-1">
            {copy.previous}
          </span>
        </Link>
      )}

      {pages.map((page) => (
        <Link
          aria-current={page === currentPage ? "page" : undefined}
          aria-label={copy.pageLabel(page)}
          className={cn(
            pageLinkClassName,
            page === currentPage &&
              "border-foreground bg-foreground text-background hover:bg-foreground/90"
          )}
          href={getHref(page)}
          key={page}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          aria-label={copy.nextLabel}
          className={pageLinkClassName}
          href={getHref(currentPage + 1)}
          rel="next"
        >
          <span className="sr-only sm:not-sr-only sm:mr-1">{copy.next}</span>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
};
