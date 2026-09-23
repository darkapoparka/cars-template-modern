import type {
  ListingViewMode,
  MarketplaceSearchParams,
} from "@repo/marketplace";
import { getMarketplaceResultTitle } from "../lib/marketplace-results-toolbar-policy";

/** Visible count and view controls live alongside the desktop buy box. */
export function DealerInventorySummary({
  filters,
  locale,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  totalListings: number;
  viewMode: ListingViewMode;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  onViewModeChange: (mode: ListingViewMode) => void;
}) {
  return (
    <h1 className="sr-only lg:hidden">
      {getMarketplaceResultTitle(filters, locale)}
    </h1>
  );
}
