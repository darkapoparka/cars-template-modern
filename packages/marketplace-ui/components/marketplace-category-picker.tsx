"use client";

import {
  buildMarketplaceSearchHref,
  getCategoryPath,
  leadSite,
  type MarketplaceSearchParams,
  withCategory,
} from "@repo/marketplace";
import { useRouter } from "next/navigation";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import { getLocalizedPublicPath } from "../lib/public-path";
import { MarketplaceCategoryOptions } from "./marketplace-category-options";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayCloseAction,
} from "./mobile-marketplace-overlay";

export const MarketplaceCategoryPicker = ({
  filters,
  locale,
  onOpenChange,
  open,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const copy = getMarketplaceControlCopy(locale);
  const router = useRouter();

  return (
    <MobileMarketplaceOverlay
      description={copy.categoryDrawer.description}
      onOpenChange={onOpenChange}
      open={open}
      rightAction={
        <MobileMarketplaceOverlayCloseAction ariaLabel={copy.actions.close} />
      }
      title={copy.categoryDrawer.title}
    >
      <MarketplaceCategoryOptions
        locale={locale}
        onSelect={(category) => {
          const href = buildMarketplaceSearchHref(
            withCategory(filters, category),
            getLocalizedPublicPath(
              locale,
              leadSite.staticDemoMode ? "/" : getCategoryPath(category)
            )
          );
          onOpenChange(false);
          router.push(href);
        }}
        selectedCategory={filters.category}
      />
    </MobileMarketplaceOverlay>
  );
};
