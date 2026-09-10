import { getRelatedMarketplaceListings } from "@repo/database/marketplace";
import {
  buildMarketplaceSearchHref,
  formatMoney,
  getCategoryPath,
  getListingPath,
  getMockRelatedListings,
  leadSite,
  parseMarketplaceSearchParams,
  type VehicleListing,
} from "@repo/marketplace";
import { ListingDetail } from "@repo/marketplace-ui";
import { log } from "@repo/observability/log";
import { JsonLd } from "@repo/seo/json-ld";
import {
  getCanonicalUrl,
  getLocalizedPath,
  normalizeSeoLocale,
} from "@repo/seo/metadata";
import type { Metadata } from "next";
import { notFound, permanentRedirect, unstable_rethrow } from "next/navigation";
import { buildPublicListingDeliveryContactHref } from "@/lib/public-contact-context";
import { isPublicContactSubmissionAvailable } from "@/lib/public-contact-readiness";
import { getCurrentPublicDataMode } from "@/lib/public-data-policy";
import {
  hasRoutablePublicListingLeadDestination,
  isPublicListingLeadSubmissionAvailable,
} from "@/lib/public-listing-contact";
import { getRequestCachedPublicMarketplaceListing } from "@/lib/public-listing-read";
import { getPublicDemoMarketplaceListing } from "@/lib/public-marketplace-data";
import {
  createPublicLocalizedMetadata,
  getPublicInventoryRobots,
} from "@/lib/public-metadata";
import {
  createListingBreadcrumbStructuredData,
  createOfferStructuredData,
  createVehicleStructuredData,
} from "@/lib/public-structured-data";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { Footer } from "../../components/footer";
import { InventoryUnavailable } from "../../components/inventory-states";
import { PublicMarketplaceFrame } from "../../components/public-marketplace-frame";

interface ListingPageProps {
  readonly params: Promise<{
    locale: string;
    slug: string;
  }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Listing pages read request search params and production inventory at request
// time. Treating this route as static makes Next.js reject the render with
// DYNAMIC_SERVER_USAGE when a database-backed listing is requested.
export const dynamic = "force-dynamic";

const getAdvertisedPrice = (listing: VehicleListing) =>
  listing.supply?.nativePrice ?? listing.price;

const getListingDescription = (listing: VehicleListing, locale: string) =>
  `${formatMoney(getAdvertisedPrice(listing), locale)} - ${listing.spec.year} ${
    listing.spec.make
  } ${listing.spec.model} in ${listing.location.city}.`;

const getAbsoluteUrl = (path: string): string =>
  getCanonicalUrl(path, { baseUrl: getPublicWebBaseUrl() });

const getPersistedListing = async (
  slug: string,
  destinationCountryCode?: string
) => {
  if (getCurrentPublicDataMode() !== "database") {
    return null;
  }

  return getRequestCachedPublicMarketplaceListing(slug, destinationCountryCode);
};

const getListing = async (slug: string) => {
  const dataMode = getCurrentPublicDataMode();
  const persistedListing = await getPersistedListing(slug);

  if (persistedListing || dataMode === "database") {
    return persistedListing;
  }

  return dataMode === "demo" ? getPublicDemoMarketplaceListing(slug) : null;
};

const getRelatedListings = async (
  listing: NonNullable<Awaited<ReturnType<typeof getListing>>>,
  destinationCountryCode?: string
) => {
  const dataMode = getCurrentPublicDataMode();

  if (dataMode !== "database") {
    return dataMode === "demo"
      ? getMockRelatedListings(listing)
          .filter(
            (relatedListing) =>
              !destinationCountryCode ||
              relatedListing.supply?.delivery.eligibleCountryCodes.includes(
                destinationCountryCode
              ) ||
              (destinationCountryCode === "BG" &&
                relatedListing.location.country === "Bulgaria")
          )
          .map(
            (relatedListing) =>
              getPublicDemoMarketplaceListing(relatedListing.slug, {
                destinationCountryCode,
              }) ?? relatedListing
          )
      : [];
  }

  return getRelatedMarketplaceListings(listing, {
    destinationCountryCode,
  });
};

export const generateMetadata = async ({
  params,
  searchParams,
}: ListingPageProps): Promise<Metadata> => {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams]);
  let listing: Awaited<ReturnType<typeof getListing>> = null;

  try {
    listing = await getListing(slug);
  } catch (error) {
    unstable_rethrow(error);
    log.error("Listing metadata is unavailable.", { error, slug });
  }

  if (!listing) {
    const isBg = normalizeSeoLocale(locale) === "bg";

    return createPublicLocalizedMetadata({
      baseUrl: getPublicWebBaseUrl(),
      description: isBg
        ? "Тази обява не е налична в момента."
        : "This listing is not currently available.",
      locale,
      path: `/listing/${slug}`,
      robots: {
        follow: false,
        index: false,
      },
      title: isBg ? "Обявата не е налична" : "Listing unavailable",
    });
  }

  const listingUrl = getAbsoluteUrl(
    getLocalizedPath(normalizeSeoLocale(locale), getListingPath(listing))
  );

  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: getListingDescription(listing, locale),
    image: listing.images[0]?.url,
    locale,
    openGraph: {
      url: listingUrl,
    },
    path: getListingPath(listing),
    robots: getPublicInventoryRobots(query),
    title: listing.title,
  });
};

const ListingPage = async ({ params, searchParams }: ListingPageProps) => {
  const { locale, slug } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const { deliverTo } = parseMarketplaceSearchParams(await searchParams);
  const dataMode = getCurrentPublicDataMode();
  let persistedListing: Awaited<ReturnType<typeof getPersistedListing>> = null;

  try {
    persistedListing = await getPersistedListing(slug, deliverTo);
  } catch (error) {
    unstable_rethrow(error);
    log.error("Listing page is unavailable.", { error, slug });
    return (
      <PublicMarketplaceFrame locale={normalizedLocale}>
        <InventoryUnavailable locale={normalizedLocale} />
      </PublicMarketplaceFrame>
    );
  }
  let listing = persistedListing;

  if (dataMode === "demo") {
    listing = getPublicDemoMarketplaceListing(slug, {
      destinationCountryCode: deliverTo,
    });
  }

  if (!listing) {
    if (dataMode === "unavailable") {
      return (
        <PublicMarketplaceFrame locale={normalizedLocale}>
          <InventoryUnavailable locale={normalizedLocale} />
        </PublicMarketplaceFrame>
      );
    }
    notFound();
  }

  if (slug !== listing.slug) {
    permanentRedirect(
      buildMarketplaceSearchHref(
        { deliverTo },
        getLocalizedPath(normalizedLocale, getListingPath(listing))
      )
    );
  }

  const listingUrl = getAbsoluteUrl(
    getLocalizedPath(normalizedLocale, getListingPath(listing))
  );
  const categoryPath = getLocalizedPath(
    normalizedLocale,
    getCategoryPath(listing.category)
  );
  const marketplaceHref = buildMarketplaceSearchHref(
    {
      category: listing.category,
      deliverTo,
    },
    categoryPath
  );
  let contactHref: string | undefined = leadSite.staticDemoMode
    ? leadSite.contactUrl
    : undefined;

  if (
    !leadSite.staticDemoMode &&
    persistedListing &&
    isPublicListingLeadSubmissionAvailable() &&
    hasRoutablePublicListingLeadDestination(persistedListing) &&
    (!deliverTo ||
      (listing.supply?.delivery.status ?? listing.delivery?.status) !==
        "unavailable")
  ) {
    contactHref = `${getLocalizedPath(
      normalizedLocale,
      `/listing/${slug}/contact`
    )}${deliverTo ? `?deliverTo=${encodeURIComponent(deliverTo)}` : ""}`;
  } else if (
    !(leadSite.staticDemoMode || persistedListing) &&
    listing.supply &&
    isPublicContactSubmissionAvailable()
  ) {
    contactHref = buildPublicListingDeliveryContactHref({
      deliverTo,
      locale: normalizedLocale,
      slug,
    });
  }

  return (
    <>
      <JsonLd
        code={createVehicleStructuredData({
          baseUrl: getPublicWebBaseUrl(),
          listing,
          listingUrl,
        })}
      />
      <JsonLd
        code={createOfferStructuredData({
          listing,
          listingUrl,
        })}
      />
      <JsonLd
        code={createListingBreadcrumbStructuredData({
          baseUrl: getPublicWebBaseUrl(),
          listing,
          listingUrl,
          locale,
        })}
      />
      <ListingDetail
        contactHref={contactHref}
        destinationCountryCode={deliverTo}
        homeHref={getLocalizedPath(normalizedLocale, "/")}
        listing={listing}
        listingUrl={listingUrl}
        locale={normalizedLocale}
        marketplaceHref={marketplaceHref}
        relatedListings={await getRelatedListings(listing, deliverTo)}
      />
      <Footer locale={normalizedLocale} />
    </>
  );
};

export default ListingPage;
