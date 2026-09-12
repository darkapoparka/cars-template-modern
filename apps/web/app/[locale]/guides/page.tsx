import { leadSite } from "@repo/marketplace";
import { normalizeSeoLocale } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { parseContentSearch } from "@/lib/public-content";
import { getPublicContentCards } from "@/lib/public-content-data";
import { createPublicLocalizedMetadata } from "@/lib/public-metadata";
import { getPublicWebBaseUrl } from "@/lib/public-url";
import { MobileContentHub } from "../components/mobile-content-hub";
import { PublicMarketplaceFrame } from "../components/public-marketplace-frame";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  const isBg = normalizeSeoLocale(locale) === "bg";
  return createPublicLocalizedMetadata({
    baseUrl: getPublicWebBaseUrl(),
    description: isBg
      ? `Съвети и статии от ${leadSite.shortName} за покупка, внос, финансиране и проверка на автомобил.`
      : `${leadSite.shortName} guides and articles on buying, importing, financing, and checking a vehicle.`,
    locale,
    path: "/guides",
    title: isBg ? "Съвети и статии" : "Guides and articles",
  });
};

export default async function GuidesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const normalizedLocale = normalizeSeoLocale(locale);

  return (
    <PublicMarketplaceFrame
      locale={normalizedLocale}
      showMobileDealerHeader={false}
      showMobileFooter={false}
    >
      <MobileContentHub
        initialSearch={parseContentSearch(await searchParams)}
        items={getPublicContentCards(normalizedLocale)}
        locale={normalizedLocale}
      />
    </PublicMarketplaceFrame>
  );
}
