import {
  buildMarketplaceSearchHref,
  createMarketplaceSearchParams,
  leadSite,
  parseMarketplaceSearchParams,
} from "@repo/marketplace";
import { getLeadCopy } from "@repo/marketplace/lead-copy";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { MarketplaceShell } from "@repo/marketplace-ui";
import { DealerDesktopDiscoveryContent } from "@repo/marketplace-ui/components/dealer-desktop-discovery-content";
import { log } from "@repo/observability/log";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { getPublicAppBaseUrl } from "@/lib/public-app-url";
import { getPublicInventorySearchListings } from "@/lib/public-inventory-search";
import {
  getPublicMarketplaceListings,
  getPublicVehicleTaxonomy,
  normalizePublicShowroomFilters,
  PUBLIC_LISTING_PAGE_SIZE,
} from "@/lib/public-marketplace-data";
import { getMarketplacePageRedirect } from "@/lib/public-marketplace-pagination";
import {
  createPublicLocalizedMetadata,
  getPublicInventoryRobots,
} from "@/lib/public-metadata";
import { requirePublicSitePath } from "@/lib/public-site-access";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { Footer } from "../components/footer";
import { InventoryUnavailable } from "../components/inventory-states";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";
import { PublicRouteLoading } from "../components/public-route-loading";

interface HomeProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = async ({
  params,
  searchParams,
}: HomeProps): Promise<Metadata> => {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const isBg = locale === "bg";

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? `Разгледайте актуалните автомобили на ${leadSite.name} в ${getLeadCopy(locale).city}.`
      : `Browse current vehicles from ${leadSite.name} in ${getLeadCopy(locale).city}, ${getLeadCopy(locale).country}.`,
    locale,
    path: "/",
    robots: getPublicInventoryRobots(query),
    title: isBg
      ? `Автомобили от ${leadSite.name}`
      : `Vehicles for sale at ${leadSite.name}`,
  });
};

const MarketplaceResults = async ({ params, searchParams }: HomeProps) => {
  const { locale } = await params;
  let activeMode: "buy" | "lease" = "buy";

  try {
    const rawSearchParams = await searchParams;
    const filters = normalizePublicShowroomFilters(
      parseMarketplaceSearchParams(rawSearchParams)
    );
    if (
      rawSearchParams.location !== undefined ||
      rawSearchParams.radius !== undefined
    ) {
      redirect(
        buildMarketplaceSearchHref(
          filters,
          getLocalizedPath(normalizeSeoLocale(locale), "/")
        )
      );
    }
    activeMode = filters.category === "lease" ? "lease" : "buy";
    const hasSearchCriteria = createMarketplaceSearchParams(filters).size > 0;
    const desktopSearchVariant =
      !isDealershipSite && hasSearchCriteria ? "results" : "discovery";
    const [{ facets, listings, totalListings }, taxonomy] = await Promise.all([
      getPublicMarketplaceListings(filters),
      getPublicVehicleTaxonomy(filters.category),
    ]);
    const pageRedirect = getMarketplacePageRedirect({
      basePath: getLocalizedPath(normalizeSeoLocale(locale), "/"),
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
          appBaseUrl={isDealershipSite ? undefined : getPublicAppBaseUrl()}
          defaultViewMode="grid"
          desktopDiscoverySlot={
            isDealershipSite &&
            filters.category === "car" &&
            filters.sort === "recommended" &&
            filters.page === 1 ? (
              <DealerDesktopDiscoveryContent
                currentPath={getLocalizedPath(
                  normalizeSeoLocale(locale),
                  "/cars"
                )}
                listings={listings}
                locale={locale}
              />
            ) : undefined
          }
          desktopSearchVariant={desktopSearchVariant}
          filters={filters}
          inventoryFacets={facets}
          listings={listings}
          locale={locale}
          searchListings={getPublicInventorySearchListings(
            filters.category,
            listings
          )}
          taxonomy={taxonomy}
          totalListings={totalListings}
        />
        <Footer locale={locale} />
      </>
    );
  } catch (error) {
    unstable_rethrow(error);
    log.error("Marketplace discovery is temporarily unavailable.", { error });

    return (
      <PublicMarketplaceFrame
        activeMode={activeMode}
        locale={locale}
        mastheadVariant="discovery"
      >
        <InventoryUnavailable locale={locale} />
      </PublicMarketplaceFrame>
    );
  }
};

const Home = ({ params, searchParams }: HomeProps) => {
  requirePublicSitePath("/");
  return (
    <Suspense fallback={<PublicRouteLoading />}>
      <MarketplaceResults params={params} searchParams={searchParams} />
    </Suspense>
  );
};

export default Home;
