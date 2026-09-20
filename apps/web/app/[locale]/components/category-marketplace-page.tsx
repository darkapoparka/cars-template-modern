import {
  buildMarketplaceSearchHref,
  createMarketplaceSearchParams,
  getVehicleCategory,
  parseMarketplaceSearchParams,
  type VehicleCategory,
} from "@repo/marketplace";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { MarketplaceShell } from "@repo/marketplace-ui";
import { log } from "@repo/observability/log";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { redirect, unstable_rethrow } from "next/navigation";
import { getPublicAppBaseUrl } from "@/lib/public-app-url";
import { getPublicInventorySearchListings } from "@/lib/public-inventory-search";
import {
  getPublicMarketplaceListings,
  getPublicVehicleTaxonomy,
  normalizePublicShowroomFilters,
  PUBLIC_LISTING_PAGE_SIZE,
} from "@/lib/public-marketplace-data";
import { getMarketplacePageRedirect } from "@/lib/public-marketplace-pagination";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { AssistedSearchPanel } from "./assisted-search-panel";
import { Footer } from "./footer";
import { InventoryUnavailable } from "./inventory-states";
import { PublicMarketplaceFrame } from "./public-marketplace-frame";

interface CategoryMarketplacePageProps {
  category: VehicleCategory;
  locale: string;
  make?: string;
  model?: string;
  routePath?: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export const CategoryMarketplacePage = async ({
  category,
  locale,
  make,
  model,
  routePath,
  searchParams,
}: CategoryMarketplacePageProps) => {
  const normalizedLocale = normalizeSeoLocale(locale);
  const categoryPath = routePath ?? getVehicleCategory(category).path;
  requirePublicSitePath(categoryPath);
  const basePath = getLocalizedPath(normalizedLocale, categoryPath);
  const parsed = normalizePublicShowroomFilters(
    parseMarketplaceSearchParams(searchParams)
  );
  const filters = {
    ...parsed,
    category,
    ...(make === undefined ? {} : { make }),
    ...(model === undefined ? {} : { model }),
  };
  if (
    searchParams.location !== undefined ||
    searchParams.radius !== undefined
  ) {
    redirect(buildMarketplaceSearchHref(filters, basePath));
  }
  const hasRouteSearchCriteria =
    createMarketplaceSearchParams({ ...parsed, category: "car" }).size > 0;
  const supportsDiscoveryPresentation =
    isDealershipSite ||
    ((category === "car" || category === "lease") &&
      make === undefined &&
      model === undefined);
  const desktopSearchVariant =
    isDealershipSite ||
    (supportsDiscoveryPresentation && !hasRouteSearchCriteria)
      ? "discovery"
      : "results";

  try {
    const [{ facets, listings, totalListings }, taxonomy] = await Promise.all([
      getPublicMarketplaceListings(filters),
      getPublicVehicleTaxonomy(category),
    ]);
    const pageRedirect = getMarketplacePageRedirect({
      basePath,
      filters,
      pageSize: PUBLIC_LISTING_PAGE_SIZE,
      totalListings,
    });
    if (pageRedirect) {
      redirect(pageRedirect);
    }

    return (
      <>
        <MarketplaceShell
          appBaseUrl={getPublicAppBaseUrl()}
          assistantSlot={
            <AssistedSearchPanel
              basePath={basePath}
              category={category}
              locale={normalizedLocale}
            />
          }
          basePath={basePath}
          defaultViewMode={supportsDiscoveryPresentation ? "grid" : undefined}
          desktopSearchVariant={desktopSearchVariant}
          filters={filters}
          inventoryFacets={facets}
          listings={listings}
          locale={normalizedLocale}
          searchListings={getPublicInventorySearchListings(
            filters.category,
            listings
          )}
          taxonomy={taxonomy}
          totalListings={totalListings}
        />
        <Footer locale={normalizedLocale} />
      </>
    );
  } catch (error) {
    unstable_rethrow(error);
    log.error(`Public category route failed for ${categoryPath}.`, { error });
    return (
      <PublicMarketplaceFrame
        activeMode={category === "lease" ? "lease" : "buy"}
        locale={normalizedLocale}
      >
        <InventoryUnavailable locale={normalizedLocale} />
      </PublicMarketplaceFrame>
    );
  }
};
