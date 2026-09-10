import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { getCollectionPath } from "@repo/marketplace";
import { log } from "@repo/observability/log";
import { getLocalizedPath, normalizeSeoLocale } from "@repo/seo/metadata";
import { ArrowRight, CarFront } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  getChineseEvHybridCollection,
  PUBLIC_LISTING_PAGE_SIZE,
} from "@/lib/public-marketplace-data";
import {
  createPublicLocalizedMetadata,
  getPublicInventoryRobots,
} from "@/lib/public-metadata";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { InventoryUnavailable } from "../../components/inventory-states";
import { PublicInventoryList } from "../../components/public-inventory-list";
import { PublicMarketplaceFrame } from "../../components/public-marketplace-frame";
import { SupportRouteImage } from "../../components/support-route-image";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

const path = getCollectionPath("chinese-ev-hybrids");
const collectionCopy = {
  bg: {
    badge: "Редакторска колекция",
    description:
      "Колекцията показва само активни обяви за избрани марки и електрифицирани задвижвания. Проверявайте данните за конкретния автомобил, продавач, наличност, гаранция, сервиз и финансиране.",
    emptyDescription:
      "Разгледайте услугата ни за внос от Китай и поискайте конкретна оферта за автомобил.",
    emptyMessage: "В момента няма активни обяви в тази колекция.",
    emptyTitle: "Очакваме първите проверени обяви",
    heroAlt: "Електромобил в център за доставка и логистика",
    heroCaption: "Проверима наличност, произход и доставка",
    heroUnavailable: "Изображението не е налично",
    importAction: "Внос от Китай",
    listingHeading: "Актуални обяви",
    resultsLabel: "резултата",
    title: "Китайски електромобили и хибриди",
    truth:
      "Day & Night не твърди официално партньорство с показаните марки. Всяка оферта се потвърждава индивидуално.",
  },
  en: {
    badge: "Editorial collection",
    description:
      "This collection shows active listings for selected brands and electrified powertrains. Verify each vehicle's seller, availability, warranty, service, and finance details.",
    emptyDescription:
      "Explore our import service from China and request a specific vehicle quotation.",
    emptyMessage: "There are currently no active listings in this collection.",
    emptyTitle: "The first verified listings are coming",
    heroAlt: "Electric vehicle at a delivery and logistics facility",
    heroCaption: "Verifiable stock, origin, and delivery",
    heroUnavailable: "Image unavailable",
    importAction: "Import from China",
    listingHeading: "Current listings",
    resultsLabel: "results",
    title: "Chinese EVs and hybrids",
    truth:
      "Day & Night does not claim an official partnership with the displayed brands. Every offer is confirmed individually.",
  },
} as const;

const parsePage = (value?: string | string[]) => {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

export const generateMetadata = async ({
  params,
  searchParams,
}: PageProps): Promise<Metadata> => {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const isBg = locale === "bg";
  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? "Подбрани активни обяви за китайски електромобили и хибриди в България, без твърдение за партньорство или официално одобрение."
      : "Curated active listings for Chinese EVs and hybrids in Bulgaria, without claiming partnership or official endorsement.",
    locale,
    path,
    robots: getPublicInventoryRobots(query),
    title: isBg
      ? "Китайски електромобили и хибриди"
      : "Chinese EVs and hybrids",
  });
};

export default async function ChineseCollectionPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);
  const copy = collectionCopy[normalizedLocale];
  const page = parsePage((await searchParams).page);

  try {
    const data = await getChineseEvHybridCollection(page);
    const totalPages = Math.max(
      1,
      Math.ceil(data.totalListings / PUBLIC_LISTING_PAGE_SIZE)
    );
    if (page > totalPages) {
      const localizedPath = getLocalizedPath(normalizedLocale, path);
      redirect(
        totalPages > 1 ? `${localizedPath}?page=${totalPages}` : localizedPath
      );
    }

    return (
      <PublicMarketplaceFrame activeMode="buy" locale={locale}>
        <main className="mx-auto max-w-[90rem] px-3 py-6 sm:px-4 lg:px-6 lg:py-8">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="p-5 sm:p-7">
                <Badge variant="secondary">{copy.badge}</Badge>
                <h1 className="mt-3 font-semibold text-page-title tracking-tight sm:text-page-title-lg">
                  {copy.title}
                </h1>
                <p className="mt-3 max-w-3xl text-muted-foreground text-sm leading-6">
                  {copy.description}
                </p>
                <p className="mt-3 text-muted-foreground text-xs">
                  {copy.truth}
                </p>
              </div>
              <div className="relative min-h-48 overflow-hidden border-border border-t bg-secondary lg:min-h-full lg:border-t-0 lg:border-l">
                <SupportRouteImage
                  alt={copy.heroAlt}
                  fallbackLabel={copy.heroUnavailable}
                  loading="eager"
                  sizes="(min-width: 1024px) 320px, 100vw"
                  src="/images/directory/china-ev-importer-profile.webp"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-5 py-3 text-white backdrop-blur-[2px]">
                  <p className="font-medium text-sm">{copy.heroCaption}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-4">
              <h2 className="font-semibold text-dialog-title">
                {copy.listingHeading}
              </h2>
              <p className="text-muted-foreground text-sm">
                {data.totalListings} {copy.resultsLabel}
              </p>
            </div>
            {data.totalListings === 0 ? (
              <div className="rounded-xl border border-border bg-card px-5 py-8 text-center sm:px-8">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <CarFront aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-3 font-semibold text-base">
                  {copy.emptyTitle}
                </h3>
                <p className="mx-auto mt-1 max-w-lg text-muted-foreground text-sm leading-6">
                  {copy.emptyDescription}
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link
                    href={getLocalizedPath(normalizedLocale, "/imports/china")}
                  >
                    {copy.importAction}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <PublicInventoryList
                basePath={path}
                emptyMessage={copy.emptyMessage}
                listings={data.listings}
                locale={locale}
                page={page}
                totalListings={data.totalListings}
              />
            )}
          </section>
        </main>
      </PublicMarketplaceFrame>
    );
  } catch (error) {
    unstable_rethrow(error);
    log.error("Chinese EV and hybrid collection is unavailable.", { error });
    return (
      <PublicMarketplaceFrame activeMode="buy" locale={locale}>
        <InventoryUnavailable locale={locale} />
      </PublicMarketplaceFrame>
    );
  }
}
