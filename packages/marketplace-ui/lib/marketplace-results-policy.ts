import { cn } from "@repo/design-system/lib/utils";
import { type ListingViewMode, leadSite } from "@repo/marketplace";
import {
  marketplaceContentFrameClassName,
  marketplaceDiscoveryFrameClassName,
} from "./marketplace-layout";

export const getMarketplaceResultsSectionClassName = (
  variant: "discovery" | "results"
) =>
  cn(
    variant === "discovery"
      ? marketplaceDiscoveryFrameClassName
      : marketplaceContentFrameClassName,
    "px-4 pt-0 pb-3",
    variant !== "discovery" && "lg:pt-2",
    variant === "discovery" && (leadSite.staticDemoMode ? "lg:pt-0" : "lg:pt-8")
  );

export const shouldHideDesktopResultSummary = (
  variant: "discovery" | "results"
) => leadSite.staticDemoMode && variant === "discovery";

export const getMarketplaceListingGridClassName = ({
  listingCount,
  useDiscoveryInventoryGrid,
  useWideInventoryGrid,
  viewMode,
}: {
  listingCount: number;
  useDiscoveryInventoryGrid: boolean;
  useWideInventoryGrid: boolean;
  viewMode: ListingViewMode;
}) => {
  if (viewMode !== "grid") {
    return "grid-cols-1";
  }

  if (useDiscoveryInventoryGrid && listingCount > 0 && listingCount <= 2) {
    return cn(
      "w-full grid-cols-1",
      listingCount === 1 ? "max-w-[32rem]" : "max-w-[64rem] sm:grid-cols-2"
    );
  }

  return cn(
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    useDiscoveryInventoryGrid
      ? "xl:grid-cols-4 min-[112rem]:grid-cols-5"
      : useWideInventoryGrid && "min-[85rem]:grid-cols-4"
  );
};
